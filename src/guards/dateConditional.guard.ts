import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { OrganizerRole } from '../shared/roles';

export function DateConditionalGuard(sport: string): Type<CanActivate> {
  @Injectable()
  class DateGuardMixin implements CanActivate {

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
      const user = request.user;  

      if (!user || !user.roles) {
        return false;
      }

      if (
        user.roles.includes(OrganizerRole.Admin) ||
        user.roles.includes(OrganizerRole.RegistrationInCharge)
      ) {
        return true;  
      }

      return false;
    }
  }

  return DateGuardMixin;
}
