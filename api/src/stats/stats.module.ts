import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PaymentsModule } from '../payments/payments.module';
import { StockModule } from '../stock/stock.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [PaymentsModule, StockModule, StaffModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
