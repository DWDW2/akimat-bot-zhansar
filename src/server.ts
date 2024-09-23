import TelegramBot, { ReplyKeyboardMarkup } from "node-telegram-bot-api";
import dotenv from "dotenv";
import connectDB from "./db/db";
import { User, Report, Executor, Admin } from "./db/shema";
import { messages } from "./constants";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { join } from "path";
import { chat } from "googleapis/build/src/apis/chat";
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from "node-telegram-bot-api";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

connectDB();

const adminWhitelist = ["77772794404"];

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

const jwtClient = new JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: SCOPES,
});

bot.setMyCommands([
  {
    command: "/start",
    description: "🤩 Start the bot / Запустить бот / Ботты іске қосу",
  },
  {
    command: "/help",
    description: "🤔 Get help / Получить помощь / Көмек алу",
  },
  {
    command: "/report",
    description: "📝 Send a complaint / Отправить жалобу / Жағдайды хабарлау",
  },
  {
    command: "/language",
    description: "🌐 Change language / Изменить язык / Тілді өзгерту",
  },
  {
    command: "/register",
    description: "📋 Register / Зарегистрироваться / Тіркелу",
  },
]);

interface Department {
  ru: string;
  kk: string;
}

const departments: Department[] = [
  { ru: "Государственно-правовой отдел", kk: "Мемлекеттік-құқықтық бөлімі" },
  { ru: "Финансово-хозяйственный отдел", kk: "Қаржы-шаруашылық бөлімі" },
  { ru: "Отдел благоустройства", kk: "Көріктендіру бөлімі" },
  {
    ru: "Отдел документационного обеспечения",
    kk: "Құжаттамалық қамтамасыз ету бөлімі",
  },
  {
    ru: "Отдел занятости и социальных программ",
    kk: "Жұмыспен қамту және әлеуметтік бағдарламалар бөлімі",
  },
  {
    ru: "Отдел инженерной и дорожной инфраструктуры",
    kk: "Инженерлік және жол инфрақұрылымы бөлімі",
  },
  {
    ru: "Отдел культуры и развития языков",
    kk: "Мәдениет және тілдерді дамыту бөлімі",
  },
  { ru: "Отдел коммунального хозяйства", kk: "Коммуналдық шаруашылық бөлімі" },
  { ru: "Отдел общественного развития", kk: "Қоғамдық дамыту бөлімі" },
  {
    ru: "Отдел организационной и контрольной работы",
    kk: "Ұйымдастыру және бақылау жұмысы бөлімі",
  },
  {
    ru: "Отдел предпринимательства и промышленности",
    kk: "Кәсіпкерлікті және өнеркәсіпті дамыту бөлімі",
  },
];

interface UserState {
  language: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  registrationStep?: "awaitingName" | "awaitingPhone" | "awaitingEmail";
}

let userState: { [key: number]: UserState } = {};

let adminPanel = false;
let executorPanel = false;

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });
  const language = user?.language || "ru";
  userState[chatId] = { ...userState[chatId], language };

  const welcomeMessage = user
    ? messages.welcomeBackUser[language]
    : messages.welcome[language];
  const commandButtons = [
    [
      { text: "🤩 Запустить бот / Ботты іске қосу" },
      { text: "🤔 Получить помощь / Көмек алу" },
    ],
    [
      { text: "📝 Отправить жалобу / Шағым жіберу" },
      { text: "🌐 Изменить язык / Тілді өзгерту" },
    ],
    [{ text: "📋 Зарегистрироваться / Тіркелу" }],
  ];

  const functionalityMessage = messages.botFunctionality[language];

  await bot.sendMessage(
    chatId,
    `${welcomeMessage}\n\n${functionalityMessage}`,
    {
      reply_markup: {
        keyboard: commandButtons,
        resize_keyboard: true,
      },
    }
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState[chatId]) {
    const user = await User.findOne({ chatId });
    userState[chatId] = { language: user?.language || "ru" };
  }

  switch (text) {
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
});

