import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
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
  ],
})
export class AppModule {}
