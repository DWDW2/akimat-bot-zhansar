import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import connectDB from './db/db';
import { User, Report, Executor } from './db/shema';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

connectDB();

const adminWhitelist = ['77072224104']; // Admin phone numbers

const departments = ['Department A', 'Department B', 'Department C'];

let userState: { [key: number]: any } = {};

function isAdmin(phoneNumber: string): boolean {
  return adminWhitelist.includes(phoneNumber);
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId: chatId });
  const admin = await Executor.findOne({ chatId: chatId });
  if (!user && !admin) {
    bot.sendMessage(chatId, 'Welcome! Please register first. Use /register to start.');
  } else if (admin) {
    bot.sendMessage(chatId, 'Welcome back! You can now receive reports.');
  } else {
    bot.sendMessage(chatId, 'Welcome back! Use /report to submit a new report.');
  }
});

bot.onText(/\/register/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please share your phone number:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Share Phone Number', request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
  userState[chatId] = { step: 'phoneNumber' };
});

bot.onText(/\/report/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId: chatId });
  
  if (!user) {
    bot.sendMessage(chatId, 'Please register first. Use /register to start.');
  } else {
    bot.sendMessage(chatId, 'Please choose a department:', {
      reply_markup: {
        keyboard: departments.map(dept => [{ text: dept }]),
        one_time_keyboard: true
      }
    });
    userState[chatId] = { step: 'department' };
  }
});

bot.onText(/\/getmyid/, (msg) => {
  if (msg.chat.type === 'private') {
    const userId = msg.from?.id;
    if (userId) {
      bot.sendMessage(msg.chat.id, `Your User ID is: ${userId}. Keep this private and share only with the bot administrator if needed.`);
    } else {
      bot.sendMessage(msg.chat.id, "Couldn't retrieve your User ID.");
    }
  } else {
    bot.sendMessage(msg.chat.id, "This command can only be used in private chats for security reasons.");
  }
});

bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const phoneNumber = msg.contact.phone_number;
  
  if (adminWhitelist.includes(phoneNumber)) {
    // Admin registration flow
    userState[chatId] = { step: 'adminFullName', phoneNumber };
    await bot.sendMessage(chatId, 'Admin registration: Please enter your full name.');
  } else {
    // Regular user flow
    if (userState[chatId] && userState[chatId].step === 'phoneNumber') {
      userState[chatId].phoneNumber = phoneNumber;
      userState[chatId].step = 'fullName';
      bot.sendMessage(chatId, 'Thank you. Now, please enter your full name:', {
        reply_markup: { remove_keyboard: true }
      });
    }
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState[chatId]) return;

  switch (userState[chatId].step) {
    case 'adminFullName':
      userState[chatId].fullName = text;
      await sendDepartmentSelection(chatId);
      break;
    case 'adminDepartment':
      if (departments.includes(text)) {
        userState[chatId].department = text;
        await registerAdmin(chatId, userState[chatId]);
      } else {
        bot.sendMessage(chatId, 'Please select a valid department.');
      }
      break;
    case 'fullName':
      userState[chatId].fullName = text;
      userState[chatId].step = 'language';
      bot.sendMessage(chatId, 'Please choose your language (Русский/Қазақша):', {
        reply_markup: {
          keyboard: [[{ text: 'Русский' }, { text: 'Қазақша' }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      break;

    case 'language':
      if (text === 'Русский' || text === 'Қазақша') {
        userState[chatId].language = text;
        userState[chatId].step = 'email';
        bot.sendMessage(chatId, 'Please enter your email:', {
          reply_markup: { remove_keyboard: true }
        });
      } else {
        bot.sendMessage(chatId, 'Please choose either Русский or Қазақша.');
      }
      break;

    case 'email':
      userState[chatId].email = text;
      await registerUser(chatId);
      break;

    case 'department':
      if (departments.includes(text!)) {
        userState[chatId].department = text;
        userState[chatId].step = 'reportText';
        bot.sendMessage(chatId, 'Please describe your report:', {
          reply_markup: { remove_keyboard: true }
        });
      } else {
        bot.sendMessage(chatId, 'Please select a valid department.');
      }
      break;

    case 'reportText':
      userState[chatId].reportText = text;
      userState[chatId].step = 'photo';
      bot.sendMessage(chatId, 'Please send a photo (if any) or type "skip":');
      break;

    case 'photo':
      if (msg.photo) {
        userState[chatId].photoUrl = msg.photo[msg.photo.length - 1].file_id;
        userState[chatId].step = 'video';
        bot.sendMessage(chatId, 'Photo received. Please send a video (if any) or type "skip":');
      } else if (text?.toLowerCase() === 'skip') {
        userState[chatId].step = 'video';
        bot.sendMessage(chatId, 'Please send a video (if any) or type "skip":');
      }
      break;

    case 'video':
      if (msg.video) {
        userState[chatId].videoUrl = msg.video.file_id;
        await submitReport(chatId);
      } else if (text?.toLowerCase() === 'skip') {
        await submitReport(chatId);
      } else {
        bot.sendMessage(chatId, 'Please send a video or type "skip".');
      }
      break;
  }
});

async function registerUser(chatId: number) {
  try {
    const newUser = new User({
      fullName: userState[chatId].fullName,
      chatId: chatId,
      language: userState[chatId].language,
      phoneNumber: userState[chatId].phoneNumber,
      email: userState[chatId].email
    });

    await newUser.save();
    bot.sendMessage(chatId, 'Registration successful! You can now use /report to submit reports.');
    delete userState[chatId];
  } catch (error) {
    console.error('Error registering user:', error);
    bot.sendMessage(chatId, 'An error occurred during registration. Please try again.');
  }
}



async function submitReport(chatId: number) {
  try {
    const user = await User.findOne({ chatId: chatId });
    if (!user) throw new Error('User not found');

    const executors = await Executor.find({ department: userState[chatId].department });
    if (executors.length === 0) throw new Error('No executors found for this department');
    
    const randomExecutor = executors[Math.floor(Math.random() * executors.length)];
    
    const newReport = new Report({
      reportText: userState[chatId].reportText,
      department: userState[chatId].department,
      chatId: chatId,
      receiverChatId: randomExecutor.chatId,
      photoUrl: userState[chatId].photoUrl || '',
      videoUrl: userState[chatId].videoUrl || '',
      dateReport: new Date(),
      status: 'Pending'
    });

    await newReport.save();

    bot.sendMessage(chatId, 'Your report has been submitted successfully!');
    bot.sendMessage(randomExecutor.chatId, 'New report has been submitted!');
    //send message to random executor. Send reportText, photo from photoUrl, video from videoUrl
    await sendReportToExecutor(randomExecutor.chatId, newReport);
    delete userState[chatId];
  } catch (error) {
    console.error('Error submitting report:', error);
    bot.sendMessage(chatId, 'An error occurred while submitting your report. Please try again.');
  }
}

async function sendReportToExecutor(executorChatId: number, report: any) {
    try {
      // Send report text
      await bot.sendMessage(executorChatId, `New report has been submitted!\n\nReport text: ${report.reportText}`);
  
      // Send photo if available
      if (report.photoUrl) {
        await bot.sendPhoto(executorChatId, report.photoUrl, { caption: 'Report photo' });
      }
  
      // Send video if available
      if (report.videoUrl) {
        await bot.sendVideo(executorChatId, report.videoUrl, { caption: 'Report video' });
      }
  
      // Confirm report sent
      await bot.sendMessage(executorChatId, 'Please review the report and respond.');
    } catch (error) {
      console.error('Error sending report to executor:', error);
      // Handle error (e.g., notify admin, log it, etc.)
    }
  }

async function registerAdmin(chatId: number, adminData: any) {
  try {
    const newExecutor = new Executor({
      fullName: adminData.fullName,
      chatId: chatId,
      phoneNumber: adminData.phoneNumber,
      department: adminData.department
    });

    await newExecutor.save();
    bot.sendMessage(chatId, 'Admin registration successful! You can now receive reports.');
    delete userState[chatId];
  } catch (error) {
    console.error('Error registering admin:', error);
    bot.sendMessage(chatId, 'An error occurred during registration. Please try again.');
  }
}

async function sendDepartmentSelection(chatId: number) {
  userState[chatId].step = 'adminDepartment';
  bot.sendMessage(chatId, 'Please select your department:', {
    reply_markup: {
      keyboard: departments.map(dept => [{ text: dept }]),
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
}

console.log('Bot is running...');