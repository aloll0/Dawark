import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Clinic, Doctor } from '@/models';

interface Params {
  params: Promise<{ clinicId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { clinicId } = await params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return NextResponse.json({ success: false, message: 'Invalid clinic ID' }, { status: 400 });
    }

    await connectToDatabase();
    const clinic = await Clinic.findById(clinicId).lean();

    if (!clinic) {
      return NextResponse.json({ success: false, message: 'Clinic not found' }, { status: 404 });
    }

    const doctorCount = await Doctor.countDocuments({ clinicId });

    return NextResponse.json({
      success: true,
      clinic: {
        ...clinic,
        currentDoctorCount: doctorCount,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to get clinic:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clinicId } = await params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return NextResponse.json({ success: false, message: 'Invalid clinic ID' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { subscriptionStatus, maxDoctors, basePrice, name, phone, whatsappSupport } = body;

    const updateFields: Record<string, unknown> = {};
    if (subscriptionStatus) updateFields.subscriptionStatus = subscriptionStatus;
    if (maxDoctors !== undefined) updateFields.maxDoctors = Number(maxDoctors);
    if (basePrice !== undefined) updateFields.basePrice = Number(basePrice);
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (whatsappSupport) updateFields.whatsappSupport = whatsappSupport;

    const clinic = await Clinic.findByIdAndUpdate(
      clinicId,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!clinic) {
      return NextResponse.json({ success: false, message: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, clinic });
  } catch (error: unknown) {
    console.error('Failed to update clinic:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
