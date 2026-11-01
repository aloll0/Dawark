import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { PatientTicket } from '@/models';
import { calculateWaitTime } from '@/lib/queue-service';
import { broadcastQueueUpdate, broadcastTicketUpdate } from '@/lib/socket-emitter';

interface Params {
  params: Promise<{ clinicId: string; ticketId: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { clinicId, ticketId } = await params;
    if (!mongoose.isValidObjectId(clinicId) || !mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID parameters' }, { status: 400 });
    }

    await connectToDatabase();
    const ticket = await PatientTicket.findOne({
      _id: ticketId,
      clinicId,
    })
      .populate('doctorId', 'name specialization avgSessionTime')
      .populate('clinicId', 'name phone whatsappSupport')
      .lean();

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    const docId = (ticket.doctorId as unknown as { _id: string })?._id?.toString() || ticket.doctorId.toString();

    // Dynamic wait time recalculation
    const { patientsAhead, estimatedWaitTime, avgSessionTime } = await calculateWaitTime(
      clinicId,
      docId,
      ticket.queueNumber
    );

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        estimatedWaitTime,
        patientsAhead,
        avgSessionTime,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to get ticket:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clinicId, ticketId } = await params;
    if (!mongoose.isValidObjectId(clinicId) || !mongoose.isValidObjectId(ticketId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID parameters' }, { status: 400 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { status } = body;

    if (!['waiting', 'in-session', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status must be waiting, in-session, or completed' },
        { status: 400 }
      );
    }

    const updatedTicket = await PatientTicket.findOneAndUpdate(
      {
        _id: ticketId,
        clinicId,
      },
      { $set: { status } },
      { returnDocument: 'after' }
    )
      .populate('doctorId', 'name specialization avgSessionTime')
      .lean();

    if (!updatedTicket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    const docId =
      (updatedTicket.doctorId as unknown as { _id: string })?._id?.toString() ||
      updatedTicket.doctorId.toString();

    // Dynamic wait time info
    const { patientsAhead, estimatedWaitTime } = await calculateWaitTime(
      clinicId,
      docId,
      updatedTicket.queueNumber
    );

    const payload = {
      action: 'ticket_status_updated',
      ticket: {
        ...updatedTicket,
        patientsAhead,
        estimatedWaitTime,
      },
      status,
      ticketId,
      clinicId,
    };

    // Instant Socket.io broadcast to clinic dashboard and patient device
    broadcastQueueUpdate(clinicId, 'queue_updated', payload);
    broadcastTicketUpdate(ticketId, 'ticket_status_changed', payload);

    return NextResponse.json({ success: true, ticket: payload.ticket });
  } catch (error: unknown) {
    console.error('Failed to update ticket status:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
