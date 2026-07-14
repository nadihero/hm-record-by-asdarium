import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDateOnly } from '@/lib/utils';
import {
  deleteTimesheetImage,
  resolveFotoUrl,
  uploadTimesheetImage,
} from '@/lib/storage';

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

    return NextResponse.json({
      ...record,
      fotoPath: resolveFotoUrl(record.fotoPath) || record.fotoPath,
    });
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
        const newPath = await uploadTimesheetImage(file);
        await deleteTimesheetImage(existing.fotoPath);
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
    } else if (removeFoto) {
      await deleteTimesheetImage(existing.fotoPath);
      data.fotoPath = '';
    }

    const record = await prisma.hMRecord.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...record,
      fotoPath: resolveFotoUrl(record.fotoPath) || record.fotoPath,
    });
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

    await deleteTimesheetImage(record.fotoPath);

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
