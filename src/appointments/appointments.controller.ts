import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../auth/decorators/get-admin.decorator';
import { Admin } from '../admin/entities/admin.entity';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ========== ENDPOINTS PÚBLICOS ==========

  @Get('public/available-slots')
  @ApiTags('public')
  @ApiOperation({ summary: 'Obtener slots disponibles (público)' })
  @ApiQuery({ name: 'specialistId', description: 'ID del especialista' })
  @ApiQuery({ name: 'date', description: 'Fecha (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Lista de horarios disponibles' })
  async getAvailableSlots(
    @Query('specialistId', ParseUUIDPipe) specialistId: string,
    @Query('date') date: string,
  ): Promise<{ slots: string[] }> {
    const dateObj = new Date(date);
    const slots = await this.appointmentsService.getAvailableSlots(
      specialistId,
      dateObj,
    );
    return { slots };
  }

  @Post('public/book')
  @ApiTags('public')
  @ApiOperation({ summary: 'Reservar cita (público)' })
  @ApiResponse({ status: 201, description: 'Cita creada (pendiente de confirmación)', type: Appointment })
  @ApiResponse({ status: 409, description: 'Horario no disponible' })
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @Get('public/token/:token')
  @ApiTags('public')
  @ApiOperation({ summary: 'Ver cita con token único (público)' })
  @ApiResponse({ status: 200, description: 'Detalles de la cita', type: Appointment })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  async getByToken(@Param('token') token: string): Promise<Appointment> {
    return await this.appointmentsService.findByToken(token);
  }

  @Patch('public/token/:token/cancel')
  @ApiTags('public')
  @ApiOperation({ summary: 'Cancelar cita con token único (público)' })
  @ApiResponse({ status: 200, description: 'Cita cancelada', type: Appointment })
  async cancelByToken(@Param('token') token: string): Promise<Appointment> {
    return await this.appointmentsService.cancelByToken(token);
  }

  // ========== ENDPOINTS ADMIN (PROTEGIDOS) ==========

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las citas (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiResponse({ status: 200, description: 'Lista de citas', type: [Appointment] })
  async findAll(
    @Query('status') status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    if (status) {
      return await this.appointmentsService.findByStatus(status);
    }
    return await this.appointmentsService.findAll();
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener citas para calendario (admin)' })
  @ApiQuery({ name: 'startDate', description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Citas en el rango', type: [Appointment] })
  async getCalendarAppointments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Appointment[]> {
    return await this.appointmentsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cita por ID (admin)' })
  @ApiResponse({ status: 200, description: 'Cita encontrada', type: Appointment })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Appointment> {
    return await this.appointmentsService.findOne(id);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar/rechazar cita (admin)' })
  @ApiResponse({ status: 200, description: 'Cita actualizada', type: Appointment })
  async confirmAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() confirmDto: ConfirmAppointmentDto,
    @GetAdmin() admin: Admin,
  ): Promise<Appointment> {
    return await this.appointmentsService.confirmAppointment(
      id,
      confirmDto,
      admin.id,
    );
  }
}