async function handleHelp(chatId: number) {
  const language = userState[chatId]?.language || "ru";

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

Тілді өзгерту үшін /language командасын пайдаланыңыз не��есе "🌐 Тілді өзгерту" түймесін басыңыз`,
  };

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: language === "ru" ? "📋 Зарегистрироваться" : "📋 Тіркелу",
          callback_data: "register",
        },
        {
          text: language === "ru" ? "📝 Отправить жалобу" : "📝 Шағым жіберу",
          callback_data: "report",
        },
      ],
      [
        {
          text: language === "ru" ? "🌐 Изменить язык" : "🌐 Тілді өзгерту",
          callback_data: "language",
        },
      ],
    ],
  };

  await bot.sendMessage(chatId, helpMessage[language], {
    reply_markup: keyboard,
  });
}

async function handleReport(chatId: number) {
  const language = userState[chatId]?.language || "ru";
  const user = await User.findOne({ chatId });

  if (!user) {
    await bot.sendMessage(chatId, messages.report.notRegistered[language]);
    return;
  }

  await bot.sendMessage(chatId, messages.report.textPrompt[language]);

  const reportText = await new Promise<string>((resolve) => {
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId && msg.text) {
        resolve(msg.text);
      }
    });
  });

  const departmentOptions = departments.map((dept) => ({
    text: dept[language as keyof Department],
  }));

  await bot.sendMessage(chatId, messages.report.departmentPrompt[language], {
    reply_markup: {
      keyboard: departmentOptions.map((dept) => [dept]),
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });

  const department = await new Promise<string>((resolve) => {
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId && msg.text) {
        const selectedDept = departments.find(
          (dept) => dept[language as keyof Department] === msg.text
        );
        if (selectedDept) {
          resolve(selectedDept[language as keyof Department]);
        }
      }
    });
  });

  await bot.sendMessage(chatId, messages.report.photoPrompt[language]);

  const photoUrl = await new Promise<string | null>((resolve) => {
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId) {
        if (msg.photo && msg.photo.length > 0) {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          bot.getFileLink(fileId).then((url) => resolve(url));
        } else {
          resolve(null);
        }
      }
    });
  });

  await bot.sendMessage(chatId, messages.report.videoPrompt[language]);

  const videoUrl = await new Promise<string | null>((resolve) => {
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId) {
        if (msg.video) {
          bot.getFileLink(msg.video.file_id).then((url) => resolve(url));
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

  const randomExecutor =
    executors[Math.floor(Math.random() * executors.length)];

  try {
    const newReport = new Report({
      reportText,
      department,
      user: user.id,
      photoUrl,
      videoUrl,
      dateReport: new Date(),
      status: "assigned",
      receiverChatId: randomExecutor.chatId,
    });

    await newReport.save();

    await addReportToSheet(newReport);

    await bot.sendMessage(chatId, messages.report.success[language]);
  } catch (error) {
    console.error("Error saving report:", error);
    await bot.sendMessage(chatId, messages.report.error[language]);
  }
}

const sheets = google.sheets({ version: "v4", auth: jwtClient });

async function addReportToSheet(report: any) {
  try {
    // Fetch the user and admin data
    const user = await User.findById(report.user);
    const admin = await Admin.find({ googleSheetId: { $ne: null } });

    if (!admin || admin.length === 0) {
      return false;
    }
    if (!user) {
      throw new Error("User not found");
    }

    // Define the column names
    const columnNames = [
      "User ID",
      "Full Name",
      "Phone Number",
      "Email",
      "Report Text",
      "Department",
      "Photo URL",
      "Video URL",
      "Report Date",
      "Status",
      "Receiver Chat ID",
    ];

    // Fetch spreadsheet details
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: admin[0].googleSheetId,
    });

    const sheetsList = sheetInfo.data.sheets;
    if (!sheetsList || sheetsList.length === 0) {
      throw new Error("No sheets found in the spreadsheet.");
    }

    // Use the first available sheet
    const firstSheet = sheetsList[0].properties?.title;
    const sheetId = sheetsList[0].properties?.sheetId;

    if (!firstSheet || sheetId === undefined) {
      throw new Error("Sheet details not found.");
    }

    // Check and add column names if they do not exist
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: admin[0].googleSheetId,
      range: `${firstSheet}!A1:L1`,
    });

    const firstRow = sheetData.data.values ? sheetData.data.values[0] : [];

    if (
      !firstRow.length ||
      !firstRow.every((col, idx) => col === columnNames[idx])
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: admin[0].googleSheetId,
        range: `${firstSheet}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [columnNames],
        },
      });
      console.log("Column names added to the first sheet.");

      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: admin[0].googleSheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: columnNames.length,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: true,
                        fontSize: 12, // Larger font size
                      },
                    },
                  },
                  fields: "userEnteredFormat(backgroundColor,textFormat)",
                },
              },
            ],
          },
        });

        console.log("Formatting applied to column names.");
      }
    } else {
      console.log("Column names already exist.");
    }

    // Prepare the values for the report
    const values = [
      [
        user.id,
        user.fullName,
        user.phoneNumber,
        user.email || "N/A",
        report.reportText,
        report.department,
        report.photoUrl || "N/A",
        report.videoUrl || "N/A",
        report.dateReport.toISOString(),
        report.status,
        report.receiverChatId.toString(),
      ],
    ];

    // Append the new report data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: admin[0].googleSheetId,
      range: `${firstSheet}`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: values,
      },
    });

    console.log("Report added to the first sheet:", response.data);

    // Apply text overflow formatting to newly appended rows
    const lastRowIndex = response.data.updates.updatedRange
      .split(":")[1]
      .replace(/\D/g, "");
    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: admin[0].googleSheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 1,
                  endRowIndex: parseInt(lastRowIndex, 10),
                  startColumnIndex: 0,
                  endColumnIndex: columnNames.length,
                },
                cell: {
                  userEnteredFormat: {
                    wrapStrategy: "OVERFLOW_CELL",
                  },
                },
                fields: "userEnteredFormat(wrapStrategy)",
              },
            },
          ],
        },
      });

      console.log("Text overflow formatting applied to report data.");
    }
  } catch (error) {
    console.error("Error adding report to Google Sheets:", error);
  }
}

