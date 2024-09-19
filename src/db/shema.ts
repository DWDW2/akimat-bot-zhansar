import mongoose, { Schema, Document, mongo } from "mongoose";

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
  blacklisted: { type: Boolean, default: false },
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
  status: "assigned" | "complete";
}

const reportSchema: Schema = new Schema({
  reportText: { type: String, required: true },
  department: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverChatId: { type: Number, required: true },
  receiverResponse: { type: String },
  photoUrl: { type: String },
  videoUrl: { type: String },
  dateReport: { type: Date, default: Date.now },
  dateResponse: { type: Date },
  status: { type: String, enum: ["assigned", "complete"], default: "assigned" },
});

interface IExecutor extends Document {
  fullName: string;
  chatId: number;
  userId: number;
  phoneNumber: string;
  department: string;
  assignedReports: mongoose.Types.ObjectId[];
}

const departments = [
  "Мемлекеттік-құқықтық бөлімі", // Kazakh
  "Государственно-правовой отдел", // Russian
  "Қаржы-шаруашылық бөлімі", // Kazakh
  "Финансово-хозяйственный отдел", // Russian
  "Көріктендіру бөлімі", // Kazakh
  "Отдел благоустройства", // Russian
  "Құжаттамалық қамтамасыз ету бөлімі", // Kazakh
  "Отдел документационного обеспечения", // Russian
  "Жұмыспен қамту және әлеуметтік бағдарламалар бөлімі", // Kazakh
  "Отдел занятости и социальных программ", // Russian
  "Инженерлік және жол инфрақұрылымы бөлімі", // Kazakh
  "Отдел инженерной и дорожной инфраструктуры", // Russian
  "Мәдениет және тілдерді дамыту бөлімі", // Kazakh
  "Отдел культуры и развития языков", // Russian
  "Коммуналдық шаруашылық бөлімі", // Kazakh
  "Отдел коммунального хозяйства", // Russian
  "Қоғамдық дамыту бөлімі", // Kazakh
  "Отдел общественного развития", // Russian
  "Ұйымдастыру және бақылау жұмысы бөлімі", // Kazakh
  "Отдел организационной и контрольной работы", // Russian
  "Кәсіпкерлікті және өнеркәсіпті дамыту бөлімі", // Kazakh
  "Отдел предпринимательства и промышленности", // Russian
];

const executorSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  chatId: { type: Number, required: true, unique: true },
  userId: { type: Number, reuried: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  department: {
    type: String,
    enum: departments,
    default: null,
  },
  assignedReports: [{ type: mongoose.Types.ObjectId, default: null }],
});

export const User = mongoose.model<IUser>("User", userSchema);
export const Report = mongoose.model<IReport>("Report", reportSchema);
export const Executor = mongoose.model<IExecutor>("Executor", executorSchema);
