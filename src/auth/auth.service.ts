import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrganizerService } from '../organizer/organizer.service';
import { verifyPassword } from './utils/utils';

@Injectable()
export class AuthService {
  constructor(
    private organizerService: OrganizerService,
    private jwtService: JwtService,
  ) {}

  async authenticateOrganizer(
    loginRequestEmail: string,
    loginRequestPassword: string,
  ) {
    const organizer =
      await this.organizerService.getLoginOrganizer(loginRequestEmail);
    if (!organizer) {
      throw new UnauthorizedException(
        `Invalid login credentials. Please try again`,
      );
    }
    const organizerPassword: string = organizer.password;
    const isPasswordVerified: boolean = await verifyPassword(
      loginRequestPassword,
      organizerPassword,
    );
    if (!isPasswordVerified) {
      throw new UnauthorizedException(
        `Invalid login credentials. Please try again`,
      );
    } else {
      delete organizer.password;
      return organizer;
    }
  }

  login(authenticatedUser: Record<string, string>): Record<string, string> {
    const jwtPaylod: any = {
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      roles: authenticatedUser.roles,
    };
    return {
      access_token: this.jwtService.sign(jwtPaylod),
    };
  }
}
