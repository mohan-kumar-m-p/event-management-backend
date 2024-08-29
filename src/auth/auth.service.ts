import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OrganizerService } from '../organizer/organizer.service';
import { verifyPassword } from './utils/utils';
import { JwtService } from '@nestjs/jwt';

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
      email: authenticatedUser.email,
      sub: authenticatedUser.id,
    };
    return {
      access_token: this.jwtService.sign(jwtPaylod),
    };
  }
}
