import mongoose from 'mongoose';
import connectToDatabase from './mongodb';
import { QueueCounter, PatientTicket, Doctor } from '@/models';

/**
 * Returns today's date key in YYYY-MM-DD format for daily ticket sequences
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Zero Race Condition: Generates sequential queue number using atomic $inc
 */
export async function generateNextQueueNumber(
  clinicId: string,
  doctorId: string
): Promise<number> {
  await connectToDatabase();
  const dateKey = getTodayDateKey();

  const counter = await QueueCounter.findOneAndUpdate(
    {
      clinicId,
      doctorId,
      dateKey,
    },
    { $inc: { lastQueueNumber: 1 } },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return counter?.lastQueueNumber || 1;
}

/**
 * Calculates dynamic estimated wait time in minutes
 * based on count of patients ahead * doctor's avgSessionTime
 */
export async function calculateWaitTime(
  clinicId: string,
  doctorId: string,
  patientQueueNumber: number
): Promise<{ patientsAhead: number; estimatedWaitTime: number; avgSessionTime: number }> {
  await connectToDatabase();

  const doctor = await Doctor.findById(doctorId).select('avgSessionTime').lean();
  const avgSessionTime = doctor?.avgSessionTime || 15;

  // Count active patients ahead (waiting or in-session with lower queueNumber)
  const patientsAheadCount = await PatientTicket.countDocuments({
    clinicId,
    doctorId,
    status: { $in: ['waiting', 'in-session'] },
    queueNumber: { $lt: patientQueueNumber },
  });

  const estimatedWaitTime = Math.max(0, patientsAheadCount * avgSessionTime);

  return {
    patientsAhead: patientsAheadCount,
    estimatedWaitTime,
    avgSessionTime,
  };
}
