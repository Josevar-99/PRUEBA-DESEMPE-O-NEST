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
import { Mantenimiento } from './entities/mantenimiento.entity.js';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto.js';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto.js';
import {
  ESTADOS_ACTIVOS,
  EstadoMantenimiento,
  TRANSICIONES,
} from '../../common/enums/estado-mantenimiento.enum.js';
import { EstadoVehiculo } from '../../common/enums/estado-vehiculo.enum.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity.js';
import { VehiculosService } from '../vehiculos/vehiculos.service.js';
import { MecanicosService } from '../mecanicos/mecanicos.service.js';
import { TalleresService } from '../talleres/talleres.service.js';

// Relaciones que se devuelven en cada consulta: el técnico ve vehículo y taller (criterio de aceptación)
const RELACIONES: FindOptionsRelations<Mantenimiento> = {
  vehiculo: true,
  mecanico: { usuario: true },
  taller: true,
};

@Injectable()
export class MantenimientosService {
  constructor(
    @InjectRepository(Mantenimiento)
    private readonly mantenimientoRepository: Repository<Mantenimiento>,
    private readonly dataSource: DataSource,
    private readonly vehiculosService: VehiculosService,
    private readonly mecanicosService: MecanicosService,
    private readonly talleresService: TalleresService,
  ) {}

  /**
   * Validaciones en orden: primero datos del request (400), luego existencia (404)
   * y estado de cada entidad (400), y al final el cruce de horarios (409).
   */
  async create(dto: CreateMantenimientoDto): Promise<Mantenimiento> {
    if (dto.fechaFinEstimada <= dto.fechaProgramada) {
      throw new BadRequestException(
        'fechaFinEstimada debe ser posterior a fechaProgramada',
      );
    }

    const vehiculo = await this.vehiculosService.findOne(dto.vehiculoId);
    // Requisito 2.9
    if (vehiculo.estado === EstadoVehiculo.INACTIVE) {
      throw new BadRequestException(
        'El vehículo está inactivo y no puede recibir nuevos mantenimientos',
      );
    }
    // El odómetro no retrocede: el kilometraje de ingreso no puede ser menor al registrado
    if (dto.kilometraje < vehiculo.kilometraje) {
      throw new BadRequestException(
        `El kilometraje no puede ser menor al actual del vehículo (${vehiculo.kilometraje})`,
      );
    }
        // Regla de negocio: un vehículo no puede tener más de un mantenimiento activo a la vez
    const activoExistente = await this.mantenimientoRepository.findOne({
      where: {
        vehiculo: { id: vehiculo.id },
        estado: In(ESTADOS_ACTIVOS),
      },
    });
    if (activoExistente) {
      throw new ConflictException(
        `El vehículo ya tiene un mantenimiento activo (${activoExistente.estado}); debe completarse o cancelarse antes de crear otro`,
      );
    }

    const mecanico = await this.mecanicosService.findOne(dto.mecanicoId);
    // Requisito 3.7
    if (mecanico.estado === EstadoActivo.INACTIVE) {
      throw new BadRequestException(
        'El mecánico está inactivo y no puede recibir nuevos mantenimientos',
      );
    }

    const taller = await this.talleresService.findOne(dto.tallerId);
    // Requisito 4.6 (el inexistente ya respondió 404 en findOne)
    if (taller.estado === EstadoActivo.INACTIVE) {
      throw new BadRequestException(
        'El taller está inactivo y no puede recibir mantenimientos',
      );
    }

    await this.validarHorarioMecanico(
      mecanico.id,
      dto.fechaProgramada,
      dto.fechaFinEstimada,
    );

    return this.mantenimientoRepository.save(
      this.mantenimientoRepository.create({
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        kilometraje: dto.kilometraje,
        fechaProgramada: dto.fechaProgramada,
        fechaFinEstimada: dto.fechaFinEstimada,
        vehiculo,
        mecanico,
        taller,
      }),
    );
  }

