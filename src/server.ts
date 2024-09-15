import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import connectDB from './db/db';
import { User, Report, Executor } from './db/shema';
import { messages } from './constants';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { chat } from 'googleapis/build/src/apis/chat';
import { InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

connectDB();

const adminWhitelist = ['77772794404'];

console.log('Bot is running...');

bot.setMyCommands([
  { command: '/start', description: '🤩 Start the bot / Запустить бот / Ботты іске қосу' },
  { command: '/help', description: '🤔 Get help / Получить помощь / Көмек алу' },
  { command: '/report', description: '📝 Send a complaint / Отправить жалобу / Жағдайды хабарлау' },
  { command: '/language', description: '🌐 Change language / Изменить язык / Тілді өзгерту' },
  { command: '/register', description: '📋 Register / Зарегистрироваться / Тіркелу' }
]);

interface Department {
  ru: string;
  kk: string;
}

const departments: Department[] = [
  { ru: 'Государственно-правовой отдел', kk: 'Мемлекеттік-құқықтық бөлімі' },
  { ru: 'Финансово-хозяйственный отдел', kk: 'Қаржы-шаруашылық бөлімі' },
  { ru: 'Отдел благоустройства', kk: 'Көріктендіру бөлімі' },
  { ru: 'Отдел документационного обеспечения', kk: 'Құжаттамалық қамтамасыз ету бөлімі' },
  { ru: 'Отдел занятости и социальных программ', kk: 'Жұмыспен қамту және әлеуметтік бағдарламалар бөлімі' },
  { ru: 'Отдел инженерной и дорожной инфраструктуры', kk: 'Инженерлік және жол инфрақұрылымы бөлімі' },
  { ru: 'Отдел культуры и развития языков', kk: 'Мәдениет және тілдерді дамыту бөлімі' },
  { ru: 'Отдел коммунального хозяйства', kk: 'Коммуналдық шаруашылық бөлімі' },
  { ru: 'Отдел общественного развития', kk: 'Қоғамдық дамыту бөлімі' },
  { ru: 'Отдел организационной и контрольной работы', kk: 'Ұйымдастыру және бақылау жұмысы бөлімі' },
  { ru: 'Отдел предпринимательства и промышленности', kk: 'Кәсіпкерлікті және өнеркәсіпті дамыту бөлімі' }
];

interface UserState {
  language: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  registrationStep?: 'awaitingName' | 'awaitingPhone' | 'awaitingEmail';
}

let userState: { [key: number]: UserState } = {};

let adminPanel = false;

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });
  const language = user?.language || 'ru'; 
  userState[chatId] = { ...userState[chatId], language };
  
  const welcomeMessage = user 
    ? messages.welcomeBackUser[language] 
    : messages.welcome[language];
  const commandButtons = [
    [{ text: '🤩 Запустить бот / Ботты іске қосу' }, { text: '🤔 Получить помощь / Көмек алу' }],
    [{ text: '📝 Отправить жалобу / Шағым жіберу' }, { text: '🌐 Изменить язык / Тілді өзгерту' }],
    [{ text: '📋 Зарегистрироваться / Тіркелу' }]
  ];

  const functionalityMessage = messages.botFunctionality[language];

  await bot.sendMessage(chatId, `${welcomeMessage}\n\n${functionalityMessage}`, {
    reply_markup: {
      keyboard: commandButtons,
      resize_keyboard: true
    }
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userState[chatId]) {
    const user = await User.findOne({ chatId });
    userState[chatId] = { language: user?.language || 'ru' };
  }

  switch(text){
    case "🤔 Получить помощь / Көмек алу":
      await handleHelp(chatId);
      break;
    case "📝 Отправить жалобу / Шағым жіберу":
      await handleReport(chatId);
      break;
    case "🌐 Изменить язык / Тілді өзгерту":
      await handleLanguage(chatId);
      break;
    case "📋 Зарегистрироваться / Тіркелу":
      await handleRegister(chatId);
      break;
    case "/help":
      await handleHelp(chatId);
      break;
    case "/report":
      await handleReport(chatId);
      break;
    case "/language":
      await handleLanguage(chatId);
      break;  
    case "/register":
      await handleRegister(chatId);
      break;
  }
})

