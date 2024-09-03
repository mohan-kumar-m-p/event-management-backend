import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@UseGuards(AuthGuard('jwt'))
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('new')
  async newPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<ApiResponse<any>> {
    const result = await this.paymentService.newPayment(createPaymentDto);
    return ApiResponse.success('Payment initiated successfully', result);
  }

  @Get('status/:txnId')
  async checkStatus(@Param('txnId') txnId: string): Promise<ApiResponse<any>> {
    const result = await this.paymentService.checkStatus(txnId);
    return ApiResponse.success('Payment status retrieved successfully', result);
  }
}
