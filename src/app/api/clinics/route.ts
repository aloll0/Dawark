import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Clinic } from '@/models';

export async function GET() {
  try {
    await connectToDatabase();
    const clinics = await Clinic.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, clinics });
  } catch (error: unknown) {
    console.error('Failed to fetch clinics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch clinics' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, phone, whatsappSupport, maxDoctors, basePrice, subscriptionStatus } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'Clinic name and phone are required' },
        { status: 400 }
      );
    }

    const clinic = await Clinic.create({
      name,
      phone,
      whatsappSupport: whatsappSupport || '+201010428244',
      maxDoctors: maxDoctors ? Number(maxDoctors) : 3,
      basePrice: basePrice ? Number(basePrice) : 2000,
      subscriptionStatus: subscriptionStatus || 'pending',
    });

    return NextResponse.json({ success: true, clinic }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create clinic:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create clinic' },
      { status: 500 }
    );
  }
}
