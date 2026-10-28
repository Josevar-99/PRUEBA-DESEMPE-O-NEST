import bcrypt from 'bcrypt';
import {
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
// Importing typeorm.config loads the .env (dotenv) before validating it
import AppDataSource from '../../config/typeorm.config.js';
import { validateEnv } from '../../config/env.schema.js';
import { User } from '../../modules/users/entities/user.entity.js';
import { Mechanic } from '../../modules/mechanics/entities/mechanic.entity.js';
import { Workshop } from '../../modules/workshops/entities/workshop.entity.js';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity.js';
import { Maintenance } from '../../modules/maintenances/entities/maintenance.entity.js';
import { Role } from '../../common/enums/role.enum.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';

// Development passwords, documented in the README
const PASSWORD_ADMIN = 'Admin123*';
const PASSWORD_TECHNICIAN = 'Tecnico123*';

/**
 * Looks up by natural key and only creates if it does not exist (requirement 9.2).
 * Running the seed twice returns the existing records instead of duplicating them.
 */
async function findOrCreate<T extends ObjectLiteral>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  key: NoInfer<FindOptionsWhere<T>>,
  data: () => Promise<NoInfer<DeepPartial<T>>> | NoInfer<DeepPartial<T>>,
): Promise<T> {
  const repo = manager.getRepository(entity);
  const existingRecord = await repo.findOne({ where: key });
  if (existingRecord) return existingRecord;
  // Use a function to avoid computing bcrypt hashes when the record already exists.
  return repo.save(repo.create(await data()));
}

