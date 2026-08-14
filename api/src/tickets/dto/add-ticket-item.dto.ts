import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddTicketItemDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantite?: number;
}
