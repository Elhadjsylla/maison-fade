import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DiscountAuthorizationDto {
  @IsString()
  login!: string;

  @IsString()
  pin!: string;
}

// Remise en % ou en montant (CDC §4.4). Motif obligatoire au-delà de 10 % —
// vérifié en service. Au-delà du plafond du rôle, une autorisation d'un
// gérant/admin (PIN) est requise (déblocage — CDC §2.3).
export class ApplyDiscountDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pourcent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  montant?: number;

  @IsOptional()
  @IsString()
  motif?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountAuthorizationDto)
  authorization?: DiscountAuthorizationDto;
}
