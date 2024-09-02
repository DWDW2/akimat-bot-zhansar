// import admin from 'firebase-admin';
// import serviceAccount from './akimat-bot-firebase-adminsdk-kf13w-832bf9a3d6.json' assert { type: 'json' };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "gs://akimat-bot.appspot.com"
// });


// const bucket = admin.storage().bucket();
// const firestore = admin.firestore();
// export {bucket, firestore};

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import serviceAccount from './akimat-bot-firebase-adminsdk-kf13w-832bf9a3d6.json' assert {type: 'json'}
const firebase = initializeApp({
  credential: cert(serviceAccount),
  storageBucket:  "gs://akimat-bot.appspot.com",
})

const db = getFirestore(); 
const bucket = getStorage(firebase).bucket()

export {db, bucket}
