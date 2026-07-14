import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  deleteProfileImage,
  resolveFotoUrl,
  uploadProfileImage,
} from '@/lib/storage';

/**
 * GET /api/profile?employeeId=...
 * Return employee profile (including fotoProfil URL).
 */
export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get('employeeId');
    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, nama: true, fotoProfil: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      ...employee,
      fotoProfil: resolveFotoUrl(employee.fotoProfil) || null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * POST /api/profile — multipart: employeeId + file
 * Upload profile photo to R2 and save path on employee.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const employeeId = formData.get('employeeId');
    const fileRaw = formData.get('file');

    if (typeof employeeId !== 'string' || !employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
    }

    if (!(fileRaw instanceof File) || fileRaw.size === 0) {
      return NextResponse.json({ error: 'File foto wajib' }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, nama: true, fotoProfil: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    let fotoPath: string;
    try {
      fotoPath = await uploadProfileImage(fileRaw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'FILE_TOO_LARGE') {
        return NextResponse.json(
          { error: 'Ukuran foto profil maksimal 5 MB' },
          { status: 413 }
        );
      }
      if (msg === 'INVALID_FILE_TYPE') {
        return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 });
      }
      if (msg.startsWith('R2_NOT_CONFIGURED')) {
        return NextResponse.json(
          { error: 'Storage R2 belum dikonfigurasi' },
          { status: 503 }
        );
      }
      console.error('Profile upload error:', e);
      return NextResponse.json({ error: 'Gagal upload foto ke R2' }, { status: 500 });
    }

    // Remove previous profile object from R2
    if (existing.fotoProfil) {
      await deleteProfileImage(existing.fotoProfil);
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { fotoProfil: fotoPath },
      select: { id: true, nama: true, fotoProfil: true },
    });

    return NextResponse.json({
      ...updated,
      fotoProfil: resolveFotoUrl(updated.fotoProfil) || null,
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
