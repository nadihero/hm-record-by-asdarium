import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Update all records with old path format to new API path format
    const result = await prisma.$executeRaw`
      UPDATE hm_records 
      SET fotoPath = REPLACE(fotoPath, '/uploads/', '/api/uploads/')
      WHERE fotoPath LIKE '/uploads/%' AND fotoPath NOT LIKE '/api/uploads/%'
    `;

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${result} records to use API path` 
    });
  } catch (error) {
    console.error('Error migrating paths:', error);
    return NextResponse.json(
      { error: 'Failed to migrate paths' },
      { status: 500 }
    );
  }
}
