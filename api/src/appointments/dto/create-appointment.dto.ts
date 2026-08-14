import { IsDateString, IsOptional, IsString } from 'class-validator';

// Durée calculée côté serveur à partir du service (CDC §4.3) — jamais confiée au client.
export class CreateAppointmentDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsString()
  serviceId!: string;

  @IsString()
  coiffeurId!: string;

  @IsDateString()
  debut!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
