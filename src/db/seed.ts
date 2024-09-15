import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Report, Executor } from './shema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Report.deleteMany({});
    await Executor.deleteMany({});

    const users = await User.create([
      { fullName: 'John Doe', chatId: 123456, language: 'ru', phoneNumber: '+77001234567', email: 'john@example.com' },
      { fullName: 'Jane Smith', chatId: 234567, language: 'kk', phoneNumber: '+77007654321', email: 'jane@example.com' },
    ]);
    console.log('Users seeded');

    const executors = await Executor.create([
      { fullName: 'Admin One', chatId: 345678, phoneNumber: '+77009876543', department: 'Финансово-хозяйственный отдел' },
      { fullName: 'Admin Two', chatId: 456789, phoneNumber: '+77008765432', department: 'Отдел благоустройства' },
    ]);
    console.log('Executors seeded');

    await Report.create([
      {
        reportText: 'Issue with street lighting',
        department: 'Отдел благоустройства',
        chatId: users[0].chatId,
        receiverChatId: executors[1].chatId,
        photoUrl: 'http://example.com/photo1.jpg',
        videoUrl: 'http://example.com/video1.mp4',
        dateReport: new Date(),
        status: 'Pending'
      },
      {
        reportText: 'Question about tax payment',
        department: 'Финансово-хозяйственный отдел',
        chatId: users[1].chatId,
        receiverChatId: executors[0].chatId,
        photoUrl: 'http://example.com/photo2.jpg',
        dateReport: new Date(),
        status: 'In Progress',
        receiverAnswer: 'We are looking into your question.',
        dateResponse: new Date()
      },
    ]);
    console.log('Reports seeded');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();