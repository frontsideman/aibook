import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateBookPdf(pages: { text: string; imageUrl?: string }[]): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A3',
      layout: 'landscape',
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });

    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) {
          doc.addPage();
        }

        if (page.imageUrl) {
          try {
            const response = await fetch(page.imageUrl);
            
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.startsWith('image/')) {
              throw new Error(`Invalid content type: ${contentType} for image ${page.imageUrl}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            doc.image(buffer, 0, 0, {
              width: doc.page.width,
              height: doc.page.height,
            });
          } catch (error) {
            console.error(`Failed to fetch image from ${page.imageUrl}:`, error);
          }
        }

        const textHeight = 100;
        const padding = 50;
        
        doc
          .fillColor('black')
          .fontSize(30)
          .text(
            page.text,
            padding,
            doc.page.height - textHeight - padding,
            {
              width: doc.page.width - 2 * padding,
              align: 'center',
            }
          );
      }
      doc.end();
    } catch (err) {
      doc.emit('error', err);
    }

    return resultPromise;
  }
}
