import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Specialist } from '../specialists/entities/specialist.entity';
import { Availability } from '../specialists/entities/availability.entity';
import { Specialty } from '../specialties/entities/specialty.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Specialist)
    private specialistRepository: Repository<Specialist>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(Specialty)
    private specialtyRepository: Repository<Specialty>,
    private emailsService: EmailsService,
  ) {}

  /**
   * Obtiene slots disponibles para un especialista en una fecha específica
   * Horario: 8am - 9pm (última cita a las 9pm, que termina a las 10pm)
   */
  async getAvailableSlots(
    specialistId: string,
    date: Date,
  ): Promise<string[]> {
    // Verificar que el especialista existe
    const specialist = await this.specialistRepository.findOne({
      where: { id: specialistId },
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    // Obtener el día de la semana (0 = domingo, 6 = sábado)
    const dayOfWeek = date.getDay();

    // Verificar disponibilidad del especialista para ese día
    const availability = await this.availabilityRepository.findOne({
      where: {
        specialistId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return []; // Sin disponibilidad este día
    }

    // Generar todos los slots posibles (8am - 9pm)
    const allSlots: string[] = [];
    for (let hour = 8; hour <= 21; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      allSlots.push(timeSlot);
    }

    // Obtener citas existentes para ese día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener citas activas (pending, confirmed, completed)
    // NO incluir cancelled porque esos slots están disponibles
    const existingAppointments = await this.appointmentRepository.find({
      where: {
        specialistId,
        appointmentDate: Between(startOfDay, endOfDay),
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ]),
      },
    });

    // Filtrar slots ocupados
    // IMPORTANTE: appointmentTime viene de DB como "09:00:00" (con segundos)
    // pero allSlots se genera como "09:00" (sin segundos)
    // Por eso necesitamos truncar los segundos para que coincidan
    const occupiedSlots = existingAppointments.map((apt) =>
      apt.appointmentTime.substring(0, 5), // "09:00:00" -> "09:00"
    );

    const availableSlots = allSlots.filter(
      (slot) => !occupiedSlots.includes(slot),
    );

    return availableSlots;
  }

  /**
   * Crear nueva cita (público - desde landing)
   */
  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      specialtyId,
      specialistId,
      appointmentDate,
      appointmentTime,
      patientName,
      patientEmail,
      patientPhone,
      notes,
    } = createAppointmentDto;

    // Verificar que la especialidad existe
    const specialty = await this.specialtyRepository.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    // Verificar que el especialista existe y pertenece a la especialidad
    const specialist = await this.specialistRepository.findOne({
      where: { id: specialistId, specialtyId },
    });

    if (!specialist) {
      throw new NotFoundException(
        'Especialista no encontrado o no pertenece a esta especialidad',
      );
    }

    // Validar que la fecha/hora esté disponible
    // Parsear fecha sin conversión UTC (importante para Perú UTC-5)
    const dateStr = typeof appointmentDate === 'string' ? appointmentDate.split('T')[0] : appointmentDate;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const availableSlots = await this.getAvailableSlots(specialistId, date);

    if (!availableSlots.includes(appointmentTime)) {
      throw new ConflictException('Horario no disponible');
    }

    // Validar que la hora esté en rango (8am-9pm)
    const hour = parseInt(appointmentTime.split(':')[0]);
    if (hour < 8 || hour > 21) {
      throw new BadRequestException(
        'Horario fuera del rango permitido (8am-9pm)',
      );
    }

    // VALIDACIÓN FINAL: Double-check justo antes de guardar
    // Previene race condition si dos usuarios reservan simultáneamente
    const conflictingAppointment = await this.appointmentRepository.findOne({
      where: {
        specialistId,
        appointmentDate: Between(
          new Date(date.setHours(0, 0, 0, 0)),
          new Date(date.setHours(23, 59, 59, 999)),
        ),
        appointmentTime,
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ]),
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException(
        'Este horario acaba de ser reservado. Por favor, selecciona otro horario.',
      );
    }

    // Crear la cita
    const appointment = this.appointmentRepository.create({
      specialtyId,
      specialistId,
      appointmentDate: date,
      appointmentTime,
      price: specialty.basePrice,
      patientName,
      patientEmail,
      patientPhone,
      notes,
      status: AppointmentStatus.PENDING,
    });

    return await this.appointmentRepository.save(appointment);
  }

  /**
   * Obtener todas las citas (admin)
   */
  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      relations: ['specialty', 'specialist', 'confirmedByAdmin'],
      order: { appointmentDate: 'DESC', appointmentTime: 'DESC' },
    });
  }

  /**
   * Obtener citas por estado (admin)
   */
  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { status },
      relations: ['specialty', 'specialist'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
    });
  }

  /**
   * Obtener cita por ID
   */
  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['specialty', 'specialist', 'confirmedByAdmin'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  /**
   * Obtener cita por token único (público)
   */
  async findByToken(token: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { uniqueToken: token },
      relations: ['specialty', 'specialist'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  /**
   * Actualizar cita (admin)
   */
  async updateAppointment(
    id: string,
    updateDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // No permitir editar citas completadas o canceladas
    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'No se pueden editar citas completadas o canceladas',
      );
    }

    const {
      specialtyId,
      specialistId,
      appointmentDate,
      appointmentTime,
      patientName,
      patientEmail,
      patientPhone,
      notes,
      status,
    } = updateDto;

    // Si se cambia especialidad, validar y actualizar precio
    if (specialtyId && specialtyId !== appointment.specialtyId) {
      const specialty = await this.specialtyRepository.findOne({
        where: { id: specialtyId },
      });

      if (!specialty) {
        throw new NotFoundException('Especialidad no encontrada');
      }

      appointment.specialtyId = specialtyId;
      appointment.price = specialty.basePrice;
    }

    // Si se cambia especialista, validar
    if (specialistId && specialistId !== appointment.specialistId) {
      const targetSpecialtyId = specialtyId || appointment.specialtyId;
      const specialist = await this.specialistRepository.findOne({
        where: { id: specialistId, specialtyId: targetSpecialtyId },
      });

      if (!specialist) {
        throw new NotFoundException(
          'Especialista no encontrado o no pertenece a esta especialidad',
        );
      }

      appointment.specialistId = specialistId;
    }

    // Si se cambia fecha u hora, validar disponibilidad
    const newDate = appointmentDate || appointment.appointmentDate;
    const newTime = appointmentTime || appointment.appointmentTime;
    const targetSpecialistId = specialistId || appointment.specialistId;

    // Solo validar si cambió fecha u hora o especialista
    if (
      appointmentDate ||
      appointmentTime ||
      (specialistId && specialistId !== appointment.specialistId)
    ) {
      // Parsear fecha
      const dateStr =
        typeof newDate === 'string' ? newDate.split('T')[0] : newDate.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      // Validar rango de hora
      if (appointmentTime) {
        const hour = parseInt(appointmentTime.split(':')[0]);
        if (hour < 8 || hour > 21) {
          throw new BadRequestException(
            'Horario fuera del rango permitido (8am-9pm)',
          );
        }
      }

      // Verificar slots disponibles
      const availableSlots = await this.getAvailableSlots(
        targetSpecialistId,
        date,
      );

      // Si el slot cambió, verificar que esté disponible
      const currentTimeSlot = appointment.appointmentTime.substring(0, 5);
      const newTimeSlot = newTime.substring(0, 5);

      if (
        !availableSlots.includes(newTimeSlot) &&
        !(
          appointment.specialistId === targetSpecialistId &&
          currentTimeSlot === newTimeSlot &&
          !appointmentDate
        )
      ) {
        throw new ConflictException('Horario no disponible');
      }

      if (appointmentDate) {
        appointment.appointmentDate = date;
      }
      if (appointmentTime) {
        appointment.appointmentTime = appointmentTime;
      }
    }

    // Actualizar campos restantes
    if (patientName) appointment.patientName = patientName;
    if (patientEmail) appointment.patientEmail = patientEmail;
    if (patientPhone) appointment.patientPhone = patientPhone;
    if (notes !== undefined) appointment.notes = notes;
    if (status) appointment.status = status;

    await this.appointmentRepository.save(appointment);

    // Encolar email de notificación de cambio
    const updatedAppointment = await this.findOne(id);
    await this.emailsService.queueAppointmentEdited(updatedAppointment);

    return updatedAppointment;
  }

  /**
   * Confirmar o rechazar cita (admin)
   */
  async confirmAppointment(
    id: string,
    confirmDto: ConfirmAppointmentDto,
    adminId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (
      appointment.status !== AppointmentStatus.PENDING &&
      confirmDto.status === AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException('Solo se pueden confirmar citas pendientes');
    }

    appointment.status = confirmDto.status;

    if (confirmDto.status === AppointmentStatus.CONFIRMED) {
      appointment.confirmedAt = new Date();
      appointment.confirmedById = adminId;
    }

    await this.appointmentRepository.save(appointment);

    // Encolar email de confirmación
    if (confirmDto.status === AppointmentStatus.CONFIRMED) {
      const appointmentWithRelations = await this.findOne(id);
      await this.emailsService.queueAppointmentConfirmation(
        appointmentWithRelations,
      );
    }

    return await this.findOne(id);
  }

  /**
   * Cancelar cita (público - con token)
   */
  async cancelByToken(token: string): Promise<Appointment> {
    const appointment = await this.findByToken(token);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepository.save(appointment);

    return appointment;
  }

  /**
   * Obtener citas por rango de fechas (para calendario)
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startDate, endDate),
      },
      relations: ['specialty', 'specialist'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
    });
  }
}
