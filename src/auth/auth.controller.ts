import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { AuthService } from './auth.service';
import { OtpEmailDto } from './dto/otpEmail.dto';
import { OtpPhoneDto } from './dto/otpPhone.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(AuthGuard('local'))
  @Post('organizer/login')
  async organizerlogin(
    @Req() authenticated,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<any>> {
    try {
      const roles = authenticated.user.roles;
      const { access_token } = this.authService.organizerLogin(
        authenticated.user,
      );

      if (roles.includes(OrganizerRole.MessManager)) {
        return ApiResponse.success('Login Successful', {
          user: authenticated.user,
          access_token,
        });
      } else {
        response.cookie('access_token', access_token, {
          httpOnly: true,
          secure: false,
        });
        return ApiResponse.success('Login Successful', authenticated.user);
      }
    } catch (error) {
      console.log(`Error occured during user login: ${error}`);
      throw error;
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): ApiResponse<any> {
    try {
      response.clearCookie('access_token', {
        httpOnly: true,
        secure: false,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax',
      });
      return ApiResponse.success('Logout Successful');
    } catch (error) {
      console.log(`Error occurred during logout: ${error}`);
      throw error;
    }
  }

  @Post('otp/generate-phone-otp')
  async generatePhoneOTP(
    @Body() otpPhoneDto: OtpPhoneDto,
  ): Promise<ApiResponse<any>> {
    const { entity, phoneNumber } = otpPhoneDto;
    await this.authService.generateOtpPhone(entity, phoneNumber);
    return ApiResponse.success('OTP generated successfully');
  }

  @UseGuards(AuthGuard('otp-phone'))
  @Post('otp/login-phone')
  async otpPhoneLogin(
    @Req() authenticated,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<any>> {
    try {
      const { access_token } = this.authService.otpPhoneLogin(
        authenticated.user,
      );
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

  @Post('otp/generate-email-otp')
  async generateEmailOTP(
    @Body() otpEmailDto: OtpEmailDto,
  ): Promise<ApiResponse<any>> {
    const { entity, email } = otpEmailDto;
    await this.authService.generateOtpEmail(entity, email);
    return ApiResponse.success('OTP generated successfully');
  }

  @UseGuards(AuthGuard('otp-email'))
  @Post('otp/login-email')
  async otpEmailLogin(
    @Req() authenticated,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<any>> {
    try {
      const { access_token } = this.authService.otpEmailLogin(
        authenticated.user,
      );
      response.cookie('access_token', access_token, {
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax',
      });
      delete authenticated.user.password;
      return ApiResponse.success('Login Successful', authenticated.user);
    } catch (error) {
      console.log(`Error occured during user login: ${error}`);
      throw error;
    }
  }

  // TODO FIX THIS METHOD. NO FLOW
  @UseGuards(AuthGuard('password-login'))
  @Post('password-login')
  async passwordLogin(
    @Req() authenticated,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<any>> {
    try {
      const { access_token } = this.authService.userPasswordLogin(
        authenticated.user,
      );

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

  @UseGuards(AuthGuard('jwt'))
  @Get('role')
  getRole(@Req() request): any {
    const user = request.user; // Extract user from request
    if (!user || !user.roles) {
      return ApiResponse.error('User roles not found', 404);
    }
    return ApiResponse.success('Roles retrieved successfully', user.roles); // Return roles
  }
}
