import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Role } from '../../common/enums/role.enum.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - LÓGICA DE NEGOCIO / SERVICIO]:
 * Aquí reside la lógica principal del recurso.
 *
 * 💡 CONSEJOS PARA LA PRUEBA:
 * 1. Para cargar relaciones:
 *    `this.userRepository.findOne({ where: { id }, relations: ['ordenes', 'perfil'] })`
 * 2. Para consultas avanzadas con QueryBuilder:
 *    `this.userRepository.createQueryBuilder('user')`
 *      `.leftJoinAndSelect('user.orders', 'order')`
 *      `.where('user.isActive = :active', { active: true })`
 *      `.getMany();`
 * 3. Transacciones con DataSource:
 *    Si una operación modifica múltiples tablas, inyecta `DataSource` y usa `dataSource.transaction(...)`.
 */
@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 💡 Seeder automático al arrancar la aplicación:
   * Crea un usuario ADMIN por defecto para que puedas iniciar sesión de inmediato en Swagger o Postman.
   */
  async onApplicationBootstrap() {
    await this.seedInitialAdmin();
  }

  async seedInitialAdmin() {
    try {
      const adminEmail = 'admin@example.com';
      const existing = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash('Admin123456*', 10);
        const admin = this.userRepository.create({
          name: 'Administrador Inicial',
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN,
          isActive: true,
        });

        await this.userRepository.save(admin);
        this.logger.log(
          '🌱 Usuario ADMIN inicial creado: admin@example.com / Admin123456*',
        );
      }
    } catch (error) {
      this.logger.debug(`Nota de seeder inicial: ${(error as Error).message}`);
    }
  }

  /**
   * Crear usuario con encriptación de contraseña
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Verificar si el correo ya existe
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `El usuario con el email ${createUserDto.email} ya está registrado`,
      );
    }

    // Hasheo de contraseña con bcrypt (10 rondas de sal)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);

    // Omitir la contraseña en el objeto de retorno por seguridad
    const { password: _password, ...userWithoutPassword } = saved;
    return userWithoutPassword;
  }

  /**
   * Listar usuarios paginados
   */
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, skip } = paginationDto;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      // 💡 Si necesitas cargar relaciones, agrégalas aquí:
      // relations: ['orders'],
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar usuario por ID (UUID)
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }
    return user;
  }

  /**
   * Buscar usuario por email (usado internamente por AuthService)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Actualizar usuario
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(id);

    // Si se envía nueva contraseña, hashearla antes de guardar
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Si se actualiza el correo, comprobar que no esté tomado por otro usuario
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new ConflictException('El nuevo correo ya está en uso');
      }
    }

    const updated = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });

    const { password: _password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

//   /**
//    * Eliminar usuario
//    */
//   async remove(id: string): Promise<{ deleted: boolean; id: string }> {
//     const user = await this.findOne(id);
//     await this.userRepository.remove(user);
//     return { deleted: true, id };
//   }
}
