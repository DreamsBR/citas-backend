import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailsService, EmailJobData } from './emails.service';

@Processor('emails')
export class EmailsProcessor {
  private readonly logger = new Logger(EmailsProcessor.name);

  constructor(private readonly emailsService: EmailsService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Procesando job de email: ${job.id}`);

    try {
      await this.emailsService.sendEmail(job.data);
      this.logger.log(`Email enviado exitosamente: job ${job.id}`);
    } catch (error) {
      this.logger.error(`Error procesando email job ${job.id}: ${error.message}`);
      throw error; // Esto permitirá que Bull reintente el job
    }
  }
}
