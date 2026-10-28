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
import { WorkshopsService } from './workshops.service.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';

/**
 * Querying is available to any authenticated user: the technician needs to see the
 * workshop for each maintenance. Creating, editing and changing status is ADMIN only.
 */
@ApiTags('workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Register workshop (ADMIN only)' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active workshops' })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workshop (includes inactive)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update name or address (ADMIN only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate workshop (ADMIN only)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.changeStatus(id, ActiveStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate workshop: soft delete (ADMIN only)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.changeStatus(id, ActiveStatus.INACTIVE);
  }
}