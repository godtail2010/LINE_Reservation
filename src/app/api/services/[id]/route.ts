import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
