import { IsOptional, IsString, Length, MinLength } from 'class-validator';

// Connexion par identifiant + PIN (appareil enregistré) ou identifiant + mot
// de passe (appareil inconnu) — CDC §4.1. Exactement l'un des deux doit être fourni.
export class LoginDto {
  @IsString()
  login!: string;

  @IsOptional()
  @IsString()
  @Length(4, 6)
  pin?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsString()
  deviceLabel?: string;
}
