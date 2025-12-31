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
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
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
    // Parsear fecha sin conversión UTC
    // date viene como "2025-12-31"
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

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
    // Parsear fechas sin conversión UTC
    const [yearStart, monthStart, dayStart] = startDate.split('-').map(Number);
    const [yearEnd, monthEnd, dayEnd] = endDate.split('-').map(Number);

    const startDateObj = new Date(yearStart, monthStart - 1, dayStart);
    const endDateObj = new Date(yearEnd, monthEnd - 1, dayEnd, 23, 59, 59);

    return await this.appointmentsService.findByDateRange(
      startDateObj,
      endDateObj,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar cita (admin)' })
  @ApiResponse({ status: 200, description: 'Cita actualizada', type: Appointment })
  @ApiResponse({ status: 400, description: 'No se puede editar cita completada o cancelada' })
  @ApiResponse({ status: 404, description: 'Cita/Especialidad/Especialista no encontrado' })
  @ApiResponse({ status: 409, description: 'Horario no disponible' })
  async updateAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentsService.updateAppointment(id, updateDto);
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

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar cita como completada (admin)' })
  @ApiResponse({ status: 200, description: 'Cita marcada como completada', type: Appointment })
  @ApiResponse({ status: 400, description: 'La cita ya está completada o está cancelada' })
  async completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Appointment> {
    return await this.appointmentsService.completeAppointment(id);
  }
}
