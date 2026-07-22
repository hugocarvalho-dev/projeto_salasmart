import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateTeamMemberDto, UpdateTeamMemberDto } from "./dto/team-member.dto";

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.teamMember.findMany({ orderBy: { firstName: "asc" } });
  }

  async findOne(id: number) {
    const member = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
    return member;
  }

  create(dto: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName ?? "",
        email: dto.email,
        administrador: true,
      },
    });
  }

  async update(id: number, dto: UpdateTeamMemberDto) {
    await this.findOne(id);
    return this.prisma.teamMember.update({
      where: { id },
      data: { ...dto, administrador: true },
    });
  }

  async remove(id: number) {
    const member = await this.findOne(id);
    if (member.protected) {
      throw new BadRequestException("Este usuário é protegido e não pode ser removido.");
    }
    await this.prisma.teamMember.delete({ where: { id } });
  }
}
