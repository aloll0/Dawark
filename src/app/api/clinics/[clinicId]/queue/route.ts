import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { PatientTicket, Doctor, Clinic } from '@/models';
import { generateNextQueueNumber, calculateWaitTime } from '@/lib/queue-service';
import { broadcastQueueUpdate } from '@/lib/socket-emitter';

interface Params {
  params: Promise<{ clinicId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { clinicId } = await params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return NextResponse.json({ success: false, message: 'Invalid clinic ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    await connectToDatabase();

    const query: Record<string, unknown> = {
      clinicId,
    };

    if (doctorId && mongoose.isValidObjectId(doctorId)) {
      query.doctorId = doctorId;
    }

    if (status) {
      query.status = status;
    }

    const tickets = await PatientTicket.find(query)
      .sort({ queueNumber: 1 })
      .populate('doctorId', 'name specialization avgSessionTime')
      .lean();

    return NextResponse.json({ success: true, tickets });
  } catch (error: unknown) {
    console.error('Failed to get queue tickets:', error);
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

    // Check clinic subscription status
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return NextResponse.json({ success: false, message: 'Clinic not found' }, { status: 404 });
    }

    if (clinic.subscriptionStatus !== 'active') {
      return NextResponse.json(
        {
          success: false,
          code: 'SUBSCRIPTION_INACTIVE',
          message: 'Clinic queue registration is currently suspended or pending activation.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { doctorId, patientName, patientPhone, age, gender } = body;

    if (!doctorId || !patientName || !patientPhone || age === undefined || !gender) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required fields (doctor, name, phone, age, gender)' },
        { status: 400 }
      );
    }

    if (!['Male', 'Female'].includes(gender)) {
      return NextResponse.json({ success: false, message: 'Gender must be Male or Female' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      clinicId,
    });

    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Selected doctor not found in this clinic' }, { status: 404 });
    }

    // ZERO RACE CONDITION: Atomic $inc on QueueCounter
    const queueNumber = await generateNextQueueNumber(clinicId, doctorId);

    // Dynamic estimated wait time calculation
    const { estimatedWaitTime, patientsAhead } = await calculateWaitTime(clinicId, doctorId, queueNumber);

    const ticket = await PatientTicket.create({
      clinicId,
      doctorId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      age: Number(age),
      gender,
      queueNumber,
      status: 'waiting',
      estimatedWaitTime,
    });

    const populatedTicket = await PatientTicket.findById(ticket._id)
      .populate('doctorId', 'name specialization avgSessionTime')
      .lean();

    // Real-time broadcast to clinic room
    broadcastQueueUpdate(clinicId, 'queue_updated', {
      action: 'ticket_created',
      ticket: populatedTicket,
      clinicId,
      doctorId,
    });

    return NextResponse.json(
      {
        success: true,
        ticket: populatedTicket,
        patientsAhead,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
