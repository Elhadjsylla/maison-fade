import { IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nom!: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'login : lettres, chiffres, points ou tirets uniquement',
  })
  login!: string;

  @IsEnum(Role)
  role!: Role;

  // Mot de passe (pas de PIN) : un compte tout neuf n'a encore aucun appareil
  // approuvé, or le PIN n'est utilisable que sur un appareil déjà enregistré
  // (CDC §4.1, cf. AuthService.login) — la toute première connexion doit donc
  // se faire par mot de passe. L'admin choisit un PIN avec la personne sur
  // place ensuite, une fois son appareil approuvé (voir Paramètres > Accès).
  @IsString()
  @MinLength(8)
  password!: string;
}
