import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid', description: 'ID de la especialidad' })
  @IsUUID()
  specialtyId: string;

  @ApiProperty({ example: 'uuid', description: 'ID del especialista' })
  @IsUUID()
  specialistId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de la cita (YYYY-MM-DD)' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '14:00', description: 'Hora de la cita (HH:MM)' })
  @IsString()
  appointmentTime: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del paciente' })
  @IsString()
  patientName: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email del paciente' })
  @IsEmail()
  patientEmail: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono del paciente' })
  @IsString()
  patientPhone: string;

  @ApiProperty({ example: 'Dolor en rodilla izquierda', description: 'Notas', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
