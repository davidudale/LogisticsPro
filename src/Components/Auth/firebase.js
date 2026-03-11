import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAbST49HHwBKjDBZpcGq8aUIVuPAixtqP0",
  authDomain: "logisticspro-4a270.firebaseapp.com",
  projectId: "logisticspro-4a270",
  storageBucket: "logisticspro-4a270.firebasestorage.app",
  messagingSenderId: "547448964896",
  appId: "1:547448964896:web:d3a6efc22a27361490b945"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const secondaryApp = getApps().find(({ name }) => name === "secondary-auth")
  || initializeApp(firebaseConfig, "secondary-auth");
const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp);

export { app, auth, secondaryAuth };
