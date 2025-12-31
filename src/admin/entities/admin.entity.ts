import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
}

@Entity('admins')
export class Admin {
  @ApiProperty({ example: 'uuid', description: 'ID único del administrador' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin@fisioterapia.com', description: 'Email del administrador' })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del administrador' })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del administrador' })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiProperty({ enum: AdminRole, description: 'Rol del administrador' })
  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  role: AdminRole;

  @ApiProperty({ example: true, description: 'Si el administrador está activo' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Appointment, (appointment) => appointment.confirmedByAdmin)
  confirmedAppointments: Appointment[];
}
