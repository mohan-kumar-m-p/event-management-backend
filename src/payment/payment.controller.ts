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

  @Get('payment-details')
  @UseGuards(RolesGuard([OrganizerRole.AccountsManager]))
  async getPaymentDetails(): Promise<ApiResponse<any>> {
    const paymentDetails = await this.paymentService.getPaymentDetails();
    return ApiResponse.success(
      'Payment details fetched successfully',
      paymentDetails,
    );
  }

  @Get('schools-not-paid')
  @UseGuards(RolesGuard([OrganizerRole.AccountsManager]))
  async getSchoolsNotPaid(): Promise<ApiResponse<any>> {
    const schoolsApprovalPending =
      await this.paymentService.getSchoolsNotPaid();
    return ApiResponse.success(
      'Schools in status not paid fetched successfully',
      schoolsApprovalPending,
    );
  }

  @Get('schools-approval-pending')
  @UseGuards(RolesGuard([OrganizerRole.AccountsManager]))
  async getSchoolsApprovalPending(): Promise<ApiResponse<any>> {
    const schoolsApprovalPending =
      await this.paymentService.getSchoolsApprovalPending();
    return ApiResponse.success(
      'Schools in status approval pending fetched successfully',
      schoolsApprovalPending,
    );
  }

  @Get('schools-paid')
  @UseGuards(RolesGuard([OrganizerRole.AccountsManager]))
  async getSchoolsPaid(): Promise<ApiResponse<any>> {
    const schoolsApprovalPending = await this.paymentService.getSchoolsPaid();
    return ApiResponse.success(
      'Schools in status paid fetched successfully',
      schoolsApprovalPending,
    );
  }
}
