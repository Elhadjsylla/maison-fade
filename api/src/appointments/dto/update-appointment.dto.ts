import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatut } from '@prisma/client';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  debut?: string;

  @IsOptional()
  @IsString()
  coiffeurId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatut)
  statut?: AppointmentStatut;

  @IsOptional()
  @IsString()
  note?: string;
}
