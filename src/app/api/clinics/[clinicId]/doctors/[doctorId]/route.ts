import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Doctor } from '@/models';

interface Params {
  params: Promise<{ clinicId: string; doctorId: string }>;
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { clinicId, doctorId } = await params;
    if (!mongoose.isValidObjectId(clinicId) || !mongoose.isValidObjectId(doctorId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID parameters' }, { status: 400 });
    }

    await connectToDatabase();
    const deleted = await Doctor.findOneAndDelete({
      _id: doctorId,
      clinicId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Doctor removed successfully' });
  } catch (error: unknown) {
    console.error('Failed to remove doctor:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
