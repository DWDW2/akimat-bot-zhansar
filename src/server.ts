import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot("7385522997:AAGTxQQ5wdYGF2fCVtC0cJo0PZxmkzNh_oE", {
    polling: {
        interval: 300,
        autoStart: true
      }    
})
bot.on("polling_error", (err:any) => console.log(err.data.error.message));
bot.on('text', async (msg:any) => {
    await bot.sendMessage(msg.chat.id, msg.text);
})

const mainMenu = {
    reply_markup: {
        keyboard: [
            ['/start', '/help'],
            ['/info', '/contact'],
            ['/feedback']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = "Welcome to the bot! How can I assist you today?";
    await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
            inline_keyboard: [
                [{text: 'Get Help', callback_data: 'get_help'}],
                [{text: 'Get Information', callback_data: 'get_info'}],
                [{text: 'Provide Feedback', callback_data: 'provide_feedback'}]
            ]
        }
    });
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = "Here are the available commands:\n" +
        "/start - Start the bot\n" +
        "/help - Get help with the bot\n" +
        "/info - Get information about the bot\n" +
        "/contact - Contact the bot owner\n" +
        "/feedback - Provide feedback about the bot\n";
    await bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/info/, async (msg) => {
    const chatId = msg.chat.id;
    const infoMessage = "This bot is designed to help you with your daily tasks.";
    await bot.sendMessage(chatId, infoMessage);
});



