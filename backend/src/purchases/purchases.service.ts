import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseDto, DeletePurchaseDto } from "./dto/purchase.dto";

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, active: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = dto.items.map((i) => {
      const product = byId.get(i.productId);
      if (!product) {
        throw new NotFoundException(`Produto ${i.productId} não encontrado.`);
      }
      if (!product.active) {
        throw new BadRequestException(`Produto "${product.name}" está inativo e não pode ser pedido.`);
      }
      return {
        productId: product.id,
        name: product.name,
        qty: i.qty,
      };
    });

    return this.prisma.purchase.create({
      data: {
        customerName: dto.customerName.trim(),
        room: dto.room,
        date: new Date(),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
          })),
        },
      },
      include: { items: true },
    });
  }

  list(includeDeleted = false, month?: string) {
    const where: { deletedAt?: null; date?: { gte: Date; lt: Date } } = includeDeleted
      ? {}
      : { deletedAt: null };

    const range = this.monthRange(month);
    if (range) where.date = range;

    return this.prisma.purchase.findMany({
      where,
      include: { items: true },
      orderBy: { date: "desc" },
    });
  }

  private monthRange(month?: string): { gte: Date; lt: Date } | undefined {
    if (!month) return undefined;
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return undefined;
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) return undefined;
    return {
      gte: new Date(year, monthIndex, 1, 0, 0, 0, 0),
      lt: new Date(year, monthIndex + 1, 1, 0, 0, 0, 0),
    };
  }

  async months(): Promise<string[]> {
    const rows = await this.prisma.purchase.findMany({ select: { date: true } });
    const set = new Set(
      rows.map((r) => `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`),
    );
    return [...set].sort((a, b) => b.localeCompare(a));
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!purchase) {
      throw new NotFoundException(`Pedido ${id} não encontrado.`);
    }
    return purchase;
  }

  async receipt(id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: { product: { select: { category: true } } },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!purchase) {
      throw new NotFoundException(`Pedido ${id} não encontrado.`);
    }
    return {
      id: purchase.id,
      customerName: purchase.customerName,
      room: purchase.room,
      date: purchase.date,
      items: purchase.items.map((item, index) => ({
        index: index + 1,
        name: item.name,
        category: item.product?.category ?? "—",
        qty: item.qty,
      })),
    };
  }

  async softDelete(id: string, dto: DeletePurchaseDto, deletedBy: string) {
    const purchase = await this.findOne(id);
    if (purchase.deletedAt) {
      throw new BadRequestException("Pedido já está excluído.");
    }
    return this.prisma.purchase.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        deletionReason: dto.reason,
      },
      include: { items: true },
    });
  }
}
