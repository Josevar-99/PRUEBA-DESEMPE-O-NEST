import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity.js';
import { AccionAuditoria } from './enums/accion-auditoria.enum.js';
import { User } from '../users/entities/user.entity.js';

export interface NuevaAuditoria {
  usuarioId: string;
  accion: AccionAuditoria;
  entidad: string;
  entidadId: string | null;
  ruta: string;
  detalle: Record<string, unknown> | null;
}

@Injectable()
export class AuditoriasService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async registrar(datos: NuevaAuditoria): Promise<void> {
    const { usuarioId, ...resto } = datos;
    // Solo se necesita el id para la FK; no hace falta consultar el usuario completo
    await this.auditoriaRepository.save(
      this.auditoriaRepository.create({
        ...resto,
        usuario: { id: usuarioId } as User,
      }),
    );
  }

  /** Más recientes primero; filtro opcional por recurso (ej: ?entidad=mantenimientos) */
  findAll(entidad?: string): Promise<Auditoria[]> {
    return this.auditoriaRepository.find({
      where: entidad ? { entidad } : {},
      relations: { usuario: true },
      order: { fecha: 'DESC' },
    });
  }
}