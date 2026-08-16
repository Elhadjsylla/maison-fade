import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  nom!: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prixAchat?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prixVente?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantite?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seuilBas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seuilCritique?: number;

  @IsOptional()
  @IsString()
  fournisseur?: string;
}
