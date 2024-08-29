import { BadRequestException, Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { BADRESP } from 'dns/promises';

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
      console.log('LINE17', process.env.JWT_SECRET);
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
