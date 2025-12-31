import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { Specialist } from '../specialists/entities/specialist.entity';

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

export interface SpecialistRevenueReport {
  specialistId: string;
  specialistName: string;
  specialtyName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  appointmentCount: number;
  totalRevenue: number;
  averageRevenuePerAppointment: number;
}

export interface SpecialistHoursReport {
  specialistId: string;
  specialistName: string;
  specialtyName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  appointmentCount: number;
  totalHours: number;
  averageHoursPerDay: number;
}

export interface SpecialistProfitReport {
  specialistId: string;
  specialistName: string;
  specialtyName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  monthlySalary: number;
  proportionalSalary: number;
  profit: number;
  profitMargin: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Specialist)
    private specialistRepository: Repository<Specialist>,
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

  /**
   * Reporte de ingresos por especialista en un periodo
   */
  async getSpecialistRevenue(
    specialistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SpecialistRevenueReport> {
    // Verificar que el especialista existe
    const specialist = await this.specialistRepository.findOne({
      where: { id: specialistId },
      relations: ['specialty'],
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    // Obtener citas del periodo
    const appointments = await this.appointmentRepository.find({
      where: {
        specialistId,
        appointmentDate: Between(startDate, endDate),
        status: AppointmentStatus.COMPLETED,
      },
    });

    const appointmentCount = appointments.length;
    const totalRevenue = appointments.reduce(
      (sum, apt) => sum + parseFloat(apt.price.toString()),
      0,
    );
    const averageRevenuePerAppointment =
      appointmentCount > 0 ? totalRevenue / appointmentCount : 0;

    return {
      specialistId: specialist.id,
      specialistName: `${specialist.firstName} ${specialist.lastName}`,
      specialtyName: specialist.specialty.name,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      appointmentCount,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageRevenuePerAppointment: parseFloat(
        averageRevenuePerAppointment.toFixed(2),
      ),
    };
  }

  /**
   * Reporte de horas trabajadas por especialista en un periodo
   */
  async getSpecialistHours(
    specialistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SpecialistHoursReport> {
    // Verificar que el especialista existe
    const specialist = await this.specialistRepository.findOne({
      where: { id: specialistId },
      relations: ['specialty'],
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    // Obtener citas del periodo
    const appointments = await this.appointmentRepository.find({
      where: {
        specialistId,
        appointmentDate: Between(startDate, endDate),
        status: AppointmentStatus.COMPLETED,
      },
    });

    const appointmentCount = appointments.length;
    // Cada cita dura 1 hora
    const totalHours = appointmentCount;

    // Calcular días en el periodo
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const averageHoursPerDay = diffDays > 0 ? totalHours / diffDays : 0;

    return {
      specialistId: specialist.id,
      specialistName: `${specialist.firstName} ${specialist.lastName}`,
      specialtyName: specialist.specialty.name,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      appointmentCount,
      totalHours,
      averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2)),
    };
  }

  /**
   * Reporte de profit por especialista en un periodo
   * Profit = Ingresos - (Salario proporcional al periodo)
   */
  async getSpecialistProfit(
    specialistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SpecialistProfitReport> {
    // Verificar que el especialista existe
    const specialist = await this.specialistRepository.findOne({
      where: { id: specialistId },
      relations: ['specialty'],
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    // Obtener citas del periodo
    const appointments = await this.appointmentRepository.find({
      where: {
        specialistId,
        appointmentDate: Between(startDate, endDate),
        status: AppointmentStatus.COMPLETED,
      },
    });

    const totalRevenue = appointments.reduce(
      (sum, apt) => sum + parseFloat(apt.price.toString()),
      0,
    );

    // Calcular salario proporcional al periodo
    // Días en el periodo
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Salario mensual promedio de 30 días
    const monthlySalary = specialist.monthlySalary
      ? parseFloat(specialist.monthlySalary.toString())
      : 0;
    const proportionalSalary = (monthlySalary / 30) * diffDays;

    // Calcular profit
    const profit = totalRevenue - proportionalSalary;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      specialistId: specialist.id,
      specialistName: `${specialist.firstName} ${specialist.lastName}`,
      specialtyName: specialist.specialty.name,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      monthlySalary: parseFloat(monthlySalary.toFixed(2)),
      proportionalSalary: parseFloat(proportionalSalary.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
    };
  }
}
