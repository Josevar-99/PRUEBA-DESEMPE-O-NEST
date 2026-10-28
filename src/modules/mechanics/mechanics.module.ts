import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsService } from './mechanics.service.js';
import { MechanicsController } from './mechanics.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  // UsersModule provides UsersService to validate the linked user
  imports: [TypeOrmModule.forFeature([Mechanic]), UsersModule],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  // MaintenancesService will validate the mechanic and look up the logged-in technician's record
  exports: [MechanicsService],
})
export class MechanicsModule {}