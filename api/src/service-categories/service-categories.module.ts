import { Module } from '@nestjs/common';
import { ServiceCategoriesController } from './service-categories.controller';

@Module({
  controllers: [ServiceCategoriesController],
})
export class ServiceCategoriesModule {}
