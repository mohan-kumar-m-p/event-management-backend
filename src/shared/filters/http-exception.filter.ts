import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ApiResponse } from '../dto/api-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let data: any;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      message =
        (exceptionResponse as { message?: string }).message ||
        'An error occurred';
      data = (exceptionResponse as { data?: any }).data;
    } else {
      message = 'An error occurred';
    }

    const errorResponse = ApiResponse.error(message, data, status);

    response.status(status).json(errorResponse);
  }
}
