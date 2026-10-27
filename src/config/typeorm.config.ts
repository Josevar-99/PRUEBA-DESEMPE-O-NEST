import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Cargar .env para DataSource CLI si se ejecuta fuera de Nest
dotenvConfig();

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - TYPEORM / CONEXIÓN DE BASE DE DATOS]:
 * 1. type: 'postgres' (cambiar a 'mysql', 'sqlite', etc. si el enunciado lo pide).
 * 2. synchronize: 'true' en desarrollo auto-crea/actualiza las tablas a partir de las entidades.
 *    En producción se debe poner en false y usar migraciones.
 * 3. ssl: Si te piden conectar a una BD en la nube (Neon, Supabase, Render),
 *    descomenta: ssl: { rejectUnauthorized: false }
 * 4. logging: poner en true si necesitas ver las consultas SQL reales en la terminal para depurar.
 */
export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST'),
  port: configService.get<number>('POSTGRES_PORT'),
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_DB'),

  // Carga automáticamente todas las entidades registradas en módulos mediante TypeOrmModule.forFeature([TuEntidad])
  autoLoadEntities: true,

  // Sincronización automática del esquema con las entidades (útil para pruebas)
  synchronize: configService.get<string>('NODE_ENV') !== 'production',

  // Habilitar para ver queries SQL en consola (útil durante la prueba para depurar)
  logging: configService.get<string>('NODE_ENV') === 'development',

  // 💡 Si usas BD en la nube con SSL (ej: Supabase, Neon, Render), descomentar:
  // ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
};

/**
 * 💡 [DATASOURCE PARA TYPEORM CLI]:
 * Utilizado por comandos de consola como 'typeorm migration:generate' o 'typeorm migration:run'.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'performance_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV !== 'production',
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
