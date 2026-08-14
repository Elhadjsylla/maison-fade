import { IsBoolean, IsObject, IsOptional, IsString, Matches } from 'class-validator';

// Téléphone sénégalais +221 7X XXX XX XX (CDC §4.5), identifiant unique du client.
export class CreateClientDto {
  @IsString()
  nom!: string;

  @IsString()
  @Matches(/^\+221 7\d \d{3} \d{2} \d{2}$/, {
    message: 'Téléphone attendu au format +221 7X XXX XX XX',
  })
  telephone!: string;

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
