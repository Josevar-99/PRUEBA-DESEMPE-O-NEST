import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './entities/audit.entity.js';
import { AuditAction } from './enums/audit-action.enum.js';
import { User } from '../users/entities/user.entity.js';

export interface NewAuditInput {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  route: string;
  details: Record<string, unknown> | null;
}

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
  ) {}

  async record(data: NewAuditInput): Promise<void> {
    const { userId, ...remainingFields } = data;
    // Only the id is needed for the FK; no need to query the full user
    await this.auditRepository.save(
      this.auditRepository.create({
        ...remainingFields,
        user: { id: userId } as User,
      }),
    );
  }

  /** Most recent first; optional filter by resource (e.g.: ?entity=maintenances) */
  findAll(entity?: string): Promise<Audit[]> {
    return this.auditRepository.find({
      where: entity ? { entity } : {},
      relations: { user: true },
      order: { date: 'DESC' },
    });
  }
}