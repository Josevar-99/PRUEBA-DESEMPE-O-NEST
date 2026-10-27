import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - HEALTH CHECK]:
 * Permite a evaluadores y sistemas de monitoreo (Docker, Kubernetes) verificar
 * que tanto la API como la base de datos PostgreSQL se encuentran operativas.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verificar el estado del servidor y la base de datos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Servidor y BD operativos',
  })
  async checkHealth() {
    let dbStatus = 'disconnected';
    try {
      if (this.dataSource.isInitialized) {
        // Ejecuta query liviana para comprobar conectividad real con PostgreSQL
        await this.dataSource.query('SELECT 1');
        dbStatus = 'connected';
      }
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
