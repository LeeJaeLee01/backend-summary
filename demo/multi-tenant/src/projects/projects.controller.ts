import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentContext } from '../common/decorators/current-context.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequestContext } from '../common/types/request-context';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /projects — Bước 4 cần projects:read, Bước 5-6 query tenant schema
   */
  @Get()
  @RequirePermissions('projects:read')
  findAll(@CurrentContext() ctx: RequestContext) {
    return this.projectsService.findAll(ctx);
  }

  @Get('count')
  @RequirePermissions('projects:read')
  count(@CurrentContext() ctx: RequestContext) {
    return this.projectsService.count(ctx);
  }

  @Post()
  @RequirePermissions('projects:create')
  create(@CurrentContext() ctx: RequestContext, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(ctx, dto);
  }
}
