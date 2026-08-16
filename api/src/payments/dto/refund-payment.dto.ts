import { IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  motif!: string;
}
