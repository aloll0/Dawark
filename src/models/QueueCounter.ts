import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IQueueCounter extends Document {
  clinicId: Types.ObjectId;
  doctorId: Types.ObjectId;
  dateKey: string; // Format: YYYY-MM-DD
  lastQueueNumber: number;
}

const QueueCounterSchema = new Schema<IQueueCounter>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    lastQueueNumber: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

QueueCounterSchema.index({ clinicId: 1, doctorId: 1, dateKey: 1 }, { unique: true });

export const QueueCounter: Model<IQueueCounter> =
  mongoose.models.QueueCounter || mongoose.model<IQueueCounter>('QueueCounter', QueueCounterSchema);

export default QueueCounter;
