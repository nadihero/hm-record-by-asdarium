import { NextRequest, NextResponse } from 'next/server';
import { getTimesheetImage } from '@/lib/storage';

/**
 * Stream timesheet images from private R2 via authenticated S3 GetObject.
 * Used for all previews (report, admin, edit) — no public r2.dev required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const key = (segments || []).join('/');

    if (!key || key.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const image = await getTimesheetImage(key);
    if (!image) {
      return NextResponse.json({ error: 'File not found on R2' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.body), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error serving file from R2:', error);
    return NextResponse.json(
      { error: 'Failed to serve file from R2' },
      { status: 500 }
    );
  }
}
