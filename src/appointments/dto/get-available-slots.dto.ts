import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString } from 'class-validator';

export class GetAvailableSlotsDto {
  @ApiProperty({ example: 'uuid', description: 'ID del especialista' })
  @IsUUID()
  specialistId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
