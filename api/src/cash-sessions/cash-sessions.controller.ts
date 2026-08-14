import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CashSessionsService } from './cash-sessions.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('cash-sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CashSessionsController {
  constructor(private readonly cashSessions: CashSessionsService) {}

  @Get('current')
  @Permissions('caisse.session')
  getCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.cashSessions.getCurrent(user.salonId);
  }

  @Post()
  @Permissions('caisse.session')
  open(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OpenCashSessionDto,
  ) {
    return this.cashSessions.open(user.salonId, user.id, dto);
  }

  @Patch(':id/close')
  @Permissions('caisse.session')
  close(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CloseCashSessionDto,
  ) {
    return this.cashSessions.close(id, user.id, dto);
  }
}