async function handleHelp(chatId: number) {
  const language = userState[chatId]?.language || 'ru';
  
  const helpMessage = {
    ru: `📌 Информация о боте:

1. Как зарегистрироваться:
   • Используйте команду /register или нажмите кнопку "📋 Зарегистрироваться"
   • Следуйте инструкциям для ввода имени, номера телефона и email

2. Как отправить жалобу:
   • Используйте команду /report или нажмите кнопку "📝 Отправить жалобу"
   • Опишите вашу проблему
   • Выберите соответствующий отдел
   • При желании, прикрепите фото ��ли видео

3. Информация об отделах:
   • Государственно-правовой отдел
   • Финансово-хозяйственный отдел
   • Отдел благоустройства
   • Отдел документационного обеспечения
   • Отдел занятости и социальных программ
   • Отдел инженерной и дорожной инфраструктуры
   • Отдел культуры и развития языков
   • Отдел коммунального хозяйства
   • Отдел общественного развития
   • Отдел организационной и контрольной работы
   • Отдел предпринимательства и промышленности

Для смены языка используйте команду /language или нажмите кнопку "🌐 Изменить язык"`,

    kk: `📌 Бот туралы ақпарат:

1. Қалай тіркелуге болады:
   • /register командасын пайдаланыңыз немесе "📋 Тіркелу" түймесін басыңыз
   • Аты-жөніңізді, телефон нөміріңізді және email енгізу нұсқауларын орындаңыз

2. Шағымды қалай жіберуге болады:
   • /report командасын пайдаланыңыз немесе "📝 Шағым жіберу" түймесін басыңыз
   • Мәселеңізді сипаттаңыз
   • Тиісті бөлімді таңдаңыз
   • Қалауыңыз бойнша фото немесе бейне тіркеңіз

3. Бөлімдер туралы ақпарат:
   • Мемлекеттік-құқықтық бөлімі
   • Қаржы-шаруашылық бөлімі
   • Көріктендіру бөлімі
   • Құжаттамалық қамтамасыз ету бөлімі
   • Жұмыспен қамту және әлеуметтік бағдарламалар бөлімі
   • Инженерлік және жол инфрақұрылымы бөлімі
   • Мәдениет және тілдерді дамыту бөлімі
   • Коммуналдық шаруашылық бөлімі
   • Қоғамдық дамыту бөлімі
   • Ұйымдастыру және бақылау жұмысы бөлімі
   • Кәсіпкерлікті және өнеркәсіпті дамыту бөлімі

Тілді өзгерту үшін /language командасын пайдаланыңыз не��есе "🌐 Тілді өзгерту" түймесін басыңыз`
  };

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: language === 'ru' ? '📋 Зарегистрироваться' : '📋 Тіркелу', callback_data: 'register' },
        { text: language === 'ru' ? '📝 Отправить жалобу' : '📝 Шағым жіберу', callback_data: 'report' }
      ],
      [
        { text: language === 'ru' ? '🌐 Изменить язык' : '🌐 Тілді өзгерту', callback_data: 'language' }
      ]
    ]
  };

  await bot.sendMessage(chatId, helpMessage[language], { reply_markup: keyboard });
}

async function handleReport(chatId: number) {
  const language = userState[chatId]?.language || 'ru';
  const user = await User.findOne({ chatId });

  if (!user) {
    await bot.sendMessage(chatId, messages.report.notRegistered[language]);
    return;
  }

  await bot.sendMessage(chatId, messages.report.textPrompt[language]);
  
  const reportText = await new Promise<string>((resolve) => {
    bot.once('message', (msg) => {
      if (msg.chat.id === chatId && msg.text) {
        resolve(msg.text);
      }
    });
  });

  const departmentOptions = departments.map(dept => ({ text: dept[language as keyof Department] }));
  
  await bot.sendMessage(chatId, messages.report.departmentPrompt[language], {
    reply_markup: {
      keyboard: departmentOptions.map(dept => [dept]),
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });

  const department = await new Promise<string>((resolve) => {
    bot.once('message', (msg) => {
      if (msg.chat.id === chatId && msg.text) {
        const selectedDept = departments.find(dept => dept[language as keyof Department] === msg.text);
        if (selectedDept) {
          resolve(selectedDept[language as keyof Department]);
        }
      }
    });
  });

  await bot.sendMessage(chatId, messages.report.photoPrompt[language]);
  
  const photoUrl = await new Promise<string | null>((resolve) => {
    bot.once('message', (msg) => {
      if (msg.chat.id === chatId) {
        if (msg.photo && msg.photo.length > 0) {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          bot.getFileLink(fileId).then(url => resolve(url));
        } else {
          resolve(null);
        }
      }
    });
  });

  await bot.sendMessage(chatId, messages.report.videoPrompt[language]);
  
  const videoUrl = await new Promise<string | null>((resolve) => {
    bot.once('message', (msg) => {
      if (msg.chat.id === chatId) {
        if (msg.video) {
          bot.getFileLink(msg.video.file_id).then(url => resolve(url));
        } else {
          resolve(null);
        }
      }
    });
  });

  const executors = await Executor.find({});
  
  if (executors.length === 0) {
    await bot.sendMessage(chatId, messages.report.noExecutors[language]);
    return;
  }

  const randomExecutor = executors[Math.floor(Math.random() * executors.length)];

  try {
    const newReport = new Report({
      reportText,
      department,
      user: user.id,
      chatId,
      photoUrl,
      videoUrl,
      dateReport: new Date(),
      status: 'assigned',
      receiverChatId: randomExecutor.chatId
    });

    await newReport.save();

    await addReportToSheet(newReport);

    await bot.sendMessage(chatId, messages.report.success[language]);
  } catch (error) {
    console.error('Error saving report:', error);
    await bot.sendMessage(chatId, messages.report.error[language]);
  }
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

const jwtClient = new JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth: jwtClient });

