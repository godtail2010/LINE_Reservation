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
  } catch (error: unknown) {
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

    // 2. Resolve booking time and day of week
    const bookingDate = new Date(dateTime);
    
    // Get JST day of week
    const jstDateStr = bookingDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const [year, month, day] = jstDateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = utcDate.getUTCDay().toString(); // "0" (Sun) to "6" (Sat)

    // Fetch active staff
    const activeStaff = await prisma.staff.findMany({
      where: { isActive: true },
    });

    let assignedStaffId = staffId || null;

    if (assignedStaffId) {
      // Specific staff selected
      const targetStaff = activeStaff.find((st) => st.id === assignedStaffId);
      if (!targetStaff) {
        return NextResponse.json({ error: 'スタイリストが見つかりません。' }, { status: 404 });
      }

      // Check if target stylist is working on this day of the week
      if (!targetStaff.workingDays.split(',').includes(dayOfWeek)) {
        return NextResponse.json(
          { error: `${targetStaff.name}は選択された曜日は出勤日ではありません。` },
          { status: 400 }
        );
      }

      // Double booking check (same staff at the same time)
      const conflict = await prisma.booking.findFirst({
        where: {
          staffId: assignedStaffId,
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
    } else {
      // "No preference" (指名なし)
      // Find active staff working on this day of the week
      const workingStaff = activeStaff.filter((st) =>
        st.workingDays.split(',').includes(dayOfWeek)
      );

      if (workingStaff.length === 0) {
        return NextResponse.json(
          { error: '指定された日付は出勤しているスタイリストがおりません。' },
          { status: 400 }
        );
      }

      // Find all confirmed bookings at this specific dateTime for these working staff members
      const existingBookings = await prisma.booking.findMany({
        where: {
          staffId: {
            in: workingStaff.map((st) => st.id),
          },
          dateTime: bookingDate,
          status: 'CONFIRMED',
        },
        select: {
          staffId: true,
        },
      });

      const bookedStaffIds = new Set(existingBookings.map((b) => b.staffId));

      // Find the first working staff member who is free
      const freeStaff = workingStaff.find((st) => !bookedStaffIds.has(st.id));

      if (!freeStaff) {
        return NextResponse.json(
          { error: '指定された日時はすでにすべてのスタイリストが予約で埋まっています。' },
          { status: 409 }
        );
      }

      assignedStaffId = freeStaff.id;
    }

    // 4. Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        serviceId,
        staffId: assignedStaffId,
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
`【mia mio】
ご予約が確定しました！✨

■日時: ${formattedDate} ${formattedTime}～
■メニュー: ${booking.service.name}
■料金: ￥${booking.service.price.toLocaleString()}
■担当スタイリスト: ${stylistName}

ご来店を心よりお待ちしております。
※ご予約のキャンセルや日時変更がある場合は、前日までにお願いいたします。`;

    await sendLineMessage(lineUserId, messageText);

    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
