import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(
  Strategy,
  'password-login',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Set to accept 'email' as the username
      passReqToCallback: true, // This allows the request to be passed to the validate function
    });
  }

  // Now we can access the full request, including the 'entity' field
  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<unknown> {
    const entity = req.body.entity; // Retrieve 'entity' from the request body
    const user = await this.authService.authenticateUser(
      email,
      password,
      entity,
    );
    return user;
  }
}
