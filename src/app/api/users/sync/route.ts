import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, displayName, pictureUrl } = body;

    if (!userId || !displayName) {
      return NextResponse.json({ error: 'Missing userId or displayName' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { lineId: userId },
      update: {
        name: displayName,
        pictureUrl: pictureUrl || null,
      },
      create: {
        lineId: userId,
        name: displayName,
        pictureUrl: pictureUrl || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error('Error in user sync API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
