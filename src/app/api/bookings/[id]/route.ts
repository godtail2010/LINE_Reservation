import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLineMessage } from '@/lib/line';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body; // PENDING, CONFIRMED, CANCELLED

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        service: true,
        staff: true,
      },
    });

    // Send notification for cancellation
    if (status === 'CANCELLED' && booking.user.lineId) {
      const bookingDate = new Date(booking.dateTime);
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

      const messageText = 
`【mia mio】
予約キャンセルのお知らせ。

以下のお客様のご予約がキャンセルされました。

■日時: ${formattedDate} ${formattedTime}～
■メニュー: ${booking.service.name}

またのご予約を心よりお待ちしております。`;

      await sendLineMessage(booking.user.lineId, messageText);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
