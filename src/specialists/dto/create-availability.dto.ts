import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({ example: 1, description: 'Día de la semana (0=domingo, 6=sábado)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (formato HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '22:00', description: 'Hora de fin (formato HH:MM)' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: true, description: 'Si está activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
