import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';
import { MockAuthGuard } from '../mock-auth.guard';

@Controller('child-profiles')
@UseGuards(MockAuthGuard)
export class ChildProfileController {
  constructor(private readonly childProfileService: ChildProfileService) {}

  @Post()
  create(@Body() createDto: any, @Req() req: any) {
    return this.childProfileService.create({ ...createDto, userId: req.user.id });
  }

  @Get()
  findAll(@Req() req: any) {
    return this.childProfileService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childProfileService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.childProfileService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.childProfileService.remove(id);
  }
}
