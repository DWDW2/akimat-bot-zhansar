import { initializeApp } from "firebase/app";
import config from "./config";
const firebase = initializeApp(config.firebaseConfig);

export default firebase