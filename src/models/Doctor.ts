import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDoctor extends Document {
  clinicId: Types.ObjectId;
  name: string;
  specialization: string;
  avgSessionTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    avgSessionTime: {
      type: Number,
      required: [true, 'Average session time is required'],
      default: 15,
      min: [1, 'Average session time must be at least 1 minute'],
    },
  },
  {
    timestamps: true,
  }
);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);

export default Doctor;
