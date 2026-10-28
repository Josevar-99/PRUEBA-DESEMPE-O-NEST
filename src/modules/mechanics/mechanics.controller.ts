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
import { MechanicsService } from './mechanics.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { ActiveStatus } from '../../common/enums/active-status.enum.js';

/** Mechanic management: everything is ADMIN-only according to the acceptance criteria */
@ApiTags('mechanics')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @ApiOperation({ summary: 'Register mechanic linked to a TECHNICIAN user' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all mechanics' })
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mechanic' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, email or specialty' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMechanicDto,
  ) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate mechanic' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.changeStatus(id, ActiveStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate mechanic (history is preserved)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.mechanicsService.changeStatus(id, ActiveStatus.INACTIVE);
  }
}