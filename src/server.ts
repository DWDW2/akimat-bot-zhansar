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

