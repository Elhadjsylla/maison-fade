import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffMeController } from './staff-me.controller';
import { StaffService } from './staff.service';
import { AttendanceService } from './attendance.service';
import { CommissionsService } from './commissions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [StaffController, StaffMeController],
  providers: [StaffService, AttendanceService, CommissionsService],
  exports: [StaffService, AttendanceService, CommissionsService],
})
export class StaffModule {}
