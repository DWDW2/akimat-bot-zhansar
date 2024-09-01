import TelegramBot from "node-telegram-bot-api";
import bucket from "./firebase.js";
import fs from 'fs'
const bot = new TelegramBot("7385522997:AAGTxQQ5wdYGF2fCVtC0cJo0PZxmkzNh_oE", {
    polling: {
        interval: 300,
        autoStart: true
      }    
})


bot.on("polling_error", err => console.log(err.data.error.message));
bot.on('photo', async img => {
    const file = bot.getFileStream(img.photo[img.photo.length-1].file_id);
    const fileName = img.photo[img.photo.length-1].file_id

    const uploadStream = bucket.file(fileName).createWriteStream({
        contentType: 'image/jpeg'
    });
    file.pipe(uploadStream);
    file.on('end', () => {
        console.log('image recieved');
    })
})
bot.on('text', async msg => {
    await bot.sendMessage(msg.chat.id, msg.text);
})