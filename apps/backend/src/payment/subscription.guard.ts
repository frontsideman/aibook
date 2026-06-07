import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.user?.email ?? request.headers['user-email'];

    if (!email) {
      throw new ForbiddenException('User email required for subscription check');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user || !user.subscriptionActive) {
      throw new ForbiddenException('Active subscription required');
    }

    return true;
  }
}
