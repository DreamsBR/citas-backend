import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export enum WebhookEvent {
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
  }

  /**
   * Disparar webhook a n8n
   */
  async triggerWebhook(event: WebhookEvent, data: any): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('N8N_WEBHOOK_URL not configured. Webhook not sent.');
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      this.logger.log(
        `Webhook ${event} sent successfully. Status: ${response.status}`,
      );
    } catch (error) {
      this.logger.error(`Error sending webhook ${event}: ${error.message}`);
      // No lanzamos el error para no bloquear la operación principal
    }
  }

  /**
   * Webhook para cita creada
   */
  async onAppointmentCreated(appointment: any): Promise<void> {
    await this.triggerWebhook(WebhookEvent.APPOINTMENT_CREATED, {
      appointmentId: appointment.id,
      patientEmail: appointment.patientEmail,
      patientName: appointment.patientName,
      specialtyId: appointment.specialtyId,
      specialistId: appointment.specialistId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
    });
  }

  /**
   * Webhook para cita confirmada
   */
  async onAppointmentConfirmed(appointment: any): Promise<void> {
    await this.triggerWebhook(WebhookEvent.APPOINTMENT_CONFIRMED, {
      appointmentId: appointment.id,
      patientEmail: appointment.patientEmail,
      patientName: appointment.patientName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      confirmedAt: appointment.confirmedAt,
    });
  }

  /**
   * Webhook para cita cancelada
   */
  async onAppointmentCancelled(appointment: any): Promise<void> {
    await this.triggerWebhook(WebhookEvent.APPOINTMENT_CANCELLED, {
      appointmentId: appointment.id,
      patientEmail: appointment.patientEmail,
      reason: 'patient_cancelled',
    });
  }
}
