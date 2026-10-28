import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Load .env for DataSource CLI when run outside of Nest
dotenvConfig();

/**
 * 💡 [ADAPT FOR THE TEST - TYPEORM / DATABASE CONNECTION]:
 * 1. type: 'postgres' (change to 'mysql', 'sqlite', etc. if the specification requires it).
 * 2. synchronize: 'true' in development auto-creates/updates tables from entities.
 *    In production it should be set to false and migrations should be used.
 * 3. ssl: If you need to connect to a cloud DB (Neon, Supabase, Render),
 *    uncomment: ssl: { rejectUnauthorized: false }
 * 4. logging: set to true if you need to see real SQL queries in the terminal for debugging.
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

  // Automatically loads all entities registered in modules via TypeOrmModule.forFeature([YourEntity])
  autoLoadEntities: true,

  // Automatic schema synchronization with entities (useful for testing)
  synchronize: configService.get<string>('NODE_ENV') !== 'production',

  // Enable to see SQL queries in console (useful during testing for debugging)
  logging: configService.get<string>('NODE_ENV') === 'development',

  // 💡 If using a cloud DB with SSL (e.g.: Supabase, Neon, Render), uncomment:
  // ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
};

/**
 * 💡 [DATASOURCE FOR TYPEORM CLI]:
 * Used by console commands like 'typeorm migration:generate' or 'typeorm migration:run'.
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