async function askLanguage(chatId: number): Promise<void> {
  const user = await User.findOne({ chatId });
  const currentLanguage = user?.language || userState[chatId]?.language || "ru";

  await bot.sendMessage(chatId, "🌎 Выберите язык / Тілді таңдаңыз:", {
    reply_markup: {
      keyboard: [[{ text: "🇷🇺 Русский" }, { text: "🇰🇿 Қазақша" }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });

  return new Promise((resolve) => {
    bot.once("message", async (msg) => {
      if (msg.chat.id === chatId) {
        const lang = msg.text;
        if (lang === "🇷🇺 Русский" || lang === "🇰🇿 Қазақша") {
          const newLanguage = lang === "🇷🇺 Русский" ? "ru" : "kk";
          userState[chatId] = { ...userState[chatId], language: newLanguage };
          await bot.sendMessage(
            chatId,
            "🌎 Язык успешно изменен! / Тілді өзгерту сәтті аяқталды!"
          );
          if (user) {
            user.language = newLanguage;
            await user.save();
          }
        } else {
          userState[chatId] = {
            ...userState[chatId],
            language: currentLanguage,
          };
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
  const language = userState[chatId]?.language || "ru";

  await bot.sendMessage(chatId, messages.registration.namePrompt[language]);

  userState[chatId] = {
    ...userState[chatId],
    language,
    registrationStep: "awaitingName",
  };

  bot.once("message", async (msg) => {
    if (msg.chat.id === chatId && msg.text) {
      const fullName = msg.text;
      userState[chatId] = {
        ...userState[chatId],
        fullName,
        registrationStep: "awaitingPhone",
      };

      await bot.sendMessage(
        chatId,
        messages.registration.phonePrompt[language]
      );

      bot.once("message", async (phoneMsg) => {
        if (phoneMsg.chat.id === chatId && phoneMsg.text) {
          const phoneNumber = phoneMsg.text;
          userState[chatId] = {
            ...userState[chatId],
            phoneNumber,
            registrationStep: "awaitingEmail",
          };

          await bot.sendMessage(
            chatId,
            messages.registration.emailPrompt[language]
          );

          bot.once("message", async (emailMsg) => {
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
                    language,
                  },
                  { upsert: true, new: true }
                );

                await bot.sendMessage(
                  chatId,
                  messages.registration.success[language]
                );
              } catch (error) {
                console.error("Error during registration:", error);
                await bot.sendMessage(
                  chatId,
                  messages.registration.error[language]
                );
              }

              userState[chatId] = { language };
            }
          });
        }
      });
    }
  });
}
function extractGoogleSheetId(url): string | false {
  const regex = /\/d\/([a-zA-Z0-9-_]+)\//;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return false;
  }
}

async function handleGoogleSheetId(chatId: number) {
  bot.sendMessage(chatId, "Отправьте гугл таблицу");
  bot.once("message", async (msg) => {
    const googleSheetUrl = msg.text;
    const googleSheetId = extractGoogleSheetId(googleSheetUrl);
    if (googleSheetId === false) {
      bot.sendMessage(
        chatId,
        "Ссылка на гугл таблицу неверная, попбробуйте снова"
      );
    }
    const admin = Admin.findOneAndUpdate(
      { chat_id: msg.chat.id },
      { googleSheetId: googleSheetId },
      { new: true }
    );
    (await admin).save();
  });
}

async function handleRegisterExecutor(chatId: number) {
  const register_keyboard: ReplyKeyboardMarkup = {
    keyboard: [
      [
        {
          text: "Поделиться контактом",
          request_contact: true,
        },
      ],
    ],
  };

  bot.sendMessage(chatId, "Поделиться контактом", {
    reply_markup: register_keyboard,
  });
  await bot.on("contact", (msgContact) => {
    const language = userState[chatId]?.language || "ru";
    const userId = msgContact.contact.user_id;
    const phone_number = msgContact.contact.phone_number;
    bot.sendMessage(chatId, "Отправьте свое ФИО");
    bot.once("message", async (msg) => {
      const fullName = msg.text;
      const departmentOptions = departments.map((dept) => ({
        text: dept[language as keyof Department],
      }));
      await bot.sendMessage(chatId, "send your department", {
        reply_markup: {
          keyboard: departmentOptions.map((dept) => [dept]),
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });

      bot.once("message", async (msg) => {
        const department = msg.text;
        const executor = new Executor({
          fullName: fullName,
          chatId: msg.chat.id,
          userId: userId,
          department: department,
          phoneNumber: phone_number,
          assignedReports: null,
        });
        const save = await executor.save();
        if (save) {
          bot.sendMessage(chatId, "вы зарегестрировались успешно");
        }
      });
    });
  });
}

bot.onText(/\/admin/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Отправьте пароль для того что бы войти в админ панель"
  );
  bot.once("message", async (msg) => {
    if (msg.text === process.env.ADMIN_PASSWORD) {
      const admin = new Admin({
        chat_id: msg.chat.id,
        fullname: msg.chat.username,
      });
      await admin.save();
      adminPanel = true;
      const inline_keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: "настроить гугл таблицы", callback_data: "googleSheet" }],
        ],
      };
      bot.sendMessage(msg.chat.id, "Вы вошли в админ панель", {
        reply_markup: inline_keyboard,
      });
    } else {
      bot.sendMessage(msg.chat.id, "Неверный пароль");
    }
  });
});

