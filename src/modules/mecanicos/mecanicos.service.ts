import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mecanico } from './entities/mecanico.entity.js';
import { CreateMecanicoDto } from './dto/create-mecanico.dto.js';
import { UpdateMecanicoDto } from './dto/update-mecanico.dto.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class MecanicosService {
  constructor(
    @InjectRepository(Mecanico)
    private readonly mecanicoRepository: Repository<Mecanico>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMecanicoDto): Promise<Mecanico> {
    const { usuarioId, ...datos } = dto;

    // findOne lanza 404 si el usuario no existe
    const usuario = await this.usersService.findOne(usuarioId);

    // Solo un técnico puede ser mecánico: un ADMIN no recibe mantenimientos asignados
    if (usuario.role !== Role.TECHNICIAN) {
      throw new BadRequestException(
        'El usuario vinculado debe tener rol TECHNICIAN',
      );
    }

    const yaVinculado = await this.mecanicoRepository.findOne({
      where: { usuario: { id: usuarioId } },
    });
    if (yaVinculado) {
      throw new ConflictException('Ese usuario ya está vinculado a otro mecánico');
    }

    await this.validarCorreoLibre(datos.correo);

    return this.mecanicoRepository.save(
      this.mecanicoRepository.create({ ...datos, usuario }),
    );
  }

  /** Requisito 3.3: todos los registrados, activos e inactivos */
  findAll(): Promise<Mecanico[]> {
    return this.mecanicoRepository.find({
      relations: { usuario: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Mecanico> {
    const mecanico = await this.mecanicoRepository.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!mecanico) {
      throw new NotFoundException(`Mecánico con id "${id}" no encontrado`);
    }
    return mecanico;
  }

  async update(id: string, dto: UpdateMecanicoDto): Promise<Mecanico> {
    const mecanico = await this.findOne(id);
    if (dto.correo && dto.correo !== mecanico.correo) {
      await this.validarCorreoLibre(dto.correo);
    }
    return this.mecanicoRepository.save({ ...mecanico, ...dto });
  }

  /** Requisito 3.6: activar o inactivar; 3.8: el historial no se toca */
  async cambiarEstado(id: string, estado: EstadoActivo): Promise<Mecanico> {
    const mecanico = await this.findOne(id);
    mecanico.estado = estado;
    return this.mecanicoRepository.save(mecanico);
  }

  private async validarCorreoLibre(correo: string): Promise<void> {
    const existe = await this.mecanicoRepository.findOne({ where: { correo } });
    if (existe) {
      throw new ConflictException(`Ya existe un mecánico con el correo "${correo}"`);
    }
  }
}