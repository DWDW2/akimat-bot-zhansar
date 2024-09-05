import TelegramBot from "node-telegram-bot-api";
import uploadFile from "./upload";
import { db } from "./db";
import { NewUser, users } from "./db/shema";
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

console.log('Bot is running...');