async function seedData(manager: EntityManager): Promise<void> {
  // ---------- Users: 1 ADMIN + 3 TECHNICIAN ----------
  const technicianPasswordHash = await bcrypt.hash(PASSWORD_TECHNICIAN, 10);

  await findOrCreate(manager, User, { email: 'admin@workshop.com' }, async () => ({
    name: 'Administrator',
    email: 'admin@workshop.com',
    password: await bcrypt.hash(PASSWORD_ADMIN, 10),
    role: Role.ADMIN,
  }));

  const carlosUser = await findOrCreate(manager, User, { email: 'tecnico1@workshop.com' }, () => ({
    name: 'Carlos Pérez',
    email: 'tecnico1@workshop.com',
    password: technicianPasswordHash,
    role: Role.TECHNICIAN,
  }));

  const lauraUser = await findOrCreate(manager, User, { email: 'tecnico2@workshop.com' }, () => ({
    name: 'Laura Gómez',
    email: 'tecnico2@workshop.com',
    password: technicianPasswordHash,
    role: Role.TECHNICIAN,
  }));

  // The inactive mechanic needs a user because usuario_id is required.
  const andresUser = await findOrCreate(manager, User, { email: 'tecnico3@workshop.com' }, () => ({
    name: 'Andrés Ruiz',
    email: 'tecnico3@workshop.com',
    password: technicianPasswordHash,
    role: Role.TECHNICIAN,
    isActive: false,
  }));

  // ---------- Mechanics: 2 active linked + 1 inactive ----------
  const carlos = await findOrCreate(manager, Mechanic, { email: 'carlos.perez@workshop.com' }, () => ({
    name: 'Carlos Pérez',
    email: 'carlos.perez@workshop.com',
    specialty: 'Motor',
    status: ActiveStatus.ACTIVE,
    user: carlosUser,
  }));

  const laura = await findOrCreate(manager, Mechanic, { email: 'laura.gomez@workshop.com' }, () => ({
    name: 'Laura Gómez',
    email: 'laura.gomez@workshop.com',
    specialty: 'Brakes and suspension',
    status: ActiveStatus.ACTIVE,
    user: lauraUser,
  }));

  await findOrCreate(manager, Mechanic, { email: 'andres.ruiz@workshop.com' }, () => ({
    name: 'Andrés Ruiz',
    email: 'andres.ruiz@workshop.com',
    specialty: 'Electrical system',
    status: ActiveStatus.INACTIVE,
    user: andresUser,
  }));

  // ---------- Workshops: 1 active + 1 inactive ----------
  const central = await findOrCreate(manager, Workshop, { name: 'Taller Central' }, () => ({
    name: 'Taller Central',
    address: 'Calle 30 #45-12, Barranquilla',
    status: ActiveStatus.ACTIVE,
  }));

  await findOrCreate(manager, Workshop, { name: 'Taller Norte' }, () => ({
    name: 'Taller Norte',
    address: 'Carrera 51B #84-30, Barranquilla',
    status: ActiveStatus.INACTIVE,
  }));

  // ---------- Vehicles: 2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE ----------
  // ABC123 already has the mileage it had when its completed maintenance finished
  const abc123 = await findOrCreate(manager, Vehicle, { plate: 'ABC123' }, () => ({
    plate: 'ABC123',
    make: 'Chevrolet',
    model: 'Spark',
    year: 2022,
    mileage: 45200,
    status: VehicleStatus.AVAILABLE,
  }));

  const def456 = await findOrCreate(manager, Vehicle, { plate: 'DEF456' }, () => ({
    plate: 'DEF456',
    make: 'Renault',
    model: 'Logan',
    year: 2021,
    mileage: 60000,
    status: VehicleStatus.AVAILABLE,
  }));

  // IN_MAINTENANCE because it has the IN_PROGRESS maintenance below (requirement 9.1d)
  const ghi789 = await findOrCreate(manager, Vehicle, { plate: 'GHI789' }, () => ({
    plate: 'GHI789',
    make: 'Toyota',
    model: 'Hilux',
    year: 2023,
    mileage: 30500,
    status: VehicleStatus.IN_MAINTENANCE,
  }));

  await findOrCreate(manager, Vehicle, { plate: 'JKL012' }, () => ({
    plate: 'JKL012',
    make: 'Nissan',
    model: 'Frontier',
    year: 2019,
    mileage: 120000,
    status: VehicleStatus.INACTIVE,
  }));

  // ---------- Maintenances ----------
  // Fixed dates: they are part of the natural key; using new Date() on each run would create duplicates
  const completedDate = new Date('2026-09-15T07:30:00-05:00');
  const inProgressDate = new Date('2026-10-27T07:30:00-05:00');
  const scheduledDate = new Date('2026-11-10T08:00:00-05:00');

  // COMPLETED: feeds the history of ABC123 (requirement 9.1e)
  await findOrCreate(
    manager,
    Maintenance,
    { vehicle: { id: abc123.id }, scheduledAt: completedDate },
    () => ({
      type: MaintenanceType.PREVENTIVE,
      description: 'Oil and filter change',
      mileage: 45000,
      scheduledAt: completedDate,
      estimatedEndAt: new Date('2026-09-15T09:00:00-05:00'),
      status: MaintenanceStatus.COMPLETED,
      workPerformed: 'Changed 5W-30 oil, oil filter, and air filter',
      finalCost: 250000,
      completedAt: new Date('2026-09-15T09:00:00-05:00'),
      finalMileage: 45200,
      vehicle: abc123,
      mechanic: carlos,
      workshop: central,
    }),
  );

  // IN_PROGRESS: this is the one keeping GHI789 in IN_MAINTENANCE
  await findOrCreate(
    manager,
    Maintenance,
    { vehicle: { id: ghi789.id }, scheduledAt: inProgressDate },
    () => ({
      type: MaintenanceType.CORRECTIVE,
      description: 'Noise in front suspension',
      mileage: 30500,
      scheduledAt: inProgressDate,
      estimatedEndAt: new Date('2026-10-27T12:00:00-05:00'),
      status: MaintenanceStatus.IN_PROGRESS,
      vehicle: ghi789,
      mechanic: laura,
      workshop: central,
    }),
  );

  // SCHEDULED: allows testing SCHEDULED -> IN_PROGRESS without creating data manually
  await findOrCreate(
    manager,
    Maintenance,
    { vehicle: { id: def456.id }, scheduledAt: scheduledDate },
    () => ({
      type: MaintenanceType.PREVENTIVE,
      description: 'Brake and alignment inspection',
      mileage: 60000,
      scheduledAt: scheduledDate,
      estimatedEndAt: new Date('2026-11-10T10:00:00-05:00'),
      vehicle: def456,
      mechanic: carlos,
      workshop: central,
    }),
  );
}

async function main(): Promise<void> {
  // Same validator as the app: if the .env is incomplete it fails with a clear message
  // instead of connecting to a default DB
  validateEnv(process.env);

  await AppDataSource.initialize();
  try {
    // All or nothing: if one record fails, the DB is not left half-seeded
    await AppDataSource.transaction((manager) => seedData(manager));
    console.log('Seed completed. Users: admin@workshop.com, tecnico1@workshop.com, tecnico2@workshop.com, tecnico3@workshop.com (inactive)');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Error running the seed:', error);
  process.exitCode = 1;
});