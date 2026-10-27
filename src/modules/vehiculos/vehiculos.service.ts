import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity.js';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto.js';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto.js';
import { EstadoVehiculo } from '../../common/enums/estado-vehiculo.enum.js';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
  ) {}

  async create(dto: CreateVehiculoDto): Promise<Vehiculo> {
    await this.validarPlacaLibre(dto.placa);
    return this.vehiculoRepository.save(this.vehiculoRepository.create(dto));
  }

  /** Requisito 2.1: lista todos los registrados, incluidos los inactivos */
  findAll(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({ order: { placa: 'ASC' } });
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con id "${id}" no encontrado`);
    }
    return vehiculo;
  }

  /** Requisito 2.5: consulta por placa, sin importar mayúsculas */
  async findByPlaca(placa: string): Promise<Vehiculo> {
    const normalizada = placa.trim().toUpperCase();
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { placa: normalizada },
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con placa "${normalizada}" no encontrado`);
    }
    return vehiculo;
  }

  async update(id: string, dto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    if (dto.placa && dto.placa !== vehiculo.placa) {
      await this.validarPlacaLibre(dto.placa);
    }
    return this.vehiculoRepository.save({ ...vehiculo, ...dto });
  }

  /**
   * Requisito 2.7: eliminación lógica. El registro y su historial se conservan.
   * Un vehículo IN_MAINTENANCE tiene un mantenimiento en curso: hay que
   * completarlo o cancelarlo primero, si no quedaría un mantenimiento activo
   * sobre un vehículo dado de baja.
   */
  async inactivar(id: string): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    if (vehiculo.estado === EstadoVehiculo.IN_MAINTENANCE) {
      throw new ConflictException(
        'No se puede inactivar un vehículo con un mantenimiento en proceso',
      );
    }
    vehiculo.estado = EstadoVehiculo.INACTIVE;
    return this.vehiculoRepository.save(vehiculo);
  }

  private async validarPlacaLibre(placa: string): Promise<void> {
    const existe = await this.vehiculoRepository.findOne({ where: { placa } });
    if (existe) {
      throw new ConflictException(`Ya existe un vehículo con la placa "${placa}"`);
    }
  }
}