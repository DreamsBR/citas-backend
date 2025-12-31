import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Estadísticas generales del dashboard (admin)' })
  @ApiResponse({ status: 200, description: 'Stats del dashboard' })
  async getDashboardStats() {
    return await this.analyticsService.getDashboardStats();
  }

  @Get('top-specialists')
  @ApiOperation({ summary: 'Top especialistas por citas (admin)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número de resultados', type: Number })
  @ApiResponse({ status: 200, description: 'Top especialistas' })
  async getTopSpecialists(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return await this.analyticsService.getTopSpecialists(limit || 10);
  }

  @Get('appointments-by-status')
  @ApiOperation({ summary: 'Citas agrupadas por estado (admin)' })
  @ApiResponse({ status: 200, description: 'Citas por estado' })
  async getAppointmentsByStatus() {
    return await this.analyticsService.getAppointmentsByStatus();
  }

  @Get('revenue-by-specialty')
  @ApiOperation({ summary: 'Ingresos por especialidad (admin)' })
  @ApiResponse({ status: 200, description: 'Ingresos por especialidad' })
  async getRevenueBySpecialty() {
    return await this.analyticsService.getRevenueBySpecialty();
  }
}
