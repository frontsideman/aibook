import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(configService: ConfigService) {
    const endpoint = configService.get('S3_ENDPOINT', 'http://localhost:9000');

    this.s3Client = new S3Client({
      region: configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID', 'minioadmin'),
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY', 'minioadmin'),
      },
      endpoint,
      forcePathStyle: true,
    });
    this.bucket = configService.get('S3_BUCKET', 'test-bucket');
    this.publicBaseUrl = configService.get('S3_PUBLIC_URL', endpoint).replace(/\/$/, '');
  }

  async upload(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return { key, bucket: this.bucket };
  }

  getPublicUrl(key: string) {
    return `${this.publicBaseUrl}/${this.bucket}/${key}`;
  }
}
