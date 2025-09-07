import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
};

// Validar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '') {
  console.error('Firebase configuration error: Missing API Key');
  console.error('Make sure environment variables are set correctly');
  console.error('Current config:', {
    hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
    hasStorageBucket: !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!process.env.REACT_APP_FIREBASE_APP_ID
  });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;