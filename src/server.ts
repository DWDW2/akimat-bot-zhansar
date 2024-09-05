import TelegramBot from "node-telegram-bot-api";
import uploadFile from "./upload";
import { db } from "./db";
import { NewUser, reports, users } from "./db/shema";
import { eq } from "drizzle-orm";
const bot = new TelegramBot("7385522997:AAGTxQQ5wdYGF2fCVtC0cJo0PZxmkzNh_oE", {
    polling: {
        interval: 300,
        autoStart: true
    }    
});

bot.on("polling_error", (err: any) => console.log(err.data.error.message));

const register = async (userData: NewUser) => {
    try {
        await db.insert(users).values(userData);
        console.log("User registered successfully!");
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

bot.setMyCommands([
    {command: '/start', description: 'Начать работу с ботом / Start working with the bot'},
    {command: '/help', description: '🆘 Как работать с ботом? / How to work with the bot?'},
    {command: '/info', description: 'ℹ️ Информация о боте / Information about the bot'},
    {command: '/feedback', description: '📝 Оставить отзыв / Leave a feedback'}
]); 

let registrationState: { [key: number]: any } = {};

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = bot.getFileStream(msg.photo[msg.photo.length - 1].file_id);
    const photoUrl = await uploadFile('reports', `${chatId}_${Date.now()}.jpg`, photo);
    db.insert(reports).values({
        photoUrls: [photoUrl]
    });
    console.log(photoUrl)
});


bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    const languageKeyboard = {
        reply_markup: {
            keyboard: [
                [{ text: 'Русский' }],
                [{ text: 'Қазақша' }], 
            ],
            one_time_keyboard: true 
        }
    };

    await bot.sendMessage(chatId, "Пожалуйста, выберите язык / Тілді таңдаңыз:", languageKeyboard);
    registrationState[chatId] = { step: 'language' };
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text;

    if (!registrationState[chatId]) {
        return;
    }

    switch (registrationState[chatId].step) {
        case 'language':
            if (text === 'Русский' || text === 'Қазақша') {
                registrationState[chatId].language = text;
                registrationState[chatId].step = 'email';
                const message = text === 'Русский' 
                    ? "Пожалуйста, отправьте свой email:"
                    : "Электрондық поштаңызды жіберіңіз:";
                await bot.sendMessage(chatId, message);
            } else {
                await bot.sendMessage(chatId, "Пожалуйста, выберите язык из предложенных вариантов / Ұсынылған нұсқалардан тілді таңдаңыз.");
            }
            break;
        case 'email':
            registrationState[chatId].email = text;
            registrationState[chatId].step = 'phone';
            const phoneMessage = registrationState[chatId].language === 'Русский'
                ? "Спасибо! Теперь отправьте свой номер телефона:"
                : "Рақмет! Енді телефон нөміріңізді жіберіңіз:";
            await bot.sendMessage(chatId, phoneMessage);
            break;
        case 'phone':
            registrationState[chatId].phone = text;
            registrationState[chatId].step = 'fullName';
            const nameMessage = registrationState[chatId].language === 'Русский'
                ? "Отлично! Наконец, отправьте свое ФИО:"
                : "Жақсы! Соңында, толық аты-жөніңізді жіберіңіз:";
            await bot.sendMessage(chatId, nameMessage);
            break;
        case 'fullName':
            registrationState[chatId].fullName = text;
            
            const userData = {
                firstName: msg.from?.first_name,
                lastName: msg.from?.last_name,
                telegramId: msg.from.id,
                email: registrationState[chatId].email,
                phoneNumber: registrationState[chatId].phone,
                language: registrationState[chatId].language
            };

            try {
                await register(userData);
                const successMessage = registrationState[chatId].language === 'Русский'
                    ? "Регистрация успешно завершена!"
                    : "Тіркеу сәтті аяқталды!";
                await bot.sendMessage(chatId, successMessage);
            } catch (error) {
                const errorMessage = registrationState[chatId].language === 'Русский'
                    ? "Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз."
                    : "Тіркеу кезінде қате пайда болды. Қайталап көріңіз.";
                await bot.sendMessage(chatId, errorMessage);
            }

            delete registrationState[chatId];
            break;
    }
});

const getUserLanguage = async (telegramId: string): Promise<string> => {
    const user = await db.select({ language: users.language })
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);
    
    return user.length > 0 ? user[0].language : 'Русский'; 
};

