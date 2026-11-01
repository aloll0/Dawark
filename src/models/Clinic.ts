import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubscriptionStatus = 'active' | 'pending' | 'inactive';

export interface IClinic extends Document {
  name: string;
  phone: string;
  whatsappSupport: string;
  subscriptionStatus: SubscriptionStatus;
  maxDoctors: number;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicSchema = new Schema<IClinic>(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Clinic phone number is required'],
      trim: true,
    },
    whatsappSupport: {
      type: String,
      default: '+201010428244',
      trim: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'pending', 'inactive'],
      default: 'pending',
      index: true,
    },
    maxDoctors: {
      type: Number,
      default: 3,
      min: [1, 'Must have at least 1 doctor'],
    },
    basePrice: {
      type: Number,
      default: 2000,
      min: [0, 'Base price cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const Clinic: Model<IClinic> =
  mongoose.models.Clinic || mongoose.model<IClinic>('Clinic', ClinicSchema);

export default Clinic;
