import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/guards/role.guard';
import { OrganizerRole, SchoolRole } from 'src/shared/roles';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { PaymentService } from './payment.service';

@UseGuards(AuthGuard('jwt'))
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getPaymentAmount(@Request() req): Promise<ApiResponse<any>> {
    const affiliationNumber = req?.user?.sub;

    const payment =
      await this.paymentService.getPaymentAmount(affiliationNumber);
    return ApiResponse.success('Payment amount fetched successfully', payment);
  }

  @Put('update-payment-status-organizer')
  @UseGuards(RolesGuard([OrganizerRole.AccountsManager]))
  async updatePaymentStatusOrganizer(
    @Body() paymentDto: any,
  ): Promise<ApiResponse<any>> {
    await this.paymentService.updatePaymentStatusOrganizer(paymentDto);
    return ApiResponse.success('Payment status updated successfully');
  }

  @Put('update-payment-status-school')
  @UseGuards(RolesGuard([SchoolRole.School]))
  async updatePaymentStatusSchool(
    @Body() paymentDto: any,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const affiliationNumber = req?.user?.sub;
    const status = paymentDto?.status;
    await this.paymentService.updatePaymentStatusSchool(
      affiliationNumber,
      status,
    );
    return ApiResponse.success('Payment status updated successfully');
  }
}
