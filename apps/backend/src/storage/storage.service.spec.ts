import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

const s3Mock = mockClient(S3Client);

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    s3Mock.reset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
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
