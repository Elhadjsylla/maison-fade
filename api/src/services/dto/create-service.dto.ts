import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// Catalogue des prestations (CDC §4.2). Prix en FCFA (entier), durée en minutes.
export class CreateServiceDto {
  @IsString()
  categorieId!: string;

  @IsString()
  nom!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  prix!: number;

  @IsInt()
  @Min(1)
  dureeMin!: number;

  @IsOptional()
  @IsBoolean()
  prixVariable?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleEnLigne?: boolean;
}
