import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Entity } from '../entity.enum';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(Strategy, 'password-login') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(
    email: string,
    password: string,
    entity: Entity,
  ): Promise<unknown> {
    const user = await this.authService.authenticateUser(
      email,
      password,
      entity,
    );
    return user;
  }
}
