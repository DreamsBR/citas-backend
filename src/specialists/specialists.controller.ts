import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Specialist } from './entities/specialist.entity';
import { Availability } from './entities/availability.entity';

@ApiTags('specialists')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  // Specialists endpoints
  @Post()
  @ApiOperation({ summary: 'Crear nuevo especialista' })
  @ApiResponse({ status: 201, description: 'Especialista creado', type: Specialist })
  async create(@Body() createSpecialistDto: CreateSpecialistDto): Promise<Specialist> {
    return await this.specialistsService.create(createSpecialistDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los especialistas activos' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Filtrar por especialidad' })
  @ApiResponse({ status: 200, description: 'Lista de especialistas', type: [Specialist] })
  async findAll(@Query('specialtyId') specialtyId?: string): Promise<Specialist[]> {
    if (specialtyId) {
      return await this.specialistsService.findBySpecialty(specialtyId);
    }
    return await this.specialistsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener especialista por ID' })
  @ApiResponse({ status: 200, description: 'Especialista encontrado', type: Specialist })
  @ApiResponse({ status: 404, description: 'Especialista no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Specialist> {
    return await this.specialistsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar especialista' })
  @ApiResponse({ status: 200, description: 'Especialista actualizado', type: Specialist })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialistDto: UpdateSpecialistDto,
  ): Promise<Specialist> {
    return await this.specialistsService.update(id, updateSpecialistDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar especialista' })
  @ApiResponse({ status: 200, description: 'Especialista eliminado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.specialistsService.remove(id);
    return { message: 'Especialista eliminado exitosamente' };
  }

  // Availability endpoints
  @Post(':id/availability')
  @ApiOperation({ summary: 'Agregar disponibilidad a especialista' })
  @ApiResponse({ status: 201, description: 'Disponibilidad agregada', type: Availability })
  async addAvailability(
    @Param('id', ParseUUIDPipe) specialistId: string,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<Availability> {
    return await this.specialistsService.addAvailability(
      specialistId,
      createAvailabilityDto,
    );
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Obtener disponibilidades de un especialista' })
  @ApiResponse({ status: 200, description: 'Lista de disponibilidades', type: [Availability] })
  async getAvailabilities(
    @Param('id', ParseUUIDPipe) specialistId: string,
  ): Promise<Availability[]> {
    return await this.specialistsService.getAvailabilities(specialistId);
  }

  @Patch('availability/:availabilityId')
  @ApiOperation({ summary: 'Actualizar disponibilidad' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada', type: Availability })
  async updateAvailability(
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    return await this.specialistsService.updateAvailability(
      availabilityId,
      updateAvailabilityDto,
    );
  }

  @Delete('availability/:availabilityId')
  @ApiOperation({ summary: 'Eliminar disponibilidad' })
  @ApiResponse({ status: 200, description: 'Disponibilidad eliminada' })
  async removeAvailability(
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
  ): Promise<{ message: string }> {
    await this.specialistsService.removeAvailability(availabilityId);
    return { message: 'Disponibilidad eliminada exitosamente' };
  }
}
