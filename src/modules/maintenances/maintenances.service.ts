import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsRelations,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import { Maintenance } from './entities/maintenance.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import {
  ACTIVE_STATUSES,
  MaintenanceStatus,
  TRANSITIONS,
} from '../../common/enums/maintenance-status.enum.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';

// Relations returned in every query: the technician sees vehicle and workshop (acceptance criteria)
const RELATIONS: FindOptionsRelations<Maintenance> = {
  vehicle: true,
  mechanic: { user: true },
  workshop: true,
};

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    private readonly dataSource: DataSource,
    private readonly vehiclesService: VehiclesService,
    private readonly mechanicsService: MechanicsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  /**
   * Validations in order: request data first (400), then existsnce (404)
   * and each entity's status (400), and finally conflicts with other maintenances (409).
   */
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    if (dto.estimatedEndAt <= dto.scheduledAt) {
      throw new BadRequestException(
        'estimatedEndAt must be later than scheduledAt',
      );
    }

    // Business rule: the vehicle must exist (404)
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
    // Requirement 2.9
    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new BadRequestException(
        'The vehicle is inactive and cannot receive new maintenances',
      );
    }
    // Odometer does not go backwards: the entry mileage cannot be less than the recorded one
    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `Mileage cannot be less than the vehicle's current mileage (${vehicle.mileage})`,
      );
    }
    



    // Business rule: the mechanic must exist (404) and be active (400)
    const mechanic = await this.mechanicsService.findOne(dto.mechanicId);
    if (mechanic.status === ActiveStatus.INACTIVE) {
      throw new BadRequestException(
        'The mechanic is inactive and cannot receive new maintenances',
      );
    }

    // Business rule: the workshop must exist (404) and be active (400)
    const workshop = await this.workshopsService.findOne(dto.workshopId);
    if (workshop.status === ActiveStatus.INACTIVE) {
      throw new BadRequestException(
        'The workshop is inactive and cannot receive maintenances',
      );
    }

    // Business rule: a vehicle cannot have more than one active maintenance at a time
    const existingActiveMaintenance = await this.maintenanceRepository.findOne({
      where: {
        vehicle: { id: vehicle.id },
        status: In(ACTIVE_STATUSES),
      },
    });
    if (existingActiveMaintenance) {
      throw new ConflictException(
        `Vehicle ${vehicle.plate} already has an active maintenance (${existingActiveMaintenance.status})`,
      );
    }

    await this.validateMechanicSchedule(
      mechanic.id,
      dto.scheduledAt,
      dto.estimatedEndAt,
    );

    return this.maintenanceRepository.save(
      this.maintenanceRepository.create({
        type: dto.type,
        description: dto.description,
        mileage: dto.mileage,
        scheduledAt: dto.scheduledAt,
        estimatedEndAt: dto.estimatedEndAt,
        vehicle,
        mechanic,
        workshop,
      }),
    );
  }

  /** Requirement 5.8a */
  findAll(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      relations: RELATIONS,
      order: { scheduledAt: 'DESC' },
    });
  }

  /** Requirement 5.8b: active = SCHEDULED or IN_PROGRESS */
  findActive(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  /** Requirement 5.8c: all for the vehicle, in any status */
  async findByVehicle(vehicleId: string): Promise<Maintenance[]> {
    await this.vehiclesService.findOne(vehicleId); // 404 if not found
    return this.maintenanceRepository.find({
      where: { vehicle: { id: vehicleId } },
      relations: RELATIONS,
      order: { scheduledAt: 'DESC' },
    });
  }

  /** Requirement 5.8e: history = only completed jobs, from most recent to oldest */
  async vehicleHistory(vehicleId: string): Promise<Maintenance[]> {
    await this.vehiclesService.findOne(vehicleId);
    return this.maintenanceRepository.find({
      where: {
        vehicle: { id: vehicleId },
        status: MaintenanceStatus.COMPLETED,
      },
      relations: RELATIONS,
      order: { completedAt: 'DESC' },
    });
  }

  /** Requirement 5.8d (ADMIN view) */
  async findByMechanic(mechanicId: string): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId);
    return this.maintenanceRepository.find({
      where: { mechanic: { id: mechanicId } },
      relations: RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  /**
   * Requirement 5.8d (TECHNICIAN view). Filtered by the token's user,
   * not by an id from the URL, so a technician cannot request another's records.
   */
  findAssignedToCurrentUser(userId: string): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { mechanic: { user: { id: userId } } },
      relations: RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!maintenance) {
      throw new NotFoundException(`Maintenance with id "${id}" not found`);
    }
    this.validateAccess(maintenance, user);
    return maintenance;
  }

  /**
   * Requirement 5.7. Validates the transition, applies its effects on the vehicle
   * and saves both in a transaction.
   */
  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    user: JwtPayload,
  ): Promise<Maintenance> {
    // findOne already responds 404 if not found and 403 if the technician is not the assigned one
    const maintenance = await this.findOne(id, user);
    const currentStatus = maintenance.status;
    const vehicle = maintenance.vehicle;

       // Business rule: invalid transition -> 409, because the request is valid
    // but clashes with the current maintenance status
    const allowedTransitions = TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(dto.status)) {
      throw new ConflictException(
        allowedTransitions.length === 0
          ? `The maintenance is ${currentStatus}, which is a final status: no further changes are allowed`
          : `Cannot transition from ${currentStatus} to ${dto.status}. From ${currentStatus} only the following are allowed: ${allowedTransitions.join(', ')}`,
      );
    }
    if (
      dto.status === MaintenanceStatus.CANCELLED &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Only an ADMIN can cancel maintenances');
    }

    let newVehicleStatus: VehicleStatus | null = null;

    switch (dto.status) {
      case MaintenanceStatus.IN_PROGRESS: {
        // The vehicle could have been deactivated after this maintenance was scheduled
        if (vehicle.status !== VehicleStatus.AVAILABLE) {
          throw new ConflictException(
            `The vehicle is not available (current status: ${vehicle.status})`,
          );
        }
        // Business rule: the technician cannot have two jobs in progress at the same time,
        // even if the scheduled times do not overlap (e.g.: the previous one was delayed)
        const inProgressMaintenance = await this.maintenanceRepository.findOne({
          where: {
            mechanic: { id: maintenance.mechanic.id },
            status: MaintenanceStatus.IN_PROGRESS,
          },
        });
        if (inProgressMaintenance) {
          throw new ConflictException(
            'The technician already has a maintenance in progress; it must be completed before starting another',
          );
        }
        newVehicleStatus = VehicleStatus.IN_MAINTENANCE;
        break;
      }

        case MaintenanceStatus.COMPLETED: {
        // Business rule: the recorded mileage cannot be less than the vehicle's current mileage.
        // Compared against the greater of the entry mileage and the current mileage, because the vehicle
        // could have been edited while the maintenance was in progress
        const minimumMileage = Math.max(
          maintenance.mileage,
          vehicle.mileage,
        );
        if (dto.finalMileage! < minimumMileage) {
          throw new BadRequestException(
            `finalMileage cannot be less than ${minimumMileage} km`,
          );
        }
        if (dto.completedAt! < maintenance.scheduledAt) {
          throw new BadRequestException(
            'completedAt cannot be earlier than scheduledAt',
          );
        }
        maintenance.workPerformed = dto.workPerformed!;
        maintenance.finalCost = dto.finalCost!;
        maintenance.completedAt = dto.completedAt!;
        maintenance.finalMileage = dto.finalMileage!;
        newVehicleStatus = VehicleStatus.AVAILABLE;
        break;
      }

      case MaintenanceStatus.CANCELLED:
        // Only releases the vehicle if this maintenance had it occupied (IN_PROGRESS).
        // Cancelling a SCHEDULED one does not touch the vehicle: it never took it out of AVAILABLE
        if (currentStatus === MaintenanceStatus.IN_PROGRESS) {
          newVehicleStatus = VehicleStatus.AVAILABLE;
        }
        break;
    }

    maintenance.status = dto.status;

    // Maintenance and vehicle are written together: if one fails, both are rolled back.
    // Without this a maintenance could remain COMPLETED with the vehicle IN_MAINTENANCE forever
    await this.dataSource.transaction(async (manager) => {
      await manager.save(Maintenance, maintenance);
      if (newVehicleStatus) {
        await manager.update(Vehicle, vehicle.id, {
          status: newVehicleStatus,
          ...(dto.status === MaintenanceStatus.COMPLETED && {
            mileage: dto.finalMileage,
          }),
        });
      }
    });

    // Reloaded to respond with the already-updated vehicle status
    return this.findOne(id, user);
  }

  /**
   * Requirement 3.10: two ranges overlap if
   *   existing.start < new.end  AND  existing.end > new.start
   * Comparisons are strict: one that ends at 9:00 and another that starts
   * at 9:00 do not overlap (case d). Filtered only by mechanic, regardless of workshop.
   * shortcut: two simultaneous requests can both pass the check; if full
   * guarantee is needed, add an EXCLUDE constraint with tstzrange in PostgreSQL.
   */
  private async validateMechanicSchedule(
    mechanicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const overlappingMaintenance = await this.maintenanceRepository.findOne({
      where: {
        mechanic: { id: mechanicId },
        status: In(ACTIVE_STATUSES),
        scheduledAt: LessThan(endTime),
        estimatedEndAt: MoreThan(startTime),
      },
    });
    if (overlappingMaintenance) {
      throw new ConflictException(
        `The mechanic already has a maintenance between ${overlappingMaintenance.scheduledAt.toISOString()} and ${overlappingMaintenance.estimatedEndAt.toISOString()}`,
      );
    }
  }

  /** The technician can only view and operate the maintenances assigned to them */
  private validateAccess(maintenance: Maintenance, user: JwtPayload): void {
    if (
      user.role === Role.TECHNICIAN &&
      maintenance.mechanic.user.id !== user.sub
    ) {
      throw new ForbiddenException('This maintenance is not assigned to you');
    }
  }
}