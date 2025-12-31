import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { customAlphabet } from 'nanoid';
import { Specialty } from '../../specialties/entities/specialty.entity';
import { Specialist } from '../../specialists/entities/specialist.entity';
import { Admin } from '../../admin/entities/admin.entity';
import { EmailLog } from '../../emails/entities/email-log.entity';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12,
);

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('appointments')
export class Appointment {
  @ApiProperty({ example: 'uuid', description: 'ID único de la cita' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Specialty, description: 'Especialidad de la cita' })
  @Column({ type: 'uuid' })
  specialtyId: string;

  @ApiProperty({ type: () => Specialist, description: 'Especialista asignado' })
  @Column({ type: 'uuid' })
  specialistId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de la cita' })
  @Column({ type: 'date' })
  appointmentDate: Date;

  @ApiProperty({ example: '14:00', description: 'Hora de la cita' })
  @Column({ type: 'time' })
  appointmentTime: string;

  @ApiProperty({ enum: AppointmentStatus, description: 'Estado de la cita' })
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({ example: 50.00, description: 'Precio de la cita' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del paciente' })
  @Column({ type: 'varchar', length: 100 })
  patientName: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email del paciente' })
  @Column({ type: 'varchar', length: 100 })
  patientEmail: string;

  @ApiProperty({ example: '+34 600 123 456', description: 'Teléfono del paciente' })
  @Column({ type: 'varchar', length: 20 })
  patientPhone: string;

  @ApiProperty({ example: 'V1StGXR8_Z5j', description: 'Token único para acceso sin login' })
  @Column({ type: 'varchar', length: 20, unique: true })
  uniqueToken: string;

  @ApiProperty({ example: 'Dolor en rodilla izquierda', description: 'Notas del paciente' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Fecha de confirmación', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @ApiProperty({ type: () => Admin, nullable: true, description: 'Admin que confirmó' })
  @Column({ type: 'uuid', nullable: true })
  confirmedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Specialty, (specialty) => specialty.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialtyId' })
  specialty: Specialty;

  @ManyToOne(() => Specialist, (specialist) => specialist.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialistId' })
  specialist: Specialist;

  @ManyToOne(() => Admin, (admin) => admin.confirmedAppointments, {
    nullable: true,
  })
  @JoinColumn({ name: 'confirmedById' })
  confirmedByAdmin: Admin;

  @OneToMany(() => EmailLog, (emailLog) => emailLog.appointment)
  emailLogs: EmailLog[];

  @BeforeInsert()
  generateUniqueToken() {
    if (!this.uniqueToken) {
      this.uniqueToken = nanoid();
    }
  }
}
