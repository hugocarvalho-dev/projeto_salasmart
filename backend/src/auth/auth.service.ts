import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../prisma/prisma.service";

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  administrador: boolean;
  teamMemberId: number | null;
}

const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "admin";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithPassword(
    username: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> {
    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      throw new UnauthorizedException("Usuário ou senha inválidos.");
    }

    let member =
      (await this.prisma.teamMember.findFirst({
        where: { protected: true },
        orderBy: { id: "asc" },
      })) ?? (await this.prisma.teamMember.findFirst({ orderBy: { id: "asc" } }));

    if (!member) {
      member = await this.prisma.teamMember.create({
        data: {
          firstName: "Administrador",
          lastName: "",
          email: "admin@local",
          administrador: true,
          protected: true,
        },
      });
    }

    const user: AuthUser = {
      sub: `team:${member.id}`,
      email: member.email,
      name: `${member.firstName} ${member.lastName}`.trim() || "Administrador",
      administrador: member.administrador,
      teamMemberId: member.id,
    };

    const token = await this.jwt.signAsync(user);
    this.logger.log(`Login OK: ${user.email}`);
    return { token, user };
  }

  async currentUser(email: string): Promise<AuthUser> {
    const user = await this.resolveAccess(email);
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado ou sem acesso.");
    }
    return user;
  }

  private async resolveAccess(email: string): Promise<AuthUser | null> {
    const member = await this.prisma.teamMember.findUnique({ where: { email } });
    if (!member) return null;

    return {
      sub: `team:${member.id}`,
      email,
      name: `${member.firstName} ${member.lastName}`.trim(),
      administrador: member.administrador,
      teamMemberId: member.id,
    };
  }
}
