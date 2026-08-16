import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// La quantité ne se modifie jamais ici — uniquement via POST /stock/movements
// (entrée, sortie, inventaire, perte), pour que chaque variation reste tracée.
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  nom?: string;

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
  seuilBas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seuilCritique?: number;

  @IsOptional()
  @IsString()
  fournisseur?: string;
}
