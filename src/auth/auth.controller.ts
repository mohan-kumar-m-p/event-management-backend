import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { AuthService } from './auth.service';
import { OtpPhoneDto } from './dto/otpPhone.dto';
import { OtpEmailDto } from './dto/otpEmail.dto';

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
      const { access_token } = this.authService.organizerLogin(
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

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return ApiResponse.success('Logout Successful');
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
    @Body() otpPhoneDto: OtpEmailDto,
  ): Promise<ApiResponse<any>> {
    const { entity, email } = otpPhoneDto;
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
      });
      return ApiResponse.success('Login Successful', authenticated.user);
    } catch (error) {
      console.log(`Error occured during user login: ${error}`);
      throw error;
    }
  }

}
