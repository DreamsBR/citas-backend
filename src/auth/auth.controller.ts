import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetAdmin } from './decorators/get-admin.decorator';
import { Admin } from '../admin/entities/admin.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo administrador' })
  @ApiResponse({ status: 201, description: 'Admin registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async register(@Body() registerAdminDto: RegisterAdminDto) {
    return await this.authService.register(registerAdminDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de administrador' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del admin autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del admin' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@GetAdmin() admin: Admin) {
    return admin;
  }
}
