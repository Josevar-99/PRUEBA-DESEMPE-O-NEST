import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.validatePlateAvailable(dto.plate);
    return this.vehicleRepository.save(this.vehicleRepository.create(dto));
  }

  /** Requirement 2.1: lists all registered vehicles, including inactive ones */
  findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ order: { plate: 'ASC' } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id "${id}" not found`);
    }
    return vehicle;
  }

  /** Requirement 2.5: query by license plate, case-insensitive */
  async findByPlate(plate: string): Promise<Vehicle> {
    const normalizedPlate = plate.trim().toUpperCase();
    const vehicle = await this.vehicleRepository.findOne({
      where: { plate: normalizedPlate },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with plate "${normalizedPlate}" not found`);
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (dto.plate && dto.plate !== vehicle.plate) {
      await this.validatePlateAvailable(dto.plate);
    }
    return this.vehicleRepository.save({ ...vehicle, ...dto });
  }

  /**
   * Requirement 2.7: soft delete. The record and its history are preserved.
   * A vehicle IN_MAINTENANCE has an ongoing maintenance: it must be
   * completed or cancelled first, otherwise an active maintenance would remain
   * on a deactivated vehicle.
   */
  async deactivate(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        'Cannot deactivate a vehicle with an ongoing maintenance',
      );
    }
    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehicleRepository.save(vehicle);
  }

  private async validatePlateAvailable(plate: string): Promise<void> {
    const exists = await this.vehicleRepository.findOne({ where: { plate } });
    if (exists) {
      throw new ConflictException(`A vehicle with plate "${plate}" already exists`);
    }
  }
}