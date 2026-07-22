import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/settings.dto";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@ApiBearerAuth()
@Roles("administrador")
@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get("categories")
  @Public()
  listCategories() {
    return this.service.listCategories();
  }

  @Post("categories")
  @Roles("administrador")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch("categories/:id")
  @Roles("administrador")
  updateCategory(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  @HttpCode(204)
  @Roles("administrador")
  removeCategory(@Param("id", ParseIntPipe) id: number) {
    return this.service.removeCategory(id);
  }
}
