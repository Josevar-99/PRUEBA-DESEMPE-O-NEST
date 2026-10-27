import bcrypt from 'bcrypt';
import {
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
// Importar typeorm.config carga el .env (dotenv) antes de validarlo
import AppDataSource from '../../config/typeorm.config.js';
import { validateEnv } from '../../config/env.schema.js';
import { User } from '../../modules/users/entities/user.entity.js';
import { Mecanico } from '../../modules/mecanicos/entities/mecanico.entity.js';
import { Taller } from '../../modules/talleres/entities/taller.entity.js';
import { Vehiculo } from '../../modules/vehiculos/entities/vehiculo.entity.js';
import { Mantenimiento } from '../../modules/mantenimientos/entities/mantenimiento.entity.js';
import { Role } from '../../common/enums/role.enum.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';
import { EstadoVehiculo } from '../../common/enums/estado-vehiculo.enum.js';
import { EstadoMantenimiento } from '../../common/enums/estado-mantenimiento.enum.js';
import { TipoMantenimiento } from '../../common/enums/tipo-mantenimiento.enum.js';

// Contraseñas de desarrollo, documentadas en el README
const PASSWORD_ADMIN = 'Admin123*';
const PASSWORD_TECNICO = 'Tecnico123*';

/**
 * Busca por clave natural y solo crea si no existe (requisito 9.2).
 * Ejecutar el seed dos veces devuelve los registros existentes en vez de duplicarlos.
 */
async function buscarOCrear<T extends ObjectLiteral>(
  manager: EntityManager,
  entidad: EntityTarget<T>,
  clave: NoInfer<FindOptionsWhere<T>>,
  datos: () => Promise<NoInfer<DeepPartial<T>>> | NoInfer<DeepPartial<T>>,
): Promise<T> {
  const repo = manager.getRepository(entidad);
  const existente = await repo.findOne({ where: clave });
  if (existente) return existente;
  // datos es una función para no calcular hashes de bcrypt cuando el registro ya existe
  return repo.save(repo.create(await datos()));
}

async function sembrar(manager: EntityManager): Promise<void> {
  // ---------- Usuarios: 1 ADMIN + 3 TECHNICIAN ----------
  const hashTecnico = await bcrypt.hash(PASSWORD_TECNICO, 10);

  await buscarOCrear(manager, User, { email: 'admin@taller.com' }, async () => ({
    name: 'Administrador',
    email: 'admin@taller.com',
    password: await bcrypt.hash(PASSWORD_ADMIN, 10),
    role: Role.ADMIN,
  }));

  const usuarioCarlos = await buscarOCrear(manager, User, { email: 'tecnico1@taller.com' }, () => ({
    name: 'Carlos Pérez',
    email: 'tecnico1@taller.com',
    password: hashTecnico,
    role: Role.TECHNICIAN,
  }));

  const usuarioLaura = await buscarOCrear(manager, User, { email: 'tecnico2@taller.com' }, () => ({
    name: 'Laura Gómez',
    email: 'tecnico2@taller.com',
    password: hashTecnico,
    role: Role.TECHNICIAN,
  }));

  // El mecánico inactivo necesita usuario porque usuario_id es obligatorio
  const usuarioAndres = await buscarOCrear(manager, User, { email: 'tecnico3@taller.com' }, () => ({
    name: 'Andrés Ruiz',
    email: 'tecnico3@taller.com',
    password: hashTecnico,
    role: Role.TECHNICIAN,
    isActive: false,
  }));

  // ---------- Mecánicos: 2 activos vinculados + 1 inactivo ----------
  const carlos = await buscarOCrear(manager, Mecanico, { correo: 'carlos.perez@taller.com' }, () => ({
    nombre: 'Carlos Pérez',
    correo: 'carlos.perez@taller.com',
    especialidad: 'Motor',
    estado: EstadoActivo.ACTIVE,
    usuario: usuarioCarlos,
  }));

  const laura = await buscarOCrear(manager, Mecanico, { correo: 'laura.gomez@taller.com' }, () => ({
    nombre: 'Laura Gómez',
    correo: 'laura.gomez@taller.com',
    especialidad: 'Frenos y suspensión',
    estado: EstadoActivo.ACTIVE,
    usuario: usuarioLaura,
  }));

  await buscarOCrear(manager, Mecanico, { correo: 'andres.ruiz@taller.com' }, () => ({
    nombre: 'Andrés Ruiz',
    correo: 'andres.ruiz@taller.com',
    especialidad: 'Sistema eléctrico',
    estado: EstadoActivo.INACTIVE,
    usuario: usuarioAndres,
  }));

  // ---------- Talleres: 1 activo + 1 inactivo ----------
  const central = await buscarOCrear(manager, Taller, { nombre: 'Taller Central' }, () => ({
    nombre: 'Taller Central',
    direccion: 'Calle 30 #45-12, Barranquilla',
    estado: EstadoActivo.ACTIVE,
  }));

  await buscarOCrear(manager, Taller, { nombre: 'Taller Norte' }, () => ({
    nombre: 'Taller Norte',
    direccion: 'Carrera 51B #84-30, Barranquilla',
    estado: EstadoActivo.INACTIVE,
  }));

  // ---------- Vehículos: 2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE ----------
  // ABC123 ya tiene el kilometraje con que terminó su mantenimiento completado
  const abc123 = await buscarOCrear(manager, Vehiculo, { placa: 'ABC123' }, () => ({
    placa: 'ABC123',
    marca: 'Chevrolet',
    modelo: 'Spark',
    anio: 2022,
    kilometraje: 45200,
    estado: EstadoVehiculo.AVAILABLE,
  }));

  const def456 = await buscarOCrear(manager, Vehiculo, { placa: 'DEF456' }, () => ({
    placa: 'DEF456',
    marca: 'Renault',
    modelo: 'Logan',
    anio: 2021,
    kilometraje: 60000,
    estado: EstadoVehiculo.AVAILABLE,
  }));

  // IN_MAINTENANCE porque tiene el mantenimiento IN_PROGRESS de abajo (requisito 9.1d)
  const ghi789 = await buscarOCrear(manager, Vehiculo, { placa: 'GHI789' }, () => ({
    placa: 'GHI789',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
    kilometraje: 30500,
    estado: EstadoVehiculo.IN_MAINTENANCE,
  }));

  await buscarOCrear(manager, Vehiculo, { placa: 'JKL012' }, () => ({
    placa: 'JKL012',
    marca: 'Nissan',
    modelo: 'Frontier',
    anio: 2019,
    kilometraje: 120000,
    estado: EstadoVehiculo.INACTIVE,
  }));

  // ---------- Mantenimientos ----------
  // Fechas fijas: son parte de la clave natural; con new Date() cada ejecución duplicaría
  const fechaCompletado = new Date('2026-09-15T07:30:00-05:00');
  const fechaEnProceso = new Date('2026-10-27T07:30:00-05:00');
  const fechaProgramado = new Date('2026-11-10T08:00:00-05:00');

  // COMPLETED: alimenta el historial de ABC123 (requisito 9.1e)
  await buscarOCrear(
    manager,
    Mantenimiento,
    { vehiculo: { id: abc123.id }, fechaProgramada: fechaCompletado },
    () => ({
      tipo: TipoMantenimiento.PREVENTIVE,
      descripcion: 'Cambio de aceite y filtros',
      kilometraje: 45000,
      fechaProgramada: fechaCompletado,
      fechaFinEstimada: new Date('2026-09-15T09:00:00-05:00'),
      estado: EstadoMantenimiento.COMPLETED,
      trabajoRealizado: 'Cambio de aceite 5W-30, filtro de aceite y filtro de aire',
      costoFinal: 250000,
      fechaFinalizacion: new Date('2026-09-15T09:00:00-05:00'),
      kilometrajeFinal: 45200,
      vehiculo: abc123,
      mecanico: carlos,
      taller: central,
    }),
  );

  // IN_PROGRESS: es el que mantiene a GHI789 en IN_MAINTENANCE
  await buscarOCrear(
    manager,
    Mantenimiento,
    { vehiculo: { id: ghi789.id }, fechaProgramada: fechaEnProceso },
    () => ({
      tipo: TipoMantenimiento.CORRECTIVE,
      descripcion: 'Ruido en suspensión delantera',
      kilometraje: 30500,
      fechaProgramada: fechaEnProceso,
      fechaFinEstimada: new Date('2026-10-27T12:00:00-05:00'),
      estado: EstadoMantenimiento.IN_PROGRESS,
      vehiculo: ghi789,
      mecanico: laura,
      taller: central,
    }),
  );

  // SCHEDULED: permite probar SCHEDULED -> IN_PROGRESS sin crear datos a mano
  await buscarOCrear(
    manager,
    Mantenimiento,
    { vehiculo: { id: def456.id }, fechaProgramada: fechaProgramado },
    () => ({
      tipo: TipoMantenimiento.PREVENTIVE,
      descripcion: 'Revisión de frenos y alineación',
      kilometraje: 60000,
      fechaProgramada: fechaProgramado,
      fechaFinEstimada: new Date('2026-11-10T10:00:00-05:00'),
      vehiculo: def456,
      mecanico: carlos,
      taller: central,
    }),
  );
}

async function main(): Promise<void> {
  // Mismo validador que la app: si el .env está incompleto falla con mensaje claro
  // en lugar de conectarse a una BD por defecto
  validateEnv(process.env);

  await AppDataSource.initialize();
  try {
    // Todo o nada: si un registro falla, no queda la BD a medio sembrar
    await AppDataSource.transaction((manager) => sembrar(manager));
    console.log('Seed completado. Usuarios: admin@taller.com, tecnico1@taller.com, tecnico2@taller.com, tecnico3@taller.com (inactivo)');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Error ejecutando el seed:', error);
  process.exitCode = 1;
});