import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { JWT_COOKIE, JWT_MAX_AGE_MS } from "./auth.constants";
import { AuthService, type AuthUser } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./public.decorator";

const IS_PROD = process.env.NODE_ENV === "production";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.loginWithPassword(dto.username, dto.password);
    res.cookie(JWT_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: JWT_MAX_AGE_MS,
      path: "/",
    });
    return { user };
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.currentUser(user.email);
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(JWT_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      path: "/",
    });
    return { ok: true };
  }
}
