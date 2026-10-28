import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity.js';
import { AuditsService } from './audits.service.js';
import { AuditsController } from './audits.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Audit])],
  controllers: [AuditsController],
  providers: [AuditsService],
  // AppModule needs it to build the global AuditInterceptor
  exports: [AuditsService],
})
export class AuditsModule {}