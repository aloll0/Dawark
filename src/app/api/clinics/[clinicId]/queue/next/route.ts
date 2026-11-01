import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { PatientTicket } from '@/models';
import { broadcastQueueUpdate, broadcastTicketUpdate } from '@/lib/socket-emitter';

interface Params {
  params: Promise<{ clinicId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clinicId } = await params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return NextResponse.json({ success: false, message: 'Invalid clinic ID' }, { status: 400 });
    }

    const body = await req.json();
    const { doctorId } = body;

    if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
      return NextResponse.json({ success: false, message: 'Valid doctor ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Mark any currently in-session patient as 'completed'
    const completedTicket = await PatientTicket.findOneAndUpdate(
      {
        clinicId,
        doctorId,
        status: 'in-session',
      },
      { $set: { status: 'completed' } },
      { returnDocument: 'after' }
    ).lean();

    if (completedTicket) {
      broadcastTicketUpdate(completedTicket._id.toString(), 'ticket_status_changed', {
        action: 'completed',
        ticketId: completedTicket._id.toString(),
        status: 'completed',
      });
    }

    // 2. Find next waiting patient and mark them 'in-session'
    const nextTicket = await PatientTicket.findOneAndUpdate(
      {
        clinicId,
        doctorId,
        status: 'waiting',
      },
      { $set: { status: 'in-session' } },
      { sort: { queueNumber: 1 }, returnDocument: 'after' }
    )
      .populate('doctorId', 'name specialization avgSessionTime')
      .lean();

    const payload = {
      action: 'next_patient_called',
      clinicId,
      doctorId,
      completedTicketId: completedTicket?._id,
      calledTicket: nextTicket,
    };

    // Broadcast instant sync across clinic and tickets
    broadcastQueueUpdate(clinicId, 'queue_updated', payload);
    if (nextTicket) {
      broadcastTicketUpdate(nextTicket._id.toString(), 'patient_called', {
        action: 'called',
        ticketId: nextTicket._id.toString(),
        status: 'in-session',
      });
    }

    return NextResponse.json({
      success: true,
      completedTicket,
      calledTicket: nextTicket,
      hasMoreWaiting: Boolean(nextTicket),
    });
  } catch (error: unknown) {
    console.error('Failed to advance queue:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
