import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() _loginRequest,
    @Req() authenticated,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<any>> {
    try {
      const { access_token } = this.authService.login(authenticated.user);
      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: false,
      });
      return ApiResponse.success('Login Successful', authenticated.user);
    } catch (error) {
      console.log(`Error occured during user login: ${error}`);
      throw error;
    }
  }
}