  /** Requisito 5.8a */
  findAll(): Promise<Mantenimiento[]> {
    return this.mantenimientoRepository.find({
      relations: RELACIONES,
      order: { fechaProgramada: 'DESC' },
    });
  }

  /** Requisito 5.8b: activos = SCHEDULED o IN_PROGRESS */
  findActivos(): Promise<Mantenimiento[]> {
    return this.mantenimientoRepository.find({
      where: { estado: In(ESTADOS_ACTIVOS) },
      relations: RELACIONES,
      order: { fechaProgramada: 'ASC' },
    });
  }

  /** Requisito 5.8c: todos los del vehículo, en cualquier estado */
  async findByVehiculo(vehiculoId: string): Promise<Mantenimiento[]> {
    await this.vehiculosService.findOne(vehiculoId); // 404 si no existe
    return this.mantenimientoRepository.find({
      where: { vehiculo: { id: vehiculoId } },
      relations: RELACIONES,
      order: { fechaProgramada: 'DESC' },
    });
  }

  /** Requisito 5.8e: historial = solo trabajos completados, del más reciente al más antiguo */
  async historialVehiculo(vehiculoId: string): Promise<Mantenimiento[]> {
    await this.vehiculosService.findOne(vehiculoId);
    return this.mantenimientoRepository.find({
      where: {
        vehiculo: { id: vehiculoId },
        estado: EstadoMantenimiento.COMPLETED,
      },
      relations: RELACIONES,
      order: { fechaFinalizacion: 'DESC' },
    });
  }

  /** Requisito 5.8d (vista del ADMIN) */
  async findByMecanico(mecanicoId: string): Promise<Mantenimiento[]> {
    await this.mecanicosService.findOne(mecanicoId);
    return this.mantenimientoRepository.find({
      where: { mecanico: { id: mecanicoId } },
      relations: RELACIONES,
      order: { fechaProgramada: 'ASC' },
    });
  }

