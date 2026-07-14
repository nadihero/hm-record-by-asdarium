import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteAllTimesheetImages } from '@/lib/storage';

const ADMIN_PIN = '70280';

export async function DELETE(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (pin !== ADMIN_PIN) {
      return NextResponse.json(
        { error: 'PIN admin tidak valid' },
        { status: 401 }
      );
    }

    await prisma.hMRecord.deleteMany({});
    await prisma.employee.deleteMany({});

    // Wipe timesheet objects on R2 (not local disk)
    let r2Deleted = 0;
    try {
      r2Deleted = await deleteAllTimesheetImages();
    } catch (err) {
      console.error('R2 cleanup during reset:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Database berhasil direset',
      r2ObjectsDeleted: r2Deleted,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset database' },
      { status: 500 }
    );
  }
}
