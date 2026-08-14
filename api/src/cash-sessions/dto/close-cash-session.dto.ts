import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// Clôture Z (CDC §4.4) : comptage des espèces, écart calculé côté serveur.
export class CloseCashSessionDto {
  @IsInt()
  @Min(0)
  totalCompte!: number;

  @IsOptional()
  @IsString()
  motifEcart?: string;
}
