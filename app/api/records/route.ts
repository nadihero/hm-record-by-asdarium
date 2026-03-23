import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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

    // Date range filters
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      whereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
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

    let fotoPath: string | null = null;

    // Only process file if provided
    if (file && file.size > 0) {
      // Create uploads directory if not exists (outside public folder)
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Save file
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      fotoPath = `/api/uploads/${fileName}`;
    }

    // Save to database
    const record = await prisma.hMRecord.create({
      data: {
        tanggal: new Date(tanggal),
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
