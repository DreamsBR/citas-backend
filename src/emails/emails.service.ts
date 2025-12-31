import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

export interface EmailJobData {
  appointmentId: string;
  recipientEmail: string;
  subject: string;
  templateName: string;
  templateData: any;
}

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: Transporter;

  constructor(
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    @InjectQueue('emails')
    private emailQueue: Queue,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configurar Nodemailer
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // Si no hay credenciales configuradas, usar preview mode de Nodemailer (para testing)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        'SMTP credentials not configured. Emails will be logged only.',
      );
      // En desarrollo, crear un transporter de prueba
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      });
    } else {
      this.transporter = nodemailer.createTransport(smtpConfig);
    }
  }

  /**
   * Encolar email de confirmación de cita
   */
  async queueAppointmentConfirmation(appointment: Appointment): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const appointmentLink = `${frontendUrl}/appointment/${appointment.uniqueToken}`;

    const templateData = {
      patientName: appointment.patientName,
      specialtyName: appointment.specialty.name,
      specialistName: `${appointment.specialist.firstName} ${appointment.specialist.lastName}`,
      appointmentDate: this.formatDate(appointment.appointmentDate),
      appointmentTime: appointment.appointmentTime,
      price: appointment.price,
      appointmentLink,
    };

    const jobData: EmailJobData = {
      appointmentId: appointment.id,
      recipientEmail: appointment.patientEmail,
      subject: '✅ Tu cita ha sido confirmada - Fisioterapia',
      templateName: 'appointment-confirmed',
      templateData,
    };

    await this.emailQueue.add('send-email', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log(
      `Email de confirmación encolado para appointment ${appointment.id}`,
    );
  }

  /**
   * Enviar email usando template
   */
  async sendEmail(jobData: EmailJobData): Promise<void> {
    const { appointmentId, recipientEmail, subject, templateName, templateData } =
      jobData;

    // Crear log entry
    const emailLog = this.emailLogRepository.create({
      appointmentId,
      recipientEmail,
      subject,
      status: EmailStatus.PENDING,
    });
    await this.emailLogRepository.save(emailLog);

    try {
      // Cargar y compilar template
      const html = await this.renderTemplate(templateName, templateData);

      // Enviar email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Fisioterapia <noreply@fisioterapia.com>',
        to: recipientEmail,
        subject,
        html,
      });

      // Actualizar log como enviado
      emailLog.status = EmailStatus.SENT;
      emailLog.sentAt = new Date();
      await this.emailLogRepository.save(emailLog);

      this.logger.log(`Email enviado exitosamente: ${info.messageId}`);

      // Si estamos en modo preview, loguear el URL
      if (!process.env.SMTP_USER) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`Preview URL: ${previewUrl}`);
        }
      }
    } catch (error) {
      // Actualizar log como fallido
      emailLog.status = EmailStatus.FAILED;
      emailLog.error = error.message;
      await this.emailLogRepository.save(emailLog);

      this.logger.error(`Error enviando email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Renderizar template HTML con Handlebars
   */
  private async renderTemplate(
    templateName: string,
    data: any,
  ): Promise<string> {
    const templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    return template(data);
  }

  /**
   * Formatear fecha para mostrar en emails
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Obtener logs de emails para una cita
   */
  async getEmailLogs(appointmentId: string): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }
}
