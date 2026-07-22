import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Public()
  findAll() {
    return this.service.findAll(false);
  }

  @Get(":id")
  @Public()
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles("administrador")
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @Roles("administrador")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @Roles("administrador")
  deactivate(@Param("id", ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }
}
