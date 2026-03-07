import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nama, pin } = await request.json();

    if (!nama || !pin) {
      return NextResponse.json(
        { error: 'Nama dan PIN wajib diisi' },
        { status: 400 }
      );
    }

    if (pin.length !== 5 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN harus 5 digit angka' },
        { status: 400 }
      );
    }

    // Check if PIN already exists
    const existing = await prisma.employee.findFirst({
      where: { pin },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'PIN sudah digunakan' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: { nama, pin },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
