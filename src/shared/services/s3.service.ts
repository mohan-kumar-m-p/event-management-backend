import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import * as mime from 'mime-types'; // Replace with mime-types

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<Record<string, string | number>> {
    try {
      const { originalname, buffer } = file;
      const bucketName = process.env.S3_BUCKET_NAME;
      const currentTimestamp: string = Date.now().toString();
      const params: AWS.S3.PutObjectRequest = {
        Bucket: bucketName,
        Key: `${folder}/${originalname}-${currentTimestamp}`,
        Body: buffer,
      };

      const uploadResponse: ManagedUpload.SendData = await this.s3
        .upload(params)
        .promise();
      this.logger.log(`File uploaded to S3 bucket: ${bucketName}`);

      const mimeType = mime.lookup(originalname) || 'application/octet-stream'; // Use mime-types

      const uploadedFileData: Record<string, string | number> = {
        fileName: originalname,
        fileSize: buffer.length,
        fileMimeType: mimeType,
        fileKey: uploadResponse.Key,
      };

      return uploadedFileData;
    } catch (error) {
      this.logger.error(
        `Error occurred while uploading file to S3: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteFile(bucketName: string, fileKey: string): Promise<void> {
    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: bucketName,
        Key: fileKey,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`File deleted from S3 bucket: ${fileKey}`);
    } catch (error) {
      this.logger.error(
        `Error occurred while deleting file from S3: ${error.message}`,
      );
      throw error;
    }
  }

  async getFile(bucketName: string, fileKey: string): Promise<AWS.S3.GetObjectOutput> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: bucketName,
        Key: fileKey,
      };
  
      const fileData = await this.s3.getObject(params).promise();
      this.logger.log(`File retrieved from S3 bucket: ${fileKey}`);
  
      return fileData;
    } catch (error) {
      this.logger.error(
        `Error occurred while retrieving file from S3: ${error.message}`,
      );
      throw error;
    }
  }
  
}
