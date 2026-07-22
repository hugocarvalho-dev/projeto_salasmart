import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JWT_AUDIENCE, JWT_COOKIE, JWT_DEV_SECRET, JWT_ISSUER } from "./auth.constants";
import type { AuthUser } from "./auth.service";

const cookieExtractor = (req: Request): string | null => {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.[JWT_COOKIE] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.get<string>("JWT_SECRET") ?? JWT_DEV_SECRET,
      ignoreExpiration: false,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  validate(payload: AuthUser): AuthUser {
    return payload;
  }
}
