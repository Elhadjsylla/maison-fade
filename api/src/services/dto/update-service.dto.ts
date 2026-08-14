import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  categorieId?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prix?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  dureeMin?: number;

  @IsOptional()
  @IsBoolean()
  prixVariable?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleEnLigne?: boolean;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
