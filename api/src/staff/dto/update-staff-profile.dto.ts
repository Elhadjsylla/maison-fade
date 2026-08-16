import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsString()
  specialite?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  objectifMensuel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  tauxCommission?: number;
}
