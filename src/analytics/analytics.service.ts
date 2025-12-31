import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';

export interface TopSpecialistStats {
  specialistId: string;
  specialistName: string;
  specialtyName: string;
  appointmentCount: number;
  totalRevenue: number;
}

export interface AppointmentsByStatus {
  status: string;
  count: number;
}

export interface RevenueBySpecialty {
  specialtyId: string;
  specialtyName: string;
  appointmentCount: number;
  totalRevenue: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Top especialistas por número de citas
   */
  async getTopSpecialists(limit: number = 10): Promise<TopSpecialistStats[]> {
    const results = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.specialist', 'specialist')
      .leftJoin('appointment.specialty', 'specialty')
      .select('specialist.id', 'specialistId')
      .addSelect(
        "CONCAT(specialist.firstName, ' ', specialist.lastName)",
        'specialistName',
      )
      .addSelect('specialty.name', 'specialtyName')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .addSelect('SUM(appointment.price)', 'totalRevenue')
      .where('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
      })
      .groupBy('specialist.id')
      .addGroupBy('specialist.firstName')
      .addGroupBy('specialist.lastName')
      .addGroupBy('specialty.name')
      .orderBy('appointmentCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      specialistId: r.specialistId,
      specialistName: r.specialistName,
      specialtyName: r.specialtyName,
      appointmentCount: parseInt(r.appointmentCount),
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }

  /**
   * Citas por estado
   */
  async getAppointmentsByStatus(): Promise<AppointmentsByStatus[]> {
    const results = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status')
      .getRawMany();

    return results.map((r) => ({
      status: r.status,
      count: parseInt(r.count),
    }));
  }

  /**
   * Ingresos por especialidad
   */
  async getRevenueBySpecialty(): Promise<RevenueBySpecialty[]> {
    const results = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.specialty', 'specialty')
      .select('specialty.id', 'specialtyId')
      .addSelect('specialty.name', 'specialtyName')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .addSelect('SUM(appointment.price)', 'totalRevenue')
      .where('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
      })
      .groupBy('specialty.id')
      .addGroupBy('specialty.name')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      specialtyId: r.specialtyId,
      specialtyName: r.specialtyName,
      appointmentCount: parseInt(r.appointmentCount),
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }

  /**
   * Dashboard stats generales
   */
  async getDashboardStats() {
    const totalAppointments = await this.appointmentRepository.count();
    const pendingAppointments = await this.appointmentRepository.count({
      where: { status: AppointmentStatus.PENDING },
    });
    const confirmedAppointments = await this.appointmentRepository.count({
      where: { status: AppointmentStatus.CONFIRMED },
    });

    const revenueResult = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('SUM(appointment.price)', 'totalRevenue')
      .where('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
      })
      .getRawOne();

    return {
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      totalRevenue: parseFloat(revenueResult?.totalRevenue) || 0,
    };
  }
}