  /**
   * Requisito 5.8d (vista del TECHNICIAN). Se filtra por el usuario del token,
   * no por un id de la URL, para que un técnico no pueda pedir los de otro.
   */
  findMisAsignados(usuarioId: string): Promise<Mantenimiento[]> {
    return this.mantenimientoRepository.find({
      where: { mecanico: { usuario: { id: usuarioId } } },
      relations: RELACIONES,
      order: { fechaProgramada: 'ASC' },
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Mantenimiento> {
    const mantenimiento = await this.mantenimientoRepository.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!mantenimiento) {
      throw new NotFoundException(`Mantenimiento con id "${id}" no encontrado`);
    }
    this.validarAcceso(mantenimiento, user);
    return mantenimiento;
  }

  /**
   * Requisito 5.7. Valida la transición, aplica sus efectos sobre el vehículo
   * y guarda ambos en una transacción.
   */
  async cambiarEstado(
    id: string,
    dto: CambiarEstadoDto,
    user: JwtPayload,
  ): Promise<Mantenimiento> {
    // findOne ya responde 404 si no existe y 403 si el técnico no es el asignado
    const mantenimiento = await this.findOne(id, user);
    const estadoActual = mantenimiento.estado;
    const vehiculo = mantenimiento.vehiculo;

    if (!TRANSICIONES[estadoActual].includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede pasar de ${estadoActual} a ${dto.estado}`,
      );
    }

    if (
      dto.estado === EstadoMantenimiento.CANCELLED &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('Solo un ADMIN puede cancelar mantenimientos');
    }

    let nuevoEstadoVehiculo: EstadoVehiculo | null = null;

    switch (dto.estado) {
      case EstadoMantenimiento.IN_PROGRESS:
        // El vehículo pudo inactivarse después de programar este mantenimiento
        if (vehiculo.estado !== EstadoVehiculo.AVAILABLE) {
          throw new ConflictException(
            `El vehículo no está disponible (estado actual: ${vehiculo.estado})`,
          );
        }
        nuevoEstadoVehiculo = EstadoVehiculo.IN_MAINTENANCE;
        break;

      case EstadoMantenimiento.COMPLETED:
        // Los 4 campos ya vienen garantizados por el ValidateIf del DTO
        if (dto.kilometrajeFinal! < mantenimiento.kilometraje) {
          throw new BadRequestException(
            `kilometrajeFinal no puede ser menor al de ingreso (${mantenimiento.kilometraje})`,
          );
        }
        if (dto.fechaFinalizacion! < mantenimiento.fechaProgramada) {
          throw new BadRequestException(
            'fechaFinalizacion no puede ser anterior a fechaProgramada',
          );
        }
        mantenimiento.trabajoRealizado = dto.trabajoRealizado!;
        mantenimiento.costoFinal = dto.costoFinal!;
        mantenimiento.fechaFinalizacion = dto.fechaFinalizacion!;
        mantenimiento.kilometrajeFinal = dto.kilometrajeFinal!;
        nuevoEstadoVehiculo = EstadoVehiculo.AVAILABLE;
        break;

      case EstadoMantenimiento.CANCELLED:
         // Solo libera el vehículo si este mantenimiento lo tenía ocupado (IN_PROGRESS).
        // Cancelar uno SCHEDULED no toca el vehículo: nunca lo sacó de AVAILABLE
        if (estadoActual === EstadoMantenimiento.IN_PROGRESS) {
          nuevoEstadoVehiculo = EstadoVehiculo.AVAILABLE;
        }
        break;
    }

    mantenimiento.estado = dto.estado;

    // Mantenimiento y vehículo se escriben juntos: si falla uno, se revierten ambos.
    // Sin esto podría quedar un mantenimiento COMPLETED con el vehículo IN_MAINTENANCE para siempre
    await this.dataSource.transaction(async (manager) => {
      await manager.save(Mantenimiento, mantenimiento);
      if (nuevoEstadoVehiculo) {
        await manager.update(Vehiculo, vehiculo.id, {
          estado: nuevoEstadoVehiculo,
          ...(dto.estado === EstadoMantenimiento.COMPLETED && {
            kilometraje: dto.kilometrajeFinal,
          }),
        });
      }
    });

    // Se recarga para responder con el estado del vehículo ya actualizado
    return this.findOne(id, user);
  }

  /**
   * Requisito 3.10: dos rangos se cruzan si
   *   existente.inicio < nuevo.fin  AND  existente.fin > nuevo.inicio
   * Las comparaciones son estrictas: uno que termina a las 9:00 y otro que empieza
   * a las 9:00 no se cruzan (caso d). Se filtra solo por mecánico, sin importar el taller.
   * shortcut: dos requests simultáneos pueden pasar ambos el chequeo; si hace falta
   * garantía total, agregar una restricción EXCLUDE con tstzrange en PostgreSQL.
   */
  private async validarHorarioMecanico(
    mecanicoId: string,
    inicio: Date,
    fin: Date,
  ): Promise<void> {
    const cruce = await this.mantenimientoRepository.findOne({
      where: {
        mecanico: { id: mecanicoId },
        estado: In(ESTADOS_ACTIVOS),
        fechaProgramada: LessThan(fin),
        fechaFinEstimada: MoreThan(inicio),
      },
    });
    if (cruce) {
      throw new ConflictException(
        `El mecánico ya tiene un mantenimiento entre ${cruce.fechaProgramada.toISOString()} y ${cruce.fechaFinEstimada.toISOString()}`,
      );
    }
  }

  /** El técnico solo puede ver y operar los mantenimientos asignados a él */
  private validarAcceso(mantenimiento: Mantenimiento, user: JwtPayload): void {
    if (
      user.role === Role.TECHNICIAN &&
      mantenimiento.mecanico.usuario.id !== user.sub
    ) {
      throw new ForbiddenException('Este mantenimiento no está asignado a ti');
    }
  }
}