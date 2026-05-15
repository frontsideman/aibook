import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ChildProfileService } from './child-profile.service';

@Controller('child-profiles')
export class ChildProfileController {
  constructor(private readonly childProfileService: ChildProfileService) {}

  @Post()
  create(@Body() createDto: any) {
    // userId will come from Auth later, using a mock for now
    return this.childProfileService.create({ ...createDto, userId: 'mock-user-id' });
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.childProfileService.findAll(userId || 'mock-user-id');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childProfileService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.childProfileService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.childProfileService.remove(id);
  }
}
