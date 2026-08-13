import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  deviceId!: string;

  @IsString()
  refreshToken!: string;
}
