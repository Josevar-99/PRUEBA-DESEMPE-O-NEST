import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taller } from './entities/taller.entity.js';
import { CreateTallerDto } from './dto/create-taller.dto.js';
import { UpdateTallerDto } from './dto/update-taller.dto.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';

@Injectable()
export class TalleresService {
  constructor(
    @InjectRepository(Taller)
    private readonly tallerRepository: Repository<Taller>,
  ) {}

  async create(dto: CreateTallerDto): Promise<Taller> {
    await this.validarNombreLibre(dto.nombre);
    return this.tallerRepository.save(this.tallerRepository.create(dto));
  }

  /** Requisito 4.3: el listado solo muestra talleres activos */
  findActivos(): Promise<Taller[]> {
    return this.tallerRepository.find({
      where: { estado: EstadoActivo.ACTIVE },
      order: { nombre: 'ASC' },
    });
  }

  /** Devuelve el taller aunque esté inactivo: el historial puede referenciarlo */
  async findOne(id: string): Promise<Taller> {
    const taller = await this.tallerRepository.findOne({ where: { id } });
    if (!taller) {
      throw new NotFoundException(`Taller con id "${id}" no encontrado`);
    }
    return taller;
  }

  async update(id: string, dto: UpdateTallerDto): Promise<Taller> {
    const taller = await this.findOne(id);
    if (dto.nombre && dto.nombre !== taller.nombre) {
      await this.validarNombreLibre(dto.nombre);
    }
    return this.tallerRepository.save({ ...taller, ...dto });
  }

  /** Requisito 4.5: activar o inactivar en lugar de borrar (eliminación lógica) */
  async cambiarEstado(id: string, estado: EstadoActivo): Promise<Taller> {
    const taller = await this.findOne(id);
    taller.estado = estado;
    return this.tallerRepository.save(taller);
  }

  /**
   * Se valida antes de guardar para responder 409 con un mensaje claro.
   * Si dos requests llegan a la vez, el UNIQUE de la BD lo frena y el filtro global lo traduce a 409.
   */
  private async validarNombreLibre(nombre: string): Promise<void> {
    const existe = await this.tallerRepository.findOne({ where: { nombre } });
    if (existe) {
      throw new ConflictException(`Ya existe un taller con el nombre "${nombre}"`);
    }
  }
}