import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialty } from './entities/specialty.entity';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
  ) {}

  async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    const specialty = this.specialtyRepository.create(createSpecialtyDto);
    return await this.specialtyRepository.save(specialty);
  }

  async findAll(): Promise<Specialty[]> {
    return await this.specialtyRepository.find({
      where: { isActive: true },
      relations: ['specialists'],
      order: { name: 'ASC' },
    });
  }

  async findAllIncludingInactive(): Promise<Specialty[]> {
    return await this.specialtyRepository.find({
      relations: ['specialists'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Specialty> {
    const specialty = await this.specialtyRepository.findOne({
      where: { id },
      relations: ['specialists'],
    });

    if (!specialty) {
      throw new NotFoundException(`Especialidad con ID ${id} no encontrada`);
    }

    return specialty;
  }

  async update(
    id: string,
    updateSpecialtyDto: UpdateSpecialtyDto,
  ): Promise<Specialty> {
    await this.findOne(id); // Verificar que existe

    await this.specialtyRepository.update(id, updateSpecialtyDto);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.findOne(id);
    await this.specialtyRepository.remove(specialty);
  }
}
