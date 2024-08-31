import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrganizerRole } from '../organizer/roles';

export function RolesGuard(roles: OrganizerRole[]): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const token = request.cookies['access_token'];

      if (!token) {
        return false;
      }

      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (err) {
        return false;
      }

      const organizerRoles = decodedToken.roles || [];
      if (organizerRoles.includes(OrganizerRole.Admin)) {
        return true;
      }
      return roles.some((role) => organizerRoles.includes(role));
    }
  }

  return RoleGuardMixin;
}
