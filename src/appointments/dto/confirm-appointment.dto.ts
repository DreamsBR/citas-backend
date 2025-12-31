import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class ConfirmAppointmentDto {
  @ApiProperty({ enum: AppointmentStatus, description: 'Nuevo estado' })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ example: 'Notas del admin', required: false })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
