import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLineMessage } from '@/lib/line';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');

    let bookings;

    if (lineUserId) {
      // Find the internal user first
      const user = await prisma.user.findUnique({
        where: { lineId: lineUserId },
      });

      if (!user) {
        return NextResponse.json({ success: true, bookings: [] });
      }

      // Fetch bookings for this user
      bookings = await prisma.booking.findMany({
        where: { userId: user.id },
        include: {
          service: true,
          staff: true,
        },
        orderBy: { dateTime: 'asc' },
      });
    } else {
      // Admin request: get all bookings
      bookings = await prisma.booking.findMany({
        include: {
          user: true,
          service: true,
          staff: true,
        },
        orderBy: { dateTime: 'desc' },
      });
    }

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lineUserId, serviceId, staffId, dateTime, notes } = body;

    if (!lineUserId || !serviceId || !dateTime) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Find the user by LINE User ID
    const user = await prisma.user.findUnique({
      where: { lineId: lineUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Resolve booking time
    const bookingDate = new Date(dateTime);

    // 3. Double booking check (same staff at the same time)
    if (staffId) {
      const conflict = await prisma.booking.findFirst({
        where: {
          staffId,
          dateTime: bookingDate,
          status: 'CONFIRMED',
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: '指定された日時はすでに他の予約が入っています。' },
          { status: 409 }
        );
      }
    }

    // 4. Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        serviceId,
        staffId: staffId || null,
        dateTime: bookingDate,
        status: 'CONFIRMED',
        notes: notes || null,
      },
      include: {
        service: true,
        staff: true,
      },
    });

    // 5. Send LINE Bot Push Notification
    const formattedDate = bookingDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    
    const formattedTime = bookingDate.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const stylistName = booking.staff ? booking.staff.name : '指名なし';

    const messageText = 
`【AURA Hair Salon】
ご予約が確定しました！✨

■日時: ${formattedDate} ${formattedTime}～
■メニュー: ${booking.service.name}
■料金: ￥${booking.service.price.toLocaleString()}
■担当スタイリスト: ${stylistName}

ご来店を心よりお待ちしております。
※ご予約のキャンセルや日時変更がある場合は、前日までにお願いいたします。`;

    await sendLineMessage(lineUserId, messageText);

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
