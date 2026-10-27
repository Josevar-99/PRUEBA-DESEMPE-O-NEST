import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { Role } from '../../common/enums/role.enum.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - PRUEBAS UNITARIAS DE SERVICIOS EN JEST]:
 *
 * ESTRUCTURA BASE PARA PROBAR CUALQUIER SERVICIO CON REPOSITORIOS:
 * 1. Define un objeto `mockRepository` con jest.fn() para los métodos usados (find, findOne, create, save, remove).
 * 2. Inyecta el mock con `{ provide: getRepositoryToken(TuEntidad), useValue: mockRepository }`.
 * 3. En cada test (`it`), configura el resultado esperado con:
 *    `mockRepository.metodo.mockResolvedValue(datosSimulados)`
 * 4. Ejecuta el método del servicio y aserta con `expect(...)`.
 */
describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un usuario exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario si existe', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const user = await service.findOne(mockUser.id);
      expect(user).toEqual(mockUser);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar usuarios paginados', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ page: 1, limit: 10, skip: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