async function addReportToSheet(report: any) {
  try {
    const user = await User.findById(report.user);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(user);
    const values = [
      [
        user.id,
        user.fullName,
        user.phoneNumber,
        user.email || 'N/A',
        report.chatId,
        report.reportText,
        report.department,
        report.photoUrl || 'N/A',
        report.videoUrl || 'N/A',
        report.dateReport.toISOString(),
        report.status,
        report.receiverChatId.toString()
      ]
    ];
    console.log(values);
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1', 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    console.log('Report added to Google Sheets:', response.data);
  } catch (error) {
    console.error('Error adding report to Google Sheets:', error);
  }
}

async function askLanguage(chatId: number): Promise<void> {
  const user = await User.findOne({ chatId });
  const currentLanguage = user?.language || userState[chatId]?.language || 'ru';
  
  await bot.sendMessage(chatId, '🌎 Выберите язык / Тілді таңдаңыз:', {
    reply_markup: {
      keyboard: [
        [{ text: '🇷🇺 Русский' }, { text: '🇰🇿 Қазақша' }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });

  return new Promise((resolve) => {
    bot.once('message', async (msg) => {
      if (msg.chat.id === chatId) {
        const lang = msg.text;
        if (lang === '🇷🇺 Русский' || lang === '🇰🇿 Қазақша') {
          const newLanguage = lang === '🇷🇺 Русский' ? 'ru' : 'kk';
          userState[chatId] = { ...userState[chatId], language: newLanguage };
          await bot.sendMessage(chatId, '🌎 Язык успешно изменен! / Тілді өзгерту сәтті аяқталды!');
          if (user) {
            user.language = newLanguage;
            await user.save();
          }
        } else {
          userState[chatId] = { ...userState[chatId], language: currentLanguage };
        }
        resolve();
      }
    });
  });
}

async function handleLanguage(chatId: number) {
  await askLanguage(chatId);
}

async function handleRegister(chatId: number) {
  const language = userState[chatId]?.language || 'ru';
  
  await bot.sendMessage(chatId, messages.registration.namePrompt[language]);
  
  userState[chatId] = { 
    ...userState[chatId], 
    language,
    registrationStep: 'awaitingName' 
  };
  
  bot.once('message', async (msg) => {
    if (msg.chat.id === chatId && msg.text) {
      const fullName = msg.text;
      userState[chatId] = { 
        ...userState[chatId], 
        fullName, 
        registrationStep: 'awaitingPhone' 
      };
      
      await bot.sendMessage(chatId, messages.registration.phonePrompt[language]);
      
      bot.once('message', async (phoneMsg) => {
        if (phoneMsg.chat.id === chatId && phoneMsg.text) {
          const phoneNumber = phoneMsg.text;
          userState[chatId] = { 
            ...userState[chatId], 
            phoneNumber, 
            registrationStep: 'awaitingEmail' 
          };

          await bot.sendMessage(chatId, messages.registration.emailPrompt[language]);

          bot.once('message', async (emailMsg) => {
            if (emailMsg.chat.id === chatId && emailMsg.text) {
              const email = emailMsg.text;
              
              try {
                await User.findOneAndUpdate(
                  { chatId },
                  { 
                    chatId,
                    fullName: userState[chatId].fullName,
                    phoneNumber: userState[chatId].phoneNumber,
                    email,
                    language
                  },
                  { upsert: true, new: true }
                );
                
                await bot.sendMessage(chatId, messages.registration.success[language]);
              } catch (error) {
                console.error('Error during registration:', error);
                await bot.sendMessage(chatId, messages.registration.error[language]);
              }
            
              userState[chatId] = { language };
            }
          });
        }
      });
    }
  });
}

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  switch (query.data) {
    case 'register':
      await handleRegister(chatId);
      break;
    case 'report':
      await handleReport(chatId);
      break;
    case 'language':
      await handleLanguage(chatId);
      break;
  }

  await bot.answerCallbackQuery(query.id);
});


bot.onText(/\/admin/, async (msg) => {
  bot.sendMessage(msg.chat.id, 'Отправьте пароль для того что бы войти в админ панель');
  bot.once('message', async (msg) => {
    if(msg.text === process.env.ADMIN_PASSWORD){
      adminPanel = true;
      bot.sendMessage(msg.chat.id, 'Вы вошли в админ панель');
    }else{
      bot.sendMessage(msg.chat.id, 'Неверный пароль');
    }
  });
});

async function getAllReports(){
  const reports = await Report.find({});
  return reports;
}


console.log('Bot is running...');