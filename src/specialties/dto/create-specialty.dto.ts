import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Terapia Deportiva', description: 'Nombre de la especialidad' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Tratamiento especializado para lesiones deportivas',
    description: 'Descripción de la especialidad',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 50.00, description: 'Precio base' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 60, description: 'Duración en minutos', default: 60 })
  @IsNumber()
  @Min(15)
  @IsOptional()
  duration?: number;

  @ApiProperty({ example: true, description: 'Si está activa', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
