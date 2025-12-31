import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { Specialist } from './entities/specialist.entity';
import { Availability } from './entities/availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Specialist, Availability])],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
