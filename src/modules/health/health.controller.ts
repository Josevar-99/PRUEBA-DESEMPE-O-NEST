import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator.js';

/**
 * 💡 [ADAPT FOR THE TEST - HEALTH CHECK]:
 * Allows evaluators and monitoring systems (Docker, Kubernetes) to verify that
 * both the API and the PostgreSQL database are operational.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check the status of the server and database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Server and database are operational',
  })
  async checkHealth() {
    let dbStatus = 'disconnected';
    try {
      if (this.dataSource.isInitialized) {
        // Run a lightweight query to verify the PostgreSQL connection.
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
