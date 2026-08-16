import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { CommissionsService } from './commissions.service';
import { PunchAttendanceDto } from './dto/punch-attendance.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

// Espace personnel du coiffeur (CDC §3.3 — « Mon pointage », « Ma commission »).
@Controller('me')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffMeController {
  constructor(
    private readonly attendance: AttendanceService,
    private readonly commissions: CommissionsService,
  ) {}

  @Post('attendance')
  @Permissions('staff.gerer')
  punch(@CurrentUser() user: AuthenticatedUser, @Body() dto: PunchAttendanceDto) {
    return this.attendance.punch(user.id, user.salonId, dto.action);
  }

  @Get('attendance')
  @Permissions('staff.gerer')
  attendanceSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month?: string,
  ) {
    return this.attendance.monthSummary(user.id, month);
  }

  @Get('commission')
  @Permissions('stats.perso')
  commission(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    return this.commissions.preview(user.id, period ?? currentPeriod());
  }
}
