import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// Identité du salon (CDC §4.10) — modification réservée à l'admin.
export class UpdateSalonDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  fauteuils?: number;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
