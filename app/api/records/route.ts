import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { endOfDateOnly, parseDateOnly } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/octet-stream', // some mobile cameras
]);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const employeeId = searchParams.get('employeeId');
    const all = searchParams.get('all'); // For admin to get all records

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // Filter by employeeId if provided (for employee view)
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Date range filters — parse as calendar dates (UTC midnight..end of day)
    if (start && end) {
      whereClause.tanggal = {
        gte: parseDateOnly(start),
        lte: endOfDateOnly(end),
      };
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = parseDateOnly(`${year}-${String(monthNum).padStart(2, '0')}-01`);
      // Last day of month: day 0 of next month
      const endDate = endOfDateOnly(new Date(Date.UTC(year, monthNum, 0)));
      whereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const records = all
      ? await prisma.hMRecord.findMany({
        where: whereClause,
        orderBy: { tanggal: 'desc' },
        include: { employee: { select: { id: true, nama: true } } },
      })
      : await prisma.hMRecord.findMany({
        where: whereClause,
        orderBy: { tanggal: 'desc' },
      });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const tanggal = formData.get('tanggal') as string;
    const totalHM = parseFloat(formData.get('totalHM') as string);
    const employeeId = formData.get('employeeId') as string | null;

    if (!tanggal || isNaN(totalHM)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (totalHM < 0) {
      return NextResponse.json(
        { error: 'Total HM tidak boleh negatif' },
        { status: 400 }
      );
    }

    let fotoPath: string | null = null;

    // Only process file if provided
    if (file && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'Ukuran gambar maksimal 5 MB. Kompres dulu sebelum upload.' },
          { status: 413 }
        );
      }

      if (file.type && !ALLOWED_MIME.has(file.type) && !file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File harus berupa gambar' },
          { status: 400 }
        );
      }

      // Create uploads directory if not exists (outside public folder)
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Always store as uuid + safe extension
      const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
      const fileName = `${uuidv4()}.${fileExt === 'jpeg' ? 'jpg' : fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      fotoPath = `/api/uploads/${fileName}`;
    }

    // Save to database (calendar date → UTC midnight, no local offset shift)
    const record = await prisma.hMRecord.create({
      data: {
        tanggal: parseDateOnly(tanggal),
        totalHM,
        fotoPath: fotoPath || '',
        employeeId: employeeId || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating record:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create record', details: errorMessage },
      { status: 500 }
    );
  }
}
