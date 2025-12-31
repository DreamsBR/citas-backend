import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateSpecialistDto {
  @ApiProperty({ example: 'María', description: 'Nombre del especialista' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'González', description: 'Apellido del especialista' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'maria@fisioterapia.com', description: 'Email del especialista' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Especialista con 10 años de experiencia',
    description: 'Biografía',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'uuid', description: 'ID de la especialidad' })
  @IsUUID()
  specialtyId: string;

  @ApiProperty({ example: true, description: 'Si está activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
