import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return NextResponse.json({ success: true, services });
  } catch (error: unknown) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, duration, description } = body;

    if (!name || !price || !duration) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        name,
        price: parseInt(price),
        duration: parseInt(duration),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error: unknown) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
