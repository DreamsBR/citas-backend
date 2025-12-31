import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { Specialty } from './entities/specialty.entity';

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva especialidad' })
  @ApiResponse({ status: 201, description: 'Especialidad creada', type: Specialty })
  async create(@Body() createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    return await this.specialtiesService.create(createSpecialtyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las especialidades activas' })
  @ApiResponse({ status: 200, description: 'Lista de especialidades', type: [Specialty] })
  async findAll(): Promise<Specialty[]> {
    return await this.specialtiesService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Obtener todas las especialidades (incluidas inactivas)' })
  @ApiResponse({ status: 200, description: 'Lista completa', type: [Specialty] })
  async findAllIncludingInactive(): Promise<Specialty[]> {
    return await this.specialtiesService.findAllIncludingInactive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener especialidad por ID' })
  @ApiResponse({ status: 200, description: 'Especialidad encontrada', type: Specialty })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Specialty> {
    return await this.specialtiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad actualizada', type: Specialty })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialtyDto: UpdateSpecialtyDto,
  ): Promise<Specialty> {
    return await this.specialtiesService.update(id, updateSpecialtyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.specialtiesService.remove(id);
    return { message: 'Especialidad eliminada exitosamente' };
  }
}
