import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { Availability } from './availability.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('specialists')
export class Specialist {
  @ApiProperty({ example: 'uuid', description: 'ID único del especialista' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'María', description: 'Nombre del especialista' })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ example: 'González', description: 'Apellido del especialista' })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiProperty({ example: 'maria@fisioterapia.com', description: 'Email del especialista' })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono del especialista' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @ApiProperty({ example: 'Especialista con 10 años de experiencia', description: 'Biografía' })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty({ example: true, description: 'Si el especialista está activo' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: '/uploads/specialists/photo.jpg', description: 'URL de la foto del especialista', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string;

  @ApiProperty({ example: 2500.00, description: 'Salario mensual del especialista', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlySalary: number;

  @ApiProperty({ type: () => Specialty, description: 'Especialidad del fisioterapeuta' })
  @Column({ type: 'uuid' })
  specialtyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Specialty, (specialty) => specialty.specialists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialtyId' })
  specialty: Specialty;

  @OneToMany(() => Availability, (availability) => availability.specialist)
  availabilities: Availability[];

  @OneToMany(() => Appointment, (appointment) => appointment.specialist)
  appointments: Appointment[];
}
