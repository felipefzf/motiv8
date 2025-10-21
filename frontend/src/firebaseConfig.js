// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2Ze4Swenw-IRC1LlvfyCiL1U1hudM3_Y",
  authDomain: "motiv8-b965b.firebaseapp.com",
  projectId: "motiv8-b965b",
  storageBucket: "motiv8-b965b.firebasestorage.app",
  messagingSenderId: "235070149623",
  appId: "1:235070149623:web:a776335b3293808d0ad4f2",
  measurementId: "G-5F7BRCL4CD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Exporta el servicio de Auth