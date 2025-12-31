import { Controller, Get, Query, ParseIntPipe, ParseUUIDPipe, UseGuards } from '@nestjs/common';
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

  @Get('specialist-revenue')
  @ApiOperation({ summary: 'Reporte de ingresos por especialista (admin)' })
  @ApiQuery({ name: 'specialistId', description: 'ID del especialista' })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reporte de ingresos' })
  @ApiResponse({ status: 404, description: 'Especialista no encontrado' })
  async getSpecialistRevenue(
    @Query('specialistId', ParseUUIDPipe) specialistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [yearStart, monthStart, dayStart] = startDate.split('-').map(Number);
    const [yearEnd, monthEnd, dayEnd] = endDate.split('-').map(Number);

    const startDateObj = new Date(yearStart, monthStart - 1, dayStart);
    const endDateObj = new Date(yearEnd, monthEnd - 1, dayEnd, 23, 59, 59);

    return await this.analyticsService.getSpecialistRevenue(
      specialistId,
      startDateObj,
      endDateObj,
    );
  }

  @Get('specialist-hours')
  @ApiOperation({ summary: 'Reporte de horas trabajadas por especialista (admin)' })
  @ApiQuery({ name: 'specialistId', description: 'ID del especialista' })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reporte de horas' })
  @ApiResponse({ status: 404, description: 'Especialista no encontrado' })
  async getSpecialistHours(
    @Query('specialistId', ParseUUIDPipe) specialistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [yearStart, monthStart, dayStart] = startDate.split('-').map(Number);
    const [yearEnd, monthEnd, dayEnd] = endDate.split('-').map(Number);

    const startDateObj = new Date(yearStart, monthStart - 1, dayStart);
    const endDateObj = new Date(yearEnd, monthEnd - 1, dayEnd, 23, 59, 59);

    return await this.analyticsService.getSpecialistHours(
      specialistId,
      startDateObj,
      endDateObj,
    );
  }

  @Get('specialist-profit')
  @ApiOperation({ summary: 'Reporte de profit por especialista (admin)' })
  @ApiQuery({ name: 'specialistId', description: 'ID del especialista' })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reporte de profit' })
  @ApiResponse({ status: 404, description: 'Especialista no encontrado' })
  async getSpecialistProfit(
    @Query('specialistId', ParseUUIDPipe) specialistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const [yearStart, monthStart, dayStart] = startDate.split('-').map(Number);
    const [yearEnd, monthEnd, dayEnd] = endDate.split('-').map(Number);

    const startDateObj = new Date(yearStart, monthStart - 1, dayStart);
    const endDateObj = new Date(yearEnd, monthEnd - 1, dayEnd, 23, 59, 59);

    return await this.analyticsService.getSpecialistProfit(
      specialistId,
      startDateObj,
      endDateObj,
    );
  }
}
