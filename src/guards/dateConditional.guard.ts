import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrganizerRole } from '../organizer/roles';

export function DateConditionalGuard(sport: string): Type<CanActivate> {
  @Injectable()
  class RoleGuardMixin implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
      const currentDate = new Date();
      const freezeDate = {
        athletics: new Date('2024-09-20'),
        swimming: new Date('2024-09-06'),
      };

      if (currentDate < freezeDate[sport]) {
        return true;
      }

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

      if (
        decodedToken.roles.includes(OrganizerRole.Admin) ||
        decodedToken.roles.includes(OrganizerRole.RegistrationInCharge)
      ) {
        return true;
      }

      return false;
    }
  }

  return RoleGuardMixin;
}
