import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StockMovementType } from '@prisma/client';

// Pour type=inventaire, `quantite` est le NOUVEAU compte physique total (pas
// un delta) — le service calcule l'écart. Pour entree/sortie/perte, c'est un
// delta appliqué au stock courant.
export class CreateStockMovementDto {
  @IsString()
  productId!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsInt()
  @Min(0)
  quantite!: number;

  @IsOptional()
  @IsString()
  motif?: string;
}
