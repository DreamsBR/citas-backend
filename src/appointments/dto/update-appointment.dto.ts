import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class UpdateAppointmentDto {
  @ApiProperty({ example: 'uuid', description: 'ID de la especialidad', required: false })
  @IsUUID()
  @IsOptional()
  specialtyId?: string;

  @ApiProperty({ example: 'uuid', description: 'ID del especialista', required: false })
  @IsUUID()
  @IsOptional()
  specialistId?: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de la cita (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  appointmentDate?: string;

  @ApiProperty({ example: '14:00', description: 'Hora de la cita (HH:MM)', required: false })
  @IsString()
  @IsOptional()
  appointmentTime?: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del paciente', required: false })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email del paciente', required: false })
  @IsEmail()
  @IsOptional()
  patientEmail?: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono del paciente', required: false })
  @IsString()
  @IsOptional()
  patientPhone?: string;

  @ApiProperty({ example: 'Dolor en rodilla izquierda', description: 'Notas', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 'confirmed',
    description: 'Estado de la cita',
    enum: AppointmentStatus,
    required: false
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
