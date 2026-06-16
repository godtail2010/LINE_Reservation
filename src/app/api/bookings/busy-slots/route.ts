import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // Format: YYYY-MM-DD
    const staffId = searchParams.get('staffId'); // Optional

    if (!dateStr) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    // Find all confirmed bookings for that day and optionally for that staff member
    const bookings = await prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'CONFIRMED',
        ...(staffId ? { staffId } : {}),
      },
      select: {
        dateTime: true,
      },
    });

    // Extract hours/minutes as string array like ["10:00", "13:00"]
    const busySlots = bookings.map((b) => {
      const hours = b.dateTime.getHours().toString().padStart(2, '0');
      const minutes = b.dateTime.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    });

    return NextResponse.json({ success: true, busySlots });
  } catch (error: any) {
    console.error('Error fetching busy slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
