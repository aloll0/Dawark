import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TicketStatus = 'waiting' | 'in-session' | 'completed';
export type PatientGender = 'Male' | 'Female';

export interface IPatientTicket extends Document {
  clinicId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientName: string;
  patientPhone: string;
  age: number;
  gender: PatientGender;
  queueNumber: number;
  status: TicketStatus;
  estimatedWaitTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const PatientTicketSchema = new Schema<IPatientTicket>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient phone number is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Please enter a valid age'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required'],
    },
    queueNumber: {
      type: Number,
      required: [true, 'Queue number is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-session', 'completed'],
      default: 'waiting',
      index: true,
    },
    estimatedWaitTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const PatientTicket: Model<IPatientTicket> =
  mongoose.models.PatientTicket ||
  mongoose.model<IPatientTicket>('PatientTicket', PatientTicketSchema);

export default PatientTicket;
