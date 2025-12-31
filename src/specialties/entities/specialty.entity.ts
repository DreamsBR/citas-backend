import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Specialist } from '../../specialists/entities/specialist.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('specialties')
export class Specialty {
  @ApiProperty({ example: 'uuid', description: 'ID único de la especialidad' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Terapia Deportiva', description: 'Nombre de la especialidad' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'Tratamiento especializado para lesiones deportivas', description: 'Descripción' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 50.00, description: 'Precio base de la especialidad' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @ApiProperty({ example: 60, description: 'Duración de la cita en minutos' })
  @Column({ type: 'int', default: 60 })
  duration: number;

  @ApiProperty({ example: true, description: 'Si la especialidad está activa' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Specialist, (specialist) => specialist.specialty)
  specialists: Specialist[];

  @OneToMany(() => Appointment, (appointment) => appointment.specialty)
  appointments: Appointment[];
}
