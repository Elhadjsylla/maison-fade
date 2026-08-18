import { IsString, Matches } from 'class-validator';

export class ResetPinDto {
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN : 4 à 6 chiffres' })
  pin!: string;
}
