import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workshop } from './entities/workshop.entity.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepository: Repository<Workshop>,
  ) {}

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    await this.validateNameAvailable(dto.name);
    return this.workshopRepository.save(this.workshopRepository.create(dto));
  }

  /** Requirement 4.3: the list only shows active workshops */
  findActive(): Promise<Workshop[]> {
    return this.workshopRepository.find({
      where: { status: ActiveStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  /** Returns the workshop even if it is inactive: history may reference it */
  async findOne(id: string): Promise<Workshop> {
    const workshop = await this.workshopRepository.findOne({ where: { id } });
    if (!workshop) {
      throw new NotFoundException(`Workshop with id "${id}" not found`);
    }
    return workshop;
  }

  async update(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);
    if (dto.name && dto.name !== workshop.name) {
      await this.validateNameAvailable(dto.name);
    }
    return this.workshopRepository.save({ ...workshop, ...dto });
  }

  /** Requirement 4.5: activate or deactivate instead of deleting (soft delete) */
  async changeStatus(id: string, status: ActiveStatus): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status = status;
    return this.workshopRepository.save(workshop);
  }

  /**
   * Validated before saving to respond with 409 and a clear message.
   * If two requests arrive simultaneously, the DB UNIQUE constraint stops them and the global filter translates it to 409.
   */
  private async validateNameAvailable(name: string): Promise<void> {
    const exists = await this.workshopRepository.findOne({ where: { name } });
    if (exists) {
      throw new ConflictException(`A workshop with the name "${name}" already exists`);
    }
  }
}