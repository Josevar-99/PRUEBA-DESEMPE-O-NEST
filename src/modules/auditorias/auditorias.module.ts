import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auditoria } from './entities/auditoria.entity.js';
import { AuditoriasService } from './auditorias.service.js';
import { AuditoriasController } from './auditorias.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Auditoria])],
  controllers: [AuditoriasController],
  providers: [AuditoriasService],
  // AppModule lo necesita para construir el AuditInterceptor global
  exports: [AuditoriasService],
})
export class AuditoriasModule {}