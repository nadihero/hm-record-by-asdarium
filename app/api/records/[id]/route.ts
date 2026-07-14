import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseDateOnly } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

async function deleteFotoFile(fotoPath: string | null | undefined) {
  if (!fotoPath) return;
  try {
    const fileName = path.basename(fotoPath);
    const candidates = [
      path.join(process.cwd(), 'uploads', fileName),
      path.join(process.cwd(), 'public', 'uploads', fileName),
    ];
    for (const filePath of candidates) {
      try {
        await unlink(filePath);
        break;
      } catch {
        // try next location
      }
    }
  } catch (fileError) {
    console.error('Error deleting file:', fileError);
  }
}

async function saveUploadedFile(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  if (file.type && !file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
    throw new Error('INVALID_FILE_TYPE');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const fileName = `${uuidv4()}.${fileExt === 'jpeg' ? 'jpg' : fileExt}`;
  const filePath = path.join(uploadsDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/api/uploads/${fileName}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.hMRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.hMRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let tanggal: string | undefined;
    let totalHM: number | undefined;
    let file: File | null = null;
    let removeFoto = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const tanggalRaw = formData.get('tanggal');
      const totalHMRaw = formData.get('totalHM');
      const removeFotoRaw = formData.get('removeFoto');
      const fileRaw = formData.get('file');

      if (typeof tanggalRaw === 'string' && tanggalRaw) tanggal = tanggalRaw;
      if (typeof totalHMRaw === 'string' && totalHMRaw !== '') {
        totalHM = parseFloat(totalHMRaw);
      }
      removeFoto = removeFotoRaw === 'true' || removeFotoRaw === '1';
      if (fileRaw instanceof File && fileRaw.size > 0) {
        file = fileRaw;
      }
    } else {
      const body = await request.json();
      tanggal = body.tanggal;
      totalHM = body.totalHM !== undefined ? Number(body.totalHM) : undefined;
      removeFoto = Boolean(body.removeFoto);
    }

    if (totalHM !== undefined && Number.isNaN(totalHM)) {
      return NextResponse.json({ error: 'Invalid totalHM' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (tanggal) data.tanggal = parseDateOnly(tanggal);
    if (totalHM !== undefined) data.totalHM = totalHM;

    if (file) {
      try {
        const newPath = await saveUploadedFile(file);
        await deleteFotoFile(existing.fotoPath);
        data.fotoPath = newPath;
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
        throw e;
      }
    } else if (removeFoto) {
      await deleteFotoFile(existing.fotoPath);
      data.fotoPath = '';
    }

    const record = await prisma.hMRecord.update({
      where: { id },
      data,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
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

    const record = await prisma.hMRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    await deleteFotoFile(record.fotoPath);

    await prisma.hMRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
