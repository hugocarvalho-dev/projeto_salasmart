import { Logger } from "@nestjs/common";

import { JWT_DEV_SECRET } from "../auth/auth.constants";

const logger = new Logger("EnvValidation");

const MIN_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProd = config.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  const jwtSecret = String(config.JWT_SECRET ?? "").trim();
  if (!jwtSecret || jwtSecret === JWT_DEV_SECRET) {
    (isProd ? errors : warnings).push(
      "JWT_SECRET ausente ou usando o valor de desenvolvimento. Defina um segredo forte e único.",
    );
  } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
    (isProd ? errors : warnings).push(
      `JWT_SECRET muito curto (< ${MIN_SECRET_LENGTH} caracteres). Use um valor aleatório longo.`,
    );
  }

  const corsOrigin = String(config.CORS_ORIGIN ?? "").trim();
  if (isProd && !corsOrigin) {
    errors.push(
      "CORS_ORIGIN ausente. Em produção defina explicitamente a(s) origem(ns) do frontend.",
    );
  }

  if (!config.DATABASE_URL) {
    errors.push("DATABASE_URL ausente. Configure a conexão com o PostgreSQL.");
  }

  for (const w of warnings) logger.warn(w);

  if (errors.length > 0) {
    const message = [
      "Configuração de ambiente inválida — abortando o boot:",
      ...errors.map((e) => `  • ${e}`),
    ].join("\n");
    throw new Error(message);
  }

  return config;
}
