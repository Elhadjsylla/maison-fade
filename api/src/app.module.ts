import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { SalonsModule } from './salons/salons.module';
import { SettingsModule } from './settings/settings.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { ServicesModule } from './services/services.module';
import { ClientsModule } from './clients/clients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { StockModule } from './stock/stock.module';
import { StaffModule } from './staff/staff.module';
import { StatsModule } from './stats/stats.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    AuditModule,
    AlertsModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    SalonsModule,
    SettingsModule,
    ServiceCategoriesModule,
    ServicesModule,
    ClientsModule,
    AppointmentsModule,
    CashSessionsModule,
    TicketsModule,
    PaymentsModule,
    StockModule,
    StaffModule,
    StatsModule,
  ],
})
export class AppModule {}