bot.onText(/\/executor/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Отправьте пароль для того что бы войти в панель управляющего"
  );
  bot.once("message", async (msg) => {
    console.log(msg.text, typeof msg.text);
    if (msg.text === process.env.EXECUTOR_PASSWORD) {
      executorPanel = true;
      const inline_keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: "Зарегестрироваться", callback_data: "executorRegister" }],
        ],
      };
      bot.sendMessage(msg.chat.id, "Вы вошли в панель исполняющего", {
        reply_markup: inline_keyboard,
      });
    } else {
      bot.sendMessage(msg.chat.id, "Неверный пароль");
    }
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  switch (query.data) {
    case "register":
      await handleRegister(chatId);
      break;
    case "report":
      await handleReport(chatId);
      break;
    case "language":
      await handleLanguage(chatId);
      break;
    case "googleSheet":
      if (!adminPanel) {
        await bot.sendMessage(chatId, "Вам не дозволенно делать это");
      }
      await handleGoogleSheetId(chatId);
      break;
    case "executorRegister":
      if (!executorPanel) {
        bot.sendMessage(chatId, "Вам не позволена данная операция");
      }
      await handleRegisterExecutor(chatId);
  }

  await bot.answerCallbackQuery(query.id);
});

console.log("Bot is running...");
