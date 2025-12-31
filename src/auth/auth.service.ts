import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from '../admin/entities/admin.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async register(registerAdminDto: RegisterAdminDto): Promise<{ admin: Admin; token: string }> {
    const { email, password, firstName, lastName, role } = registerAdminDto;

    // Verificar si el email ya existe
    const existingAdmin = await this.adminRepository.findOne({ where: { email } });
    if (existingAdmin) {
      throw new ConflictException('Email ya registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear admin
    const admin = this.adminRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    await this.adminRepository.save(admin);

    // Generar token
    const token = this.generateToken(admin);

    // No retornar password
    const { password: _pwd, ...adminWithoutPassword } = admin;

    return { admin: adminWithoutPassword as Admin, token };
  }

  async login(loginDto: LoginDto): Promise<{ admin: Admin; token: string }> {
    const { email, password } = loginDto;

    // Buscar admin
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!admin.isActive) {
      throw new UnauthorizedException('Admin inactivo');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
    const token = this.generateToken(admin);

    // No retornar password
    const { password: _, ...adminWithoutPassword } = admin;

    return { admin: adminWithoutPassword as Admin, token };
  }

  private generateToken(admin: Admin): string {
    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateAdmin(adminId: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin no encontrado');
    }

    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword as Admin;
  }
}
