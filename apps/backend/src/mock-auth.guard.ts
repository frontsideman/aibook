import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

const MOCK_USER = {
  id: 'mock-user-id',
  email: 'mock@example.com',
  name: 'Mock User',
} as const;

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMock = this.configService.get('MOCK_AUTH') === 'true';
    if (!isMock) {
      // In a real app, this would be where passport-google-oauth20 or similar is checked
      return false; 
    }

    await this.prisma.client.user.upsert({
      where: { id: MOCK_USER.id },
      update: {
        email: MOCK_USER.email,
        subscriptionActive: true,
      },
      create: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        subscriptionActive: true,
      },
    });

    const request = context.switchToHttp().getRequest();
    // Inject a mock user into the request
    request.user = MOCK_USER;

    return true;
  }
}
