import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { AdminRole } from '../../admin/entities/admin.entity';

export class RegisterAdminDto {
  @ApiProperty({ example: 'admin@fisioterapia.com', description: 'Email del administrador' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: AdminRole, description: 'Rol', default: AdminRole.ADMIN })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;
}
