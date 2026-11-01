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
    const doctors = await Doctor.find({ clinicId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, doctors });
  } catch (error: unknown) {
    console.error('Failed to get doctors:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clinicId } = await params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return NextResponse.json({ success: false, message: 'Invalid clinic ID' }, { status: 400 });
    }

    await connectToDatabase();
    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
      return NextResponse.json({ success: false, message: 'Clinic not found' }, { status: 404 });
    }

    // STRICT CHECK: Block adding more than maxDoctors unless subscription is upgraded
    const currentDoctorCount = await Doctor.countDocuments({ clinicId });

    if (currentDoctorCount >= clinic.maxDoctors) {
      return NextResponse.json(
        {
          success: false,
          code: 'DOCTOR_LIMIT_EXCEEDED',
          message: `Cannot add more than ${clinic.maxDoctors} doctors. Please upgrade your clinic subscription plan to increase doctor capacity.`,
          currentCount: currentDoctorCount,
          maxDoctors: clinic.maxDoctors,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, specialization, avgSessionTime } = body;

    if (!name || !specialization) {
      return NextResponse.json(
        { success: false, message: 'Doctor name and specialization are required' },
        { status: 400 }
      );
    }

    const doctor = await Doctor.create({
      clinicId,
      name,
      specialization,
      avgSessionTime: avgSessionTime ? Number(avgSessionTime) : 15,
    });

    return NextResponse.json(
      {
        success: true,
        doctor,
        currentDoctorCount: currentDoctorCount + 1,
        maxDoctors: clinic.maxDoctors,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Failed to add doctor:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
