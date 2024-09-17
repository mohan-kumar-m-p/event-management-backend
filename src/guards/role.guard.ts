import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
} from '@nestjs/common';
import { OrganizerRole, SchoolRole } from '../shared/roles';

export function RolesGuard(
  roles: Array<OrganizerRole | SchoolRole>,
): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !user.roles) {
        return false;
      }

      if (user.roles.includes(OrganizerRole.Admin)) {
        return true;
      }

      return roles.some((role) => user.roles.includes(role));
    }
  }

  return RoleGuardMixin;
}
