import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface RequestUser {
  id: string;
  username: string;
  role: string;
  isGlobalAdmin?: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
