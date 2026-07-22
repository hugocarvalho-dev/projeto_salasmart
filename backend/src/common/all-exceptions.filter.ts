import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`${req.method} ${req.url} → ${status}`, exception.stack);
      }
      res.status(status).json(typeof body === "string" ? { message: body, statusCode: status } : body);
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, message } = this.mapPrismaError(exception);
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`${req.method} ${req.url} → ${status} (Prisma ${exception.code})`, exception.stack);
      }
      res.status(status).json({ statusCode: status, message });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Requisição inválida.",
      });
      return;
    }

    this.logger.error(
      `${req.method} ${req.url} → erro não tratado`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro interno do servidor.",
    });
  }

  private mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
    status: HttpStatus;
    message: string;
  } {
    switch (err.code) {
      case "P2002":
        return {
          status: HttpStatus.CONFLICT,
          message: "Registro já existe (valor duplicado em campo único).",
        };
      case "P2025":
        return { status: HttpStatus.NOT_FOUND, message: "Registro não encontrado." };
      case "P2003":
        return {
          status: HttpStatus.CONFLICT,
          message: "Operação viola um vínculo entre registros.",
        };
      case "P2000":
        return { status: HttpStatus.BAD_REQUEST, message: "Valor excede o tamanho permitido." };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Erro interno do servidor.",
        };
    }
  }
}
