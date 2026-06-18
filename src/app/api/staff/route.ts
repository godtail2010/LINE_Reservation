import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
    });
    return NextResponse.json(
      { success: true, staff },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, avatarUrl, workingDays } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const staffMember = await prisma.staff.create({
      data: {
        name,
        role,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
        workingDays: workingDays || '1,2,3,4,5', // Default Mon-Fri
      },
    });

    return NextResponse.json(
      { success: true, staffMember },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating staff member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
