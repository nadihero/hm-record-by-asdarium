import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { jamMasuk, jamPulang, status, shift, keterangan } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatus = ['hadir', 'izin', 'alpa', 'sakit', 'off'];
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

    // For 'sakit' and 'izin', keterangan is required
    if ((status === 'sakit' || status === 'izin') && !keterangan) {
      return NextResponse.json(
        { error: 'Keterangan wajib diisi untuk status sakit/izin' },
        { status: 400 }
      );
    }

    const absensi = await prisma.absensiRecord.update({
      where: { id },
      data: {
        jamMasuk: status === 'hadir' ? jamMasuk : null,
        jamPulang: status === 'hadir' ? jamPulang : null,
        status,
        shift: status === 'hadir' ? (shift || null) : null,
        keterangan: keterangan || null,
      },
    });

    return NextResponse.json(absensi);
  } catch (error) {
    console.error('Error updating absensi:', error);
    return NextResponse.json(
      { error: 'Failed to update absensi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.absensiRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting absensi:', error);
    return NextResponse.json(
      { error: 'Failed to delete absensi' },
      { status: 500 }
    );
  }
}
