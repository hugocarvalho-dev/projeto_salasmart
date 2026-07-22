import { Body, Controller, Delete, Get, Param, ParseBoolPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { AuthUser } from "../auth/auth.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { CreatePurchaseDto, DeletePurchaseDto } from "./dto/purchase.dto";
import { PurchasesService } from "./purchases.service";

@ApiTags("purchases")
@Controller("purchases")
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  create(@Body() dto: CreatePurchaseDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles("administrador")
  @ApiQuery({ name: "includeDeleted", type: Boolean, required: false })
  @ApiQuery({ name: "month", type: String, required: false, description: "Mês no formato AAAA-MM" })
  list(
    @Query("includeDeleted", new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
    @Query("month") month?: string,
  ) {
    return this.service.list(includeDeleted ?? false, month);
  }

  @Get("months")
  @ApiBearerAuth()
  @Roles("administrador")
  months() {
    return this.service.months();
  }

  @Get(":id/receipt")
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  receipt(@Param("id") id: string) {
    return this.service.receipt(id);
  }

  @Get(":id")
  @ApiBearerAuth()
  @Roles("administrador")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @Roles("administrador")
  softDelete(
    @Param("id") id: string,
    @Body() dto: DeletePurchaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.softDelete(id, dto, user.name);
  }
}
