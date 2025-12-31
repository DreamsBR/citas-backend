import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Specialist } from '../specialists/entities/specialist.entity';
import { Availability } from '../specialists/entities/availability.entity';
import { Specialty } from '../specialties/entities/specialty.entity';
import { AuthModule } from '../auth/auth.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Specialist, Availability, Specialty]),
    AuthModule,
    EmailsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
