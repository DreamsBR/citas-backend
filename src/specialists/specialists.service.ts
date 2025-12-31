import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialist } from './entities/specialist.entity';
import { Availability } from './entities/availability.entity';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private specialistRepository: Repository<Specialist>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  // Specialists CRUD
  async create(createSpecialistDto: CreateSpecialistDto): Promise<Specialist> {
    const specialist = this.specialistRepository.create(createSpecialistDto);
    return await this.specialistRepository.save(specialist);
  }

  async findAll(): Promise<Specialist[]> {
    return await this.specialistRepository.find({
      where: { isActive: true },
      relations: ['specialty', 'availabilities'],
      order: { firstName: 'ASC' },
    });
  }

  async findBySpecialty(specialtyId: string): Promise<Specialist[]> {
    return await this.specialistRepository.find({
      where: { specialtyId, isActive: true },
      relations: ['specialty', 'availabilities'],
      order: { firstName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Specialist> {
    const specialist = await this.specialistRepository.findOne({
      where: { id },
      relations: ['specialty', 'availabilities'],
    });

    if (!specialist) {
      throw new NotFoundException(`Especialista con ID ${id} no encontrado`);
    }

    return specialist;
  }

  async update(
    id: string,
    updateSpecialistDto: UpdateSpecialistDto,
  ): Promise<Specialist> {
    await this.findOne(id); // Verificar que existe
    await this.specialistRepository.update(id, updateSpecialistDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const specialist = await this.findOne(id);
    await this.specialistRepository.remove(specialist);
  }

  // Availability management
  async addAvailability(
    specialistId: string,
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<Availability> {
    await this.findOne(specialistId); // Verificar que el especialista existe

    const availability = this.availabilityRepository.create({
      ...createAvailabilityDto,
      specialistId,
    });

    return await this.availabilityRepository.save(availability);
  }

  async getAvailabilities(specialistId: string): Promise<Availability[]> {
    return await this.availabilityRepository.find({
      where: { specialistId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateAvailability(
    availabilityId: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId },
    });

    if (!availability) {
      throw new NotFoundException(
        `Disponibilidad con ID ${availabilityId} no encontrada`,
      );
    }

    await this.availabilityRepository.update(
      availabilityId,
      updateAvailabilityDto,
    );

    const updated = await this.availabilityRepository.findOne({
      where: { id: availabilityId },
    });

    return updated!;
  }

  async removeAvailability(availabilityId: string): Promise<void> {
    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId },
    });

    if (!availability) {
      throw new NotFoundException(
        `Disponibilidad con ID ${availabilityId} no encontrada`,
      );
    }

    await this.availabilityRepository.remove(availability);
  }
}
