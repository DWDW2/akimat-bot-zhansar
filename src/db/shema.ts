import mongoose, { Schema, Document } from 'mongoose';

// User Schema
interface IUser extends Document {
  fullName: string;
  chatId: number;
  language: string;
  phoneNumber: string;
  email: string;
}

const userSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  username: { type: String },
  chatId: { type: Number, required: true, unique: true },
  language: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String }
});

// Report Schema
interface IReport extends Document {
  reportText: string;
  department: string;
  chatId: number;
  receiverChatId: number;
  receiverAnswer: string;
  photoUrl: string;  // Changed from photoUrls array to single photoUrl
  videoUrl: string;
  dateReport: Date;
  dateResponse: Date;
  status: string;
}

const reportSchema: Schema = new Schema({
  reportText: { type: String, required: true },
  department: { type: String, required: true },
  chatId: { type: Number, required: true },
  receiverChatId: { type: Number, required: true },
  receiverAnswer: { type: String },
  photoUrl: { type: String },  // Changed from photoUrls array to single photoUrl
  videoUrl: { type: String },
  dateReport: { type: Date, default: Date.now },
  dateResponse: { type: Date },
  status: { type: String, default: 'Pending' }
});

// Executor Schema
interface IExecutor extends Document {
  fullName: string;
  chatId: number;
  phoneNumber: string;
  department: string;
}

const executorSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  chatId: { type: Number, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true }
});

// Create and export models
export const User = mongoose.model<IUser>('User', userSchema);
export const Report = mongoose.model<IReport>('Report', reportSchema);
export const Executor = mongoose.model<IExecutor>('Executor', executorSchema);