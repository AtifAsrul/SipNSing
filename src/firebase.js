import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAeVReucq5leR9BYd8-IFMp9F71SWa-ACw",
    authDomain: "sip-n-sing-app.firebaseapp.com",
    projectId: "sip-n-sing-app",
    storageBucket: "sip-n-sing-app.firebasestorage.app",
    messagingSenderId: "511820821556",
    appId: "1:511820821556:web:0aaf96988e925fbd620661",
    measurementId: "G-MG7JK5WPZC"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
