import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveFotoUrl } from '@/lib/foto-url';

const ADMIN_PIN = '70280';

interface AuthUser {
  id: string;
  nama: string;
  role: 'admin' | 'employee';
  fotoProfil?: string | null;
}

async function validatePin(pin: string): Promise<AuthUser | null> {
  // Check if admin PIN
  if (pin === ADMIN_PIN) {
    return {
      id: 'admin',
      nama: 'Administrator',
      role: 'admin',
      fotoProfil: null,
    };
  }

  // Check employee PIN
  const employee = await prisma.employee.findFirst({
    where: { pin },
  });

  if (employee) {
    return {
      id: employee.id,
      nama: employee.nama,
      role: 'employee',
      fotoProfil: resolveFotoUrl(employee.fotoProfil) || null,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    const user = await validatePin(pin);

    if (!user) {
      return NextResponse.json(
        { error: 'PIN tidak valid' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
