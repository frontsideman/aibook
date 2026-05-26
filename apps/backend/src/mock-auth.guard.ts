import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const isMock = this.configService.get('MOCK_AUTH') === 'true';
    if (!isMock) {
      // In a real app, this would be where passport-google-oauth20 or similar is checked
      return false; 
    }

    const request = context.switchToHttp().getRequest();
    // Inject a mock user into the request
    request.user = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
    };

    return true;
  }
}
