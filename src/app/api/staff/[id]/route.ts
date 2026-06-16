import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const staffMember = await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, staffMember });
  } catch (error: unknown) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
