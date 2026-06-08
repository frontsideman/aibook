import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

const s3Mock = mockClient(S3Client);

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, fallback?: string) => {
    const config: Record<string, string> = {
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'minioadmin',
      AWS_SECRET_ACCESS_KEY: 'minioadmin',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_BUCKET: 'test-bucket',
    };
    return config[key] ?? fallback;
  }),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    s3Mock.reset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file to S3', async () => {
    const bucket = 'test-bucket';
    const key = 'test-key';
    const body = Buffer.from('test content');
    const contentType = 'text/plain';

    s3Mock.on(PutObjectCommand).resolves({});

    const result = await service.upload(key, body, contentType);

    expect(result).toBeDefined();
    expect(s3Mock.calls()).toHaveLength(1);
    expect(s3Mock.call(0).args[0].input).toMatchObject({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
  });
});
