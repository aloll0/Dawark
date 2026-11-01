import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Clinic, Doctor, PatientTicket, QueueCounter } from '@/models';
import { getTodayDateKey } from '@/lib/queue-service';

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    await connectToDatabase();

    // Check if clinics already exist
    const existingCount = await Clinic.countDocuments();
    if (existingCount > 0) {
      const clinics = await Clinic.find({}).lean();
      return NextResponse.json({
        success: true,
        message: 'Database already has clinics. Returning existing data.',
        clinics,
      });
    }

    // Create Clinic 1 (Active)
    const clinic1 = await Clinic.create({
      name: 'Al-Amal Specialized Medical Center',
      phone: '+201010428244',
      whatsappSupport: '+201010428244',
      subscriptionStatus: 'active',
      maxDoctors: 3,
      basePrice: 2000,
    });

    // Create Clinic 2 (Pending approval for Super Admin demo)
    const clinic2 = await Clinic.create({
      name: 'Nile Care Specialized Polyclinic',
      phone: '+201122334455',
      whatsappSupport: '+201010428244',
      subscriptionStatus: 'pending',
      maxDoctors: 3,
      basePrice: 2000,
    });

    // Create Doctors for Clinic 1
    const doc1 = await Doctor.create({
      clinicId: clinic1._id,
      name: 'Dr. Ahmed El-Sayed',
      specialization: 'Consultant Cardiologist',
      avgSessionTime: 12,
    });

    const doc2 = await Doctor.create({
      clinicId: clinic1._id,
      name: 'Dr. Sarah Mansour',
      specialization: 'Pediatric Specialist',
      avgSessionTime: 10,
    });

    // Create Doctor for Clinic 2
    await Doctor.create({
      clinicId: clinic2._id,
      name: 'Dr. Mona Zaki',
      specialization: 'Dermatology & Laser',
      avgSessionTime: 15,
    });

    // Initialize daily QueueCounter
    const dateKey = getTodayDateKey();
    await QueueCounter.create({
      clinicId: clinic1._id,
      doctorId: doc1._id,
      dateKey,
      lastQueueNumber: 3,
    });

    // Create initial tickets for Dr. Ahmed El-Sayed
    const ticket1 = await PatientTicket.create({
      clinicId: clinic1._id,
      doctorId: doc1._id,
      patientName: 'Omar Khaled',
      patientPhone: '+201001112233',
      age: 34,
      gender: 'Male',
      queueNumber: 1,
      status: 'in-session',
      estimatedWaitTime: 0,
    });

    const ticket2 = await PatientTicket.create({
      clinicId: clinic1._id,
      doctorId: doc1._id,
      patientName: 'Mariam Nour',
      patientPhone: '+201002223344',
      age: 28,
      gender: 'Female',
      queueNumber: 2,
      status: 'waiting',
      estimatedWaitTime: 12,
    });

    const ticket3 = await PatientTicket.create({
      clinicId: clinic1._id,
      doctorId: doc1._id,
      patientName: 'Youssef Hassan',
      patientPhone: '+201003334455',
      age: 52,
      gender: 'Male',
      queueNumber: 3,
      status: 'waiting',
      estimatedWaitTime: 24,
    });

    return NextResponse.json({
      success: true,
      message: 'Demo seed data created successfully!',
      clinic1Id: clinic1._id,
      clinic2Id: clinic2._id,
      doctorsCount: 3,
      ticketsCreated: [ticket1.queueNumber, ticket2.queueNumber, ticket3.queueNumber],
    });
  } catch (error: unknown) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to seed database', error: String(error) },
      { status: 500 }
    );
  }
}
