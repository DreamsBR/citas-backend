import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsService } from './emails.service';
import { EmailsProcessor } from './emails.processor';
import { EmailLog } from './entities/email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    BullModule.registerQueue({
      name: 'emails',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      // Configuración para desarrollo sin Redis
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
      },
    }),
  ],
  providers: [EmailsService, EmailsProcessor],
  exports: [EmailsService],
})
export class EmailsModule {}
