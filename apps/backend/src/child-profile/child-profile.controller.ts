import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { MockAuthGuard } from '../mock-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string };
}

interface CreateChildProfileDto {
  name: string;
  age: number;
  gender: string;
  interests: string[];
}

interface UpdateChildProfileDto {
  name?: string;
  age?: number;
  gender?: string;
  interests?: string[];
}

@Controller('child-profiles')
@UseGuards(MockAuthGuard)
export class ChildProfileController {
  constructor(private readonly childProfileService: ChildProfileService) {}

  @Post()
  create(@Body() createDto: CreateChildProfileDto, @Req() req: AuthenticatedRequest) {
    return this.childProfileService.create({ ...createDto, userId: req.user.id });
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.childProfileService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childProfileService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateChildProfileDto) {
    return this.childProfileService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.childProfileService.remove(id);
  }
}
