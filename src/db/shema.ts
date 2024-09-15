import mongoose, { Schema, Document } from 'mongoose';

// User Schema
interface IUser extends Document {
  fullName: string;
  chatId: number;
  language: string;
  phoneNumber: string;
  email: string;
  blacklisted: boolean;
}

const userSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  chatId: { type: Number, required: true, unique: true },
  language: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String },
  blacklisted: { type: Boolean, default: false }
});

interface IReport extends Document {
  reportText: string;
  department: string;
  user: Schema.Types.ObjectId;  
  receiverChatId: number;
  receiverResponse: string;
  photoUrl: string;  
  videoUrl: string;
  dateReport: Date;
  dateResponse: Date;
  status: 'assigned' | 'complete';
}

const reportSchema: Schema = new Schema({
  reportText: { type: String, required: true },
  department: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User model
  receiverChatId: { type: Number, required: true },
  receiverResponse: { type: String },
  photoUrl: { type: String },
  videoUrl: { type: String },
  dateReport: { type: Date, default: Date.now },
  dateResponse: { type: Date },
  status: { type: String, enum: ['assigned', 'complete'], default: 'assigned' }
});

interface IExecutor extends Document {
  fullName: string;
  chatId: number;
  phoneNumber: string;
  department: string;
  assignedReports: number;
}

const executorSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  chatId: { type: Number, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  assignedReports: { type: Number, default: 0 }
});

// Create and export models
export const User = mongoose.model<IUser>('User', userSchema);
export const Report = mongoose.model<IReport>('Report', reportSchema);
export const Executor = mongoose.model<IExecutor>('Executor', executorSchema);