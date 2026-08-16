import { IsOptional, IsString, Matches } from 'class-validator';

export class GenerateCommissionDto {
  // Format AAAA-MM (ex. 2026-08).
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  periode!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
