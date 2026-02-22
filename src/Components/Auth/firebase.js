import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSlW6pPC-23ZJmaaZIcBqr1yj-kDCBZfQ",
  authDomain: "logisticpro.firebaseapp.com",
  projectId: "logisticpro",
  storageBucket: "logisticpro.firebasestorage.app",
  messagingSenderId: "466738042816",
  appId: "1:466738042816:web:44f206934392528ec5da25",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
