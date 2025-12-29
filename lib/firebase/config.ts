import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfg2JHDaW56tKhzSffboJ2c19N5sOUS1Q",
    authDomain: "dashbort-2b417.firebaseapp.com",
    projectId: "dashbort-2b417",
    storageBucket: "dashbort-2b417.firebasestorage.app",
    messagingSenderId: "863504809694",
    appId: "1:863504809694:web:52170b496119bc2aa94c4f",
    measurementId: "G-S94BCFJZ51",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics only in browser environment
export const analytics: Analytics | null =
    typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;