const messages = {
    'Русский': {
        startReport: "Пожалуйста, опишите проблему:",
        askDepartment: "В какой отдел направить жалобу?",
        askPhotos: "Отправьте фотографии проблемы (если есть) или напишите 'нет':",
        photoReceived: "Фото получено. Отправьте еще или напишите 'готово':",
        askVideo: "Отправьте видео проблемы (если есть) или напишите 'нет':",
        confirmReport: (report: any) => `Подтвердите отправку жалобы:\n
Текст: ${report.reportText}\n
Отдел: ${report.department}\n
Фото: ${report.photoUrls ? report.photoUrls.length : 0}\n
Видео: ${report.videoUrl ? 'Да' : 'Нет'}\n
Отправить? (да/нет)`,
        reportSent: "Жалоба успешно отправлена!",
        reportError: "Произошла ошибка при отправке жалобы. Попробуйте позже.",
        reportCancelled: "Отправка жалобы отменена."
    },
    'Қазақша': {
        startReport: "Мәселені сипаттаңыз:",
        askDepartment: "Шағымды қай бөлімге жіберу керек?",
        askPhotos: "Мәселенің суреттерін жіберіңіз (бар болса) немесе 'жоқ' деп жазыңыз:",
        photoReceived: "Фото алынды. Тағы жіберіңіз немесе 'дайын' деп жазыңыз:",
        askVideo: "Мәселенің бейнесін жіберіңіз (бар болса) немесе 'жоқ' деп жазыңыз:",
        confirmReport: (report: any) => `Шағымды жіберуді растаңыз:\n
Мәтін: ${report.reportText}\n
Бөлім: ${report.department}\n
Фото: ${report.photoUrls ? report.photoUrls.length : 0}\n
Бейне: ${report.videoUrl ? 'Иә' : 'Жоқ'}\n
Жіберу? (иә/жоқ)`,
        reportSent: "Шағым сәтті жіберілді!",
        reportError: "Шағымды жіберу кезінде қате пайда болды. Кейінірек қайталап көріңіз.",
        reportCancelled: "Шағымды жіберу тоқтатылды."
    }
};

let reportState: { [key: number]: any } = {};

bot.onText(/\/report/, async (msg) => {
    const chatId = msg.chat.id;
    const language = await getUserLanguage(msg.from!.id.toString());
    reportState[chatId] = { step: 'reportText', language };
    await bot.sendMessage(chatId, messages[language].startReport);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!reportState[chatId]) return;

    const language = reportState[chatId].language;

    switch (reportState[chatId].step) {
        case 'reportText':
            reportState[chatId].reportText = text;
            reportState[chatId].step = 'department';
            await bot.sendMessage(chatId, messages[language].askDepartment);
            break;

        case 'department':
            reportState[chatId].department = text;
            reportState[chatId].step = 'photoUrls';
            await bot.sendMessage(chatId, messages[language].askPhotos);
            break;

        case 'photoUrls':
            if (msg.photo) {
                if (!reportState[chatId].photoUrls) reportState[chatId].photoUrls = [];
                reportState[chatId].photoUrls.push(msg.photo[msg.photo.length - 1].file_id);
                await bot.sendMessage(chatId, messages[language].photoReceived);
            } else if (text?.toLowerCase() === 'нет' || text?.toLowerCase() === 'жоқ' || text?.toLowerCase() === 'готово' || text?.toLowerCase() === 'дайын') {
                reportState[chatId].step = 'videoUrl';
                await bot.sendMessage(chatId, messages[language].askVideo);
            }
            break;

        case 'videoUrl':
            if (msg.video) {
                reportState[chatId].videoUrl = msg.video.file_id;
            }
            reportState[chatId].step = 'confirm';
            await bot.sendMessage(chatId, messages[language].confirmReport(reportState[chatId]));
            break;

        case 'confirm':
            if (text?.toLowerCase() === 'да' || text?.toLowerCase() === 'иә') {
                try {
                    const user = await db.select().from(users).where(users.telegramId.eq(msg.from!.id.toString())).limit(1);
                    if (user.length === 0) {
                        throw new Error('User not found');
                    }

                    await db.insert(reports).values({
                        reportText: reportState[chatId].reportText,
                        department: reportState[chatId].department,
                        userId: user[0].id,
                        photoUrls: reportState[chatId].photoUrls || [],
                        videoUrl: reportState[chatId].videoUrl || '',
                        dateReport: new Date(),
                        status: 'new'
                    });

                    await bot.sendMessage(chatId, messages[language].reportSent);
                } catch (error) {
                    console.error('Error submitting report:', error);
                    await bot.sendMessage(chatId, messages[language].reportError);
                }
            } else {
                await bot.sendMessage(chatId, messages[language].reportCancelled);
            }
            delete reportState[chatId];
            break;
    }
});


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const language = await getUserLanguage(msg.from!.id.toString());

    const commands = language === 'Русский' ? [
        { command: '/start', description: 'Начать работу с ботом' },
        { command: '/help', description: '🆘 Как работать с ботом?' },
        { command: '/info', description: 'ℹ️ Информация о боте' },
        { command: '/report', description: '📝 Отправить жалобу' },
        { command: '/feedback', description: '📝 Оставить отзыв' }
    ] : [
        { command: '/start', description: 'Ботпен жұмысты бастау' },
        { command: '/help', description: '🆘 Ботпен қалай жұмыс істеу керек?' },
        { command: '/info', description: 'ℹ️ Бот туралы ақпарат' },
        { command: '/report', description: '📝 Шағым жіберу' },
        { command: '/feedback', description: '📝 Пікір қалдыру' }
    ];

    await bot.setMyCommands(commands, { scope: { type: 'chat', chat_id: chatId } });
});

console.log('Bot is running...');