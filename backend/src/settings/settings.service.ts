import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/settings.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { label: "asc" } });
  }

  async createCategory(dto: CreateCategoryDto) {
    const label = dto.label.trim();
    const exists = await this.prisma.category.findFirst({
      where: { label: { equals: label, mode: "insensitive" } },
    });
    if (exists) {
      throw new ConflictException(`A categoria "${label}" já existe.`);
    }
    return this.prisma.category.create({ data: { label } });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const current = await this.getCategory(id);
    const label = dto.label?.trim();
    if (!label || label === current.label) return current;

    const [updated] = await this.prisma.$transaction([
      this.prisma.category.update({ where: { id }, data: { label } }),
      this.prisma.product.updateMany({
        where: { category: { equals: current.label, mode: "insensitive" } },
        data: { category: label },
      }),
    ]);
    return updated;
  }

  async removeCategory(id: number) {
    const current = await this.getCategory(id);
    const inUse = await this.prisma.product.count({
      where: { active: true, category: { equals: current.label, mode: "insensitive" } },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `A categoria "${current.label}" está em uso por ${inUse} produto(s) e não pode ser excluída.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async getCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoria ${id} não encontrada.`);
    }
    return category;
  }
}
