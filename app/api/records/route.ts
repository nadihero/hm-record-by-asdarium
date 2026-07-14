import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDateOnly, parseDateOnly } from '@/lib/utils';
import { resolveFotoUrl, uploadTimesheetImage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const employeeId = searchParams.get('employeeId');
    const all = searchParams.get('all');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (start && end) {
      whereClause.tanggal = {
        gte: parseDateOnly(start),
        lte: endOfDateOnly(end),
      };
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = parseDateOnly(`${year}-${String(monthNum).padStart(2, '0')}-01`);
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

    // Normalize fotoPath → public R2 URL (legacy /api/uploads/... still works)
    const normalized = records.map((r) => ({
      ...r,
      fotoPath: resolveFotoUrl(r.fotoPath) || r.fotoPath,
    }));
    return NextResponse.json(normalized);
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

    let fotoPath = '';

    if (file && file.size > 0) {
      try {
        fotoPath = await uploadTimesheetImage(file);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'FILE_TOO_LARGE') {
          return NextResponse.json(
            { error: 'Ukuran gambar maksimal 5 MB. Kompres dulu sebelum upload.' },
            { status: 413 }
          );
        }
        if (msg === 'INVALID_FILE_TYPE') {
          return NextResponse.json(
            { error: 'File harus berupa gambar' },
            { status: 400 }
          );
        }
        if (msg.startsWith('R2_NOT_CONFIGURED')) {
          return NextResponse.json(
            { error: 'Storage R2 belum dikonfigurasi. Periksa env R2_*.' },
            { status: 503 }
          );
        }
        console.error('Upload error:', e);
        return NextResponse.json(
          { error: 'Gagal mengunggah gambar ke R2' },
          { status: 500 }
        );
      }
    }

    const record = await prisma.hMRecord.create({
      data: {
        tanggal: parseDateOnly(tanggal),
        totalHM,
        fotoPath,
        employeeId: employeeId || null,
      },
    });

    return NextResponse.json(
      { ...record, fotoPath: resolveFotoUrl(record.fotoPath) || record.fotoPath },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating record:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create record', details: errorMessage },
      { status: 500 }
    );
  }
}
