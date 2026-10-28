import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MaintenancesService } from './maintenances.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

/**
 * Fixed routes (active, assigned-to-me, vehicle/..., mechanic/...) go BEFORE
 * ':id'. Nest evaluates routes in order, and if ':id' were first,
 * "active" would reach the ParseUUIDPipe and respond with 400.
 */
@ApiTags('maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create maintenance: born SCHEDULED (ADMIN only)' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all maintenances' })
  findAll() {
    return this.maintenancesService.findAll();
  }

  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List SCHEDULED and IN_PROGRESS maintenances' })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('assigned-to-me')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Maintenances assigned to the authenticated technician' })
  findAssignedToCurrentUser(@CurrentUser() user: JwtPayload) {
    return this.maintenancesService.findAssignedToCurrentUser(user.sub);
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Maintenances for a vehicle (all statuses)' })
  findByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'History for a vehicle (COMPLETED only)' })
  vehicleHistory(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.maintenancesService.vehicleHistory(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Maintenances assigned to a mechanic' })
  findByMechanic(@Param('mechanicId', ParseUUIDPipe) mechanicId: string) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Detail of a maintenance (technician only sees their own)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Change status (COMPLETED requires closing data)' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.changeStatus(id, dto, user);
  }
}