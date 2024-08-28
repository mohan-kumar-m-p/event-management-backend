import { HttpStatus } from '@nestjs/common';

export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: HttpStatus;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    statusCode: HttpStatus = HttpStatus.OK,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success<T>(
    message: string,
    data?: T,
    statusCode: HttpStatus = HttpStatus.OK,
  ): ApiResponse<T> {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error<T>(
    message: string,
    data?: T,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ): ApiResponse<T> {
    return new ApiResponse(false, message, data, statusCode);
  }
}
