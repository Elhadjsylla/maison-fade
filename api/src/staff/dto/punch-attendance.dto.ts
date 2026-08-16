import { IsIn } from 'class-validator';

export class PunchAttendanceDto {
  @IsIn(['arrivee', 'pause', 'reprise', 'depart'])
  action!: 'arrivee' | 'pause' | 'reprise' | 'depart';
}
