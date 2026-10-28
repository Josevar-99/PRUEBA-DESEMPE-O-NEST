import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';

/**
 * 💡 [ADAPT FOR THE TEST - RESOURCE MODULE]:
 * Every time you create a new entity for your test:
 * 1. Register it in `imports: [TypeOrmModule.forFeature([YourEntity])]`.
 * 2. If another module needs to query YourEntity/YourService (e.g. AuthModule or ReportsModule),
 *    add it to `exports: [YourService, TypeOrmModule]`.
 * 3. Import this module in `src/app.module.ts`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}