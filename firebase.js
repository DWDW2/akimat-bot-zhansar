import admin from 'firebase-admin';
import serviceAccount from './akimat-bot-firebase-adminsdk-kf13w-832bf9a3d6.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://akimat-bot.appspot.com"
});


const bucket = admin.storage().bucket();

export default bucket;