import Tesseract from 'tesseract.js';

export interface OCRResult {
  tanggal: string;
  namaOperator: string;
  unitAlat: string;
  hmAwal: number;
  hmAkhir: number;
  totalJam: number;
  rawText: string;
  confidence: number;
}

export async function extractTimesheetData(imagePath: string): Promise<OCRResult> {
  const result = await Tesseract.recognize(imagePath, 'ind+eng', {
    logger: (m) => console.log(m),
  });

  const text = result.data.text;
  const confidence = result.data.confidence;

  const parsedData = parseTimesheetText(text);

  return {
    ...parsedData,
    rawText: text,
    confidence,
  };
}

function parseTimesheetText(text: string): Omit<OCRResult, 'rawText' | 'confidence'> {
  let tanggal = '';
  let namaOperator = '';
  let unitAlat = '';
  let hmAwal = 0;
  let hmAkhir = 0;

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch && !tanggal) {
      tanggal = dateMatch[1];
    }

    if (lowerLine.includes('operator') || lowerLine.includes('nama')) {
      const parts = line.split(/[:\s]+/);
      const idx = parts.findIndex(p => p.toLowerCase().includes('operator') || p.toLowerCase().includes('nama'));
      if (idx !== -1 && parts[idx + 1]) {
        namaOperator = parts.slice(idx + 1).join(' ').trim();
      }
    }

    if (lowerLine.includes('unit') || lowerLine.includes('alat') || lowerLine.includes('kode')) {
      const parts = line.split(/[:\s]+/);
      const idx = parts.findIndex(p => 
        p.toLowerCase().includes('unit') || 
        p.toLowerCase().includes('alat') ||
        p.toLowerCase().includes('kode')
      );
      if (idx !== -1 && parts[idx + 1]) {
        unitAlat = parts.slice(idx + 1).join(' ').trim();
      }
    }

    if (lowerLine.includes('hm') || lowerLine.includes('hour meter')) {
      const numbers = line.match(/\d+\.?\d*/g);
      if (numbers && numbers.length >= 2) {
        const num1 = parseFloat(numbers[0]);
        const num2 = parseFloat(numbers[1]);
        if (num1 < num2) {
          hmAwal = num1;
          hmAkhir = num2;
        } else {
          hmAwal = num2;
          hmAkhir = num1;
        }
      } else if (numbers && numbers.length === 1) {
        if (lowerLine.includes('awal') || lowerLine.includes('start')) {
          hmAwal = parseFloat(numbers[0]);
        } else if (lowerLine.includes('akhir') || lowerLine.includes('end')) {
          hmAkhir = parseFloat(numbers[0]);
        }
      }
    }
  }

  const totalJam = hmAkhir > hmAwal ? hmAkhir - hmAwal : 0;

  return {
    tanggal,
    namaOperator,
    unitAlat,
    hmAwal,
    hmAkhir,
    totalJam,
  };
}
