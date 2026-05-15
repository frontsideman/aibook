import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateBookPdf(pages: { text: string; imageUrl?: string }[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A3',
        layout: 'landscape',
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) {
          doc.addPage();
        }

        if (page.imageUrl) {
          try {
            const response = await fetch(page.imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // A3 Landscape dimensions in points: 1190.55 x 841.89
            // Fill the whole page with the image
            doc.image(buffer, 0, 0, {
              width: doc.page.width,
              height: doc.page.height,
            });
          } catch (error) {
            console.error(`Failed to fetch image from ${page.imageUrl}:`, error);
            // Fallback: just add a placeholder or continue with text only
          }
        }

        // Add text overlay
        // Position it at the bottom with some semi-transparent background if possible, 
        // or just plain text for now.
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
    });
  }
}
