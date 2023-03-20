import {
  CanActivate,
  ExecutionContext,
  mixin,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { isUndefined } from '../../config/utils/validation.util';

export function FeatureFlagGuard(feature: string): Type<CanActivate> {
  class FeatureFlagGuardClass implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    public canActivate(context: ExecutionContext): boolean {
      const isActive = this.configService.get<boolean | undefined>(feature);

      if (isUndefined(isActive) || !isActive) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        throw new NotFoundException(`Cannot ${request.method} ${request.url}`);
      }

      return true;
    }
  }

  return mixin(FeatureFlagGuardClass);
}
