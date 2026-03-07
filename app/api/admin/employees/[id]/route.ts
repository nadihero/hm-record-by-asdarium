import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        records: {
          orderBy: { tanggal: 'desc' },
          take: 10,
        },
        _count: {
          select: { records: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
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
    const { nama, pin } = await request.json();

    if (!nama) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      );
    }

    // If PIN is being changed, validate it
    if (pin) {
      if (pin.length !== 5 || !/^\d+$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN harus 5 digit angka' },
          { status: 400 }
        );
      }

      // Check if PIN already used by another employee
      const existing = await prisma.employee.findFirst({
        where: {
          pin,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'PIN sudah digunakan' },
          { status: 400 }
        );
      }
    }

    const updateData: { nama: string; pin?: string } = { nama };
    if (pin) updateData.pin = pin;

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
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

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
