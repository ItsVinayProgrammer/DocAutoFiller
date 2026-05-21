import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractPdfText(file: File): Promise<string> {
  if (file.type !== 'application/pdf') {
    throw new Error('Please upload a PDF document.');
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ');

    if (pageText.trim()) {
      pages.push(pageText.trim());
    }
  }

  const combined = pages.join('\n\n');
  if (!combined.trim()) {
    throw new Error('No extractable text found in the PDF. If this is a scanned image, OCR is needed.');
  }

  return combined;
}
