import { SetMetadata } from '@nestjs/common';

export { ApiStandardErrors } from './api-responses.decorator';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getTenantContext } from '../tenant/tenant.context';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext) => getTenantContext(),
);
