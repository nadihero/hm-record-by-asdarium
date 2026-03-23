import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const employeeId = searchParams.get('employeeId');
    const all = searchParams.get('all');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      whereClause.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const absensi = all
      ? await prisma.absensiRecord.findMany({
          where: whereClause,
          orderBy: { tanggal: 'desc' },
          include: { employee: { select: { id: true, nama: true } } },
        })
      : await prisma.absensiRecord.findMany({
          where: whereClause,
          orderBy: { tanggal: 'desc' },
        });

    return NextResponse.json(absensi);
  } catch (error) {
    console.error('Error fetching absensi:', error);
    return NextResponse.json(
      { error: 'Failed to fetch absensi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, tanggal, jamMasuk, jamPulang, status, keterangan } = body;

    if (!employeeId || !tanggal || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatus = ['hadir', 'alpa', 'sakit', 'cuti'];
    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // For 'hadir' status, jam masuk and pulang are required
    if (status === 'hadir' && (!jamMasuk || !jamPulang)) {
      return NextResponse.json(
        { error: 'Jam masuk dan pulang wajib diisi untuk status hadir' },
        { status: 400 }
      );
    }

    // For 'sakit' and 'cuti', keterangan is required
    if ((status === 'sakit' || status === 'cuti') && !keterangan) {
      return NextResponse.json(
        { error: 'Keterangan wajib diisi untuk status sakit/cuti' },
        { status: 400 }
      );
    }

    // Check for duplicate entry
    const existing = await prisma.absensiRecord.findFirst({
      where: {
        employeeId,
        tanggal: new Date(tanggal),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Absensi untuk tanggal ini sudah ada' },
        { status: 409 }
      );
    }

    const absensi = await prisma.absensiRecord.create({
      data: {
        employeeId,
        tanggal: new Date(tanggal),
        jamMasuk: status === 'hadir' ? jamMasuk : null,
        jamPulang: status === 'hadir' ? jamPulang : null,
        status,
        keterangan: keterangan || null,
      },
    });

    return NextResponse.json(absensi, { status: 201 });
  } catch (error) {
    console.error('Error creating absensi:', error);
    return NextResponse.json(
      { error: 'Failed to create absensi' },
      { status: 500 }
    );
  }
}
