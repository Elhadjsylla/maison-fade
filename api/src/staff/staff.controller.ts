import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StaffService } from './staff.service';
import { AttendanceService } from './attendance.service';
import { CommissionsService } from './commissions.service';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

// Vue équipe pour gérant/admin (CDC §3.2/§4.6). `staff.gerer` vaut aussi
// « limite » pour un coiffeur (son propre pointage, via /me) — ces routes
// à portée équipe leur restent donc explicitement fermées ici.
@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {
  constructor(
    private readonly staff: StaffService,
    private readonly attendance: AttendanceService,
    private readonly commissions: CommissionsService,
  ) {}

  @Get('profiles')
  @Permissions('staff.gerer')
  listProfiles(@CurrentUser() user: AuthenticatedUser) {
    this.assertTeamAccess(user);
    return this.staff.listProfiles(user.salonId);
  }

  @Patch('profiles/:userId')
  @Permissions('staff.gerer')
  updateProfile(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    this.assertTeamAccess(user);
    return this.staff.updateProfile(userId, dto);
  }

  @Get('attendance')
  @Permissions('staff.gerer')
  teamAttendance(@CurrentUser() user: AuthenticatedUser) {
    this.assertTeamAccess(user);
    return this.attendance.teamToday(user.salonId);
  }

  @Get('attendance-month')
  @Permissions('staff.gerer')
  teamAttendanceMonth(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    this.assertTeamAccess(user);
    return this.attendance.teamMonth(user.salonId, period);
  }

  @Get('commissions')
  @Permissions('staff.gerer')
  commissionsRecap(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    this.assertTeamAccess(user);
    return this.commissions.previewAll(user.salonId, period ?? currentPeriod());
  }

  @Post('commissions/generate')
  @Permissions('staff.gerer')
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateCommissionDto) {
    this.assertTeamAccess(user);
    return this.commissions.generateBatch(user.salonId, dto.periode, user.id, dto.userId);
  }

  @Patch('commissions/:id/mark-paid')
  @Permissions('staff.gerer')
  markPaid(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertTeamAccess(user);
    return this.commissions.markPaid(id, user.id);
  }

  private assertTeamAccess(user: AuthenticatedUser) {
    if (user.role === 'coiffeur') {
      throw new ForbiddenException(
        'Réservé à un gérant ou un administrateur — utilisez /me pour vos données personnelles',
      );
    }
  }
}
