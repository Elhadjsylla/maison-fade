import { IsBoolean, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+221 7\d \d{3} \d{2} \d{2}$/, {
    message: 'Téléphone attendu au format +221 7X XXX XX XX',
  })
  telephone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  coiffeurPrefereId?: string;

  @IsOptional()
  @IsBoolean()
  consentementSms?: boolean;
}
