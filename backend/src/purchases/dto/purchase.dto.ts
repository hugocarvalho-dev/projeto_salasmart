import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

const MAX_QTY_PER_ITEM = 20;
const MAX_ITEMS = 100;

export const ROOMS = [
  "Sala 01",
  "Sala 02",
  "Sala 03",
  "Sala 04",
  "Sala 05",
] as const;

export class PurchaseItemDto {
  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_ITEM, {
    message: `Quantidade máxima de ${MAX_QTY_PER_ITEM} unidades por produto.`,
  })
  qty!: number;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreatePurchaseDto {
  @IsString()
  @MinLength(2, { message: "Informe o nome de quem está pedindo." })
  @MaxLength(120)
  customerName!: string;

  @IsIn(ROOMS, { message: "Sala inválida." })
  room!: (typeof ROOMS)[number];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITEMS, { message: `No máximo ${MAX_ITEMS} itens por compra.` })
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];
}

export class DeletePurchaseDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
