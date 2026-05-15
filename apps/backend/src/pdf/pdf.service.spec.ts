import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
    
    // Mock global fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a PDF buffer with images', async () => {
    const pages = [
      { text: 'Page 1', imageUrl: 'https://example.com/image1.png' },
      { text: 'Page 2', imageUrl: 'https://example.com/image2.png' },
    ];

    const buffer = await service.generateBookPdf(pages);

    expect(buffer).toBeDefined();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
