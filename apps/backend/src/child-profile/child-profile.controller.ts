import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ChildProfileService } from './child-profile.service';
import { MockAuthGuard } from '../mock-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string };
}

export class CreateChildProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(18)
  age!: number;

  @IsString()
  @IsIn(['male', 'female'])
  gender!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests!: string[];
}

export class UpdateChildProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(18)
  age?: number;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  gender?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
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
