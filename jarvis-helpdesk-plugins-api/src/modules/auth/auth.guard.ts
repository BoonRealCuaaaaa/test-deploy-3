import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    // const userId = this.extractUserIdFromHeader(request);
    // if (!userId) {
    //   throw new UnauthorizedException();
    // }

    request['userId'] = 'bc7bc979-034e-4fc5-9d3d-fcba6e0c37d4';
    return true;
  }

  private extractUserIdFromHeader(request: Request): string | undefined {
    const [type, userId] = request.headers.authorization?.split(' ') ?? [];
    return type === 'UserId' ? userId : undefined;
  }
}
