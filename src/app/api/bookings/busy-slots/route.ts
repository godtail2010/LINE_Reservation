import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to convert Date to JST HH:mm string
function getJstTimeStr(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // Format: YYYY-MM-DD
    const staffId = searchParams.get('staffId'); // Optional

    if (!dateStr) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    // Parse YYYY-MM-DD as JST day range
    // startOfDay: dateStr 00:00:00 JST
    // endOfDay: dateStr 23:59:59 JST
    const startOfDay = new Date(`${dateStr}T00:00:00+09:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59+09:00`);

    // Determine the day of the week (JST)
    const [year, month, day] = dateStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = utcDate.getUTCDay().toString(); // "0" (Sun) to "6" (Sat)

    // Fetch active staff
    const activeStaff = await prisma.staff.findMany({
      where: { isActive: true },
    });

    // Filter staff who work on this day of the week
    const workingStaff = activeStaff.filter((st) =>
      st.workingDays.split(',').includes(dayOfWeek)
    );

    let busySlots: string[] = [];

    if (staffId) {
      // Find the specific staff member
      const targetStaff = activeStaff.find((st) => st.id === staffId);
      if (!targetStaff || !targetStaff.workingDays.split(',').includes(dayOfWeek)) {
        // If staff doesn't exist or is not working today, all slots are busy
        return NextResponse.json({
          success: true,
          busySlots: [
            '10:00', '11:00', '12:00', '13:00', '14:00',
            '15:00', '16:00', '17:00', '18:00', '19:00'
          ],
        });
      }

      // Fetch bookings for this staff on this day
      const bookings = await prisma.booking.findMany({
        where: {
          staffId,
          dateTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'CONFIRMED',
        },
        select: {
          dateTime: true,
        },
      });

      busySlots = bookings.map((b) => getJstTimeStr(b.dateTime));
    } else {
      // No preference (指名なし):
      // If no staff is working today, all slots are busy
      if (workingStaff.length === 0) {
        return NextResponse.json({
          success: true,
          busySlots: [
            '10:00', '11:00', '12:00', '13:00', '14:00',
            '15:00', '16:00', '17:00', '18:00', '19:00'
          ],
        });
      }

      // Fetch confirmed bookings for all working staff on this day
      const bookings = await prisma.booking.findMany({
        where: {
          staffId: {
            in: workingStaff.map((st) => st.id),
          },
          dateTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'CONFIRMED',
        },
        select: {
          dateTime: true,
          staffId: true,
        },
      });

      // Group bookings by JST time string to see which staff are booked at each slot
      const timeSlotBookedStaff: Record<string, Set<string>> = {};
      bookings.forEach((b) => {
        if (!b.staffId) return;
        const timeStr = getJstTimeStr(b.dateTime);
        if (!timeSlotBookedStaff[timeStr]) {
          timeSlotBookedStaff[timeStr] = new Set<string>();
        }
        timeSlotBookedStaff[timeStr].add(b.staffId);
      });

      // A slot is busy ONLY if all working staff members are booked at that slot
      Object.entries(timeSlotBookedStaff).forEach(([timeStr, bookedStaffIds]) => {
        if (bookedStaffIds.size >= workingStaff.length) {
          busySlots.push(timeStr);
        }
      });
    }

    return NextResponse.json({ success: true, busySlots });
  } catch (error: any) {
    console.error('Error fetching busy slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
