import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  async newPayment(createPaymentDto: CreatePaymentDto) {
    try {
      const { userId, price, phone, name } = createPaymentDto;
      const merchantTransactionId = 'TXN' + Date.now();
      const TEST_MERCHANT_ID = process.env.TEST_MERCHANT_ID;
      const TEST_SALT_KEY = process.env.TEST_SALT_KEY;
      const TEST_PHONEPE_HOST = process.env.TEST_PHONEPE_HOST;
      const PORT = process.env.PORT;

      if (!TEST_MERCHANT_ID || !TEST_SALT_KEY) {
        throw new BadRequestException(
          'Environment variables TEST_MERCHANT_ID and TEST_SALT_KEY must be set',
        );
      }

      const data = {
        merchantId: TEST_MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: 'MUID' + userId,
        name: name,
        amount: price * 100,
        redirectUrl: `http://localhost:${PORT}/status/${merchantTransactionId}`,
        redirectMode: 'POST',
        mobileNumber: phone,
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };

      const payload = JSON.stringify(data);
      const payloadBase64 = Buffer.from(payload).toString('base64');
      const keyIndex = 1;
      const stringToHash = payloadBase64 + '/pg/v1/pay' + TEST_SALT_KEY;
      const sha256 = crypto
        .createHash('sha256')
        .update(stringToHash)
        .digest('hex');
      const checksum = sha256 + '###' + keyIndex;

      const options = {
        method: 'POST',
        url: `${TEST_PHONEPE_HOST}/pg/v1/pay`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
        },
        data: {
          request: payloadBase64,
        },
      };

      const response = await axios(options);

      if (
        response.data.data &&
        response.data.data.instrumentResponse &&
        response.data.data.instrumentResponse.redirectInfo
      ) {
        return {
          success: true,
          redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
        };
      } else {
        throw new BadRequestException('Invalid response from PhonePe');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while processing the payment',
      );
    }
  }

  async checkStatus(merchantTransactionId: string) {
    try {
      const TEST_MERCHANT_ID = process.env.TEST_MERCHANT_ID;
      const TEST_SALT_KEY = process.env.TEST_SALT_KEY;
      const TEST_PHONEPE_HOST = process.env.TEST_PHONEPE_HOST;
      const keyIndex = 1;
      const string =
        `/pg/v1/status/${TEST_MERCHANT_ID}/${merchantTransactionId}` +
        TEST_SALT_KEY;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = sha256 + '###' + keyIndex;

      const options = {
        method: 'GET',
        url: `${TEST_PHONEPE_HOST}/pg/v1/status/${TEST_MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': TEST_MERCHANT_ID,
        },
      };

      const response = await axios.request(options);
      if (response.data.success === true) {
        return {
          success: true,
          message: 'Payment Success',
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: 'Payment Failure',
          data: response.data,
        };
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while checking the payment status',
      );
    }
  }
}
