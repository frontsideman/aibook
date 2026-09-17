import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ChildProfileService } from './child-profile.service';
import { MockAuthGuard } from '../mock-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string };
}

class CreateChildProfileDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(18)
  age!: number;

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsArray()
  interests!: string[];
}

class UpdateChildProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(18)
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsArray()
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
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.childProfileService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateChildProfileDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.childProfileService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.childProfileService.remove(id, req.user.id);
  }
}
