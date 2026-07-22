import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

const PUBLIC_SELECT = {
  id: true,
  name: true,
  category: true,
  unit: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCategory(label: string) {
    const category = await this.prisma.category.findFirst({
      where: { label: { equals: label, mode: "insensitive" } },
    });
    if (!category) {
      throw new BadRequestException(
        `Categoria "${label}" não existe. Cadastre-a em Configurações › Listas suspensas.`,
      );
    }
    return category.label;
  }

  async findAll(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: "asc" },
      select: PUBLIC_SELECT,
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado.`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const category = await this.assertCategory(dto.category);
    return this.prisma.product.create({
      data: { ...dto, category, unit: dto.unit ?? "" },
      select: PUBLIC_SELECT,
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.ensureExists(id);
    const data =
      dto.category !== undefined
        ? { ...dto, category: await this.assertCategory(dto.category) }
        : dto;
    return this.prisma.product.update({
      where: { id },
      data,
      select: PUBLIC_SELECT,
    });
  }

  async deactivate(id: number) {
    await this.ensureExists(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
      select: PUBLIC_SELECT,
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException(`Produto ${id} não encontrado.`);
    }
  }
}
