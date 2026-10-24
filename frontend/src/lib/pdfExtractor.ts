import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Extracts readable plain text from a PDF file in the browser using PDF.js.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 30); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .filter(Boolean);

      const pageText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();
      if (pageText) {
        fullText += (fullText ? '\n\n' : '') + pageText;
      }
    }

    const cleaned = fullText.trim();

    // Check if extracted text is valid and not binary raw PDF
    if (!cleaned || cleaned.startsWith('%PDF-') || cleaned.includes('/FlateDecode') || cleaned.length < 20) {
      throw new Error(
        'This PDF appears to be a scanned image or contains encrypted graphics without a readable text layer. Please type or paste your study notes in the text box below.'
      );
    }

    return cleaned;
  } catch (err: any) {
    if (err.message && err.message.includes('scanned image')) {
      throw err;
    }
    throw new Error(
      'Could not extract text from this PDF file. Please copy and paste the text from your lesson into the text box below.'
    );
  }
}
