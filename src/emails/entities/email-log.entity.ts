import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('email_logs')
export class EmailLog {
  @ApiProperty({ example: 'uuid', description: 'ID único del log' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Appointment, description: 'Cita asociada' })
  @Column({ type: 'uuid' })
  appointmentId: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email del destinatario' })
  @Column({ type: 'varchar', length: 100 })
  recipientEmail: string;

  @ApiProperty({ example: 'Confirmación de cita', description: 'Asunto del email' })
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @ApiProperty({ enum: EmailStatus, description: 'Estado del envío' })
  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @ApiProperty({ description: 'Fecha de envío', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @ApiProperty({ description: 'Mensaje de error si falló', nullable: true })
  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Appointment, (appointment) => appointment.emailLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
