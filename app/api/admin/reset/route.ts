import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readdir, unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ADMIN_PIN = '70280';

export async function DELETE(request: NextRequest) {
  try {
    const { pin } = await request.json();

    // Validate admin PIN
    if (pin !== ADMIN_PIN) {
      return NextResponse.json(
        { error: 'PIN admin tidak valid' },
        { status: 401 }
      );
    }

    // Delete all records from database
    await prisma.hMRecord.deleteMany({});
    await prisma.employee.deleteMany({});

    // Delete all files in uploads folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (existsSync(uploadsDir)) {
      try {
        const files = await readdir(uploadsDir);
        for (const file of files) {
          const filePath = path.join(uploadsDir, file);
          await unlink(filePath);
        }
      } catch (err) {
        console.error('Error deleting upload files:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database berhasil direset',
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset database' },
      { status: 500 }
    );
  }
}
