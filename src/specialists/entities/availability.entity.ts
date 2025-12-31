import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Specialist } from './specialist.entity';

@Entity('availabilities')
export class Availability {
  @ApiProperty({ example: 'uuid', description: 'ID único de la disponibilidad' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Specialist, description: 'Especialista asociado' })
  @Column({ type: 'uuid' })
  specialistId: string;

  @ApiProperty({ example: 1, description: 'Día de la semana (0=domingo, 6=sábado)' })
  @Column({ type: 'int' })
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio' })
  @Column({ type: 'time' })
  startTime: string;

  @ApiProperty({ example: '22:00', description: 'Hora de fin' })
  @Column({ type: 'time' })
  endTime: string;

  @ApiProperty({ example: true, description: 'Si esta disponibilidad está activa' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Specialist, (specialist) => specialist.availabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialistId' })
  specialist: Specialist;
}
