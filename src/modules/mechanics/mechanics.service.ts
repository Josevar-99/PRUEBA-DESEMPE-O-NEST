import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mechanic } from './entities/mechanic.entity.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicRepository: Repository<Mechanic>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const { userId, ...data } = dto;

    // findOne throws 404 if the user does not exist
    const user = await this.usersService.findOne(userId);

    // Only a technician can be a mechanic: an ADMIN does not receive assigned maintenances
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException(
        'The linked user must have the TECHNICIAN role',
      );
    }

    const alreadyLinked = await this.mechanicRepository.findOne({
      where: { user: { id: userId } },
    });
    if (alreadyLinked) {
      throw new ConflictException('That user is already linked to another mechanic');
    }

    await this.validateEmailAvailable(data.email);

    return this.mechanicRepository.save(
      this.mechanicRepository.create({ ...data, user }),
    );
  }

  /** Requirement 3.3: all registered mechanics, active and inactive */
  findAll(): Promise<Mechanic[]> {
    return this.mechanicRepository.find({
      relations: { user: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Mechanic> {
    const mechanic = await this.mechanicRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!mechanic) {
      throw new NotFoundException(`Mechanic with id "${id}" not found`);
    }
    return mechanic;
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (dto.email && dto.email !== mechanic.email) {
      await this.validateEmailAvailable(dto.email);
    }
    return this.mechanicRepository.save({ ...mechanic, ...dto });
  }

  /** Requirement 3.6: activate or deactivate; 3.8: history is not touched */
  async changeStatus(id: string, status: ActiveStatus): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status = status;
    return this.mechanicRepository.save(mechanic);
  }

  private async validateEmailAvailable(email: string): Promise<void> {
    const exists = await this.mechanicRepository.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException(`A mechanic with the email "${email}" already exists`);
    }
  }
}