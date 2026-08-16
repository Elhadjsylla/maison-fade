import {
  Body,
  Controller,
  Delete,
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
import { StockService } from './stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get('products')
  @Permissions('stock.ecrire')
  findAllProducts() {
    return this.stock.findAllProducts();
  }

  @Post('products')
  @Permissions('stock.ecrire')
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.stock.createProduct(dto, user);
  }

  @Patch('products/:id')
  @Permissions('stock.ecrire')
  updateProduct(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.stock.updateProduct(id, dto, user);
  }

  @Delete('products/:id')
  @Permissions('stock.ecrire')
  archiveProduct(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.archiveProduct(id, user);
  }

  @Get('movements')
  @Permissions('stock.ecrire')
  listMovements(@Query('productId') productId?: string) {
    return this.stock.listMovements(productId);
  }

  @Post('movements')
  @Permissions('stock.ecrire')
  createMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.stock.createMovement(dto, user);
  }
}
