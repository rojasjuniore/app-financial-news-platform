import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveAuthToken, clearAuthToken } from '../news/api';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Login con email/password
  login: async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Use the centralized saveAuthToken function
    await saveAuthToken();
    console.log('✅ User logged in:', result.user.email);
    return result.user;
  },

  // Registro
  register: async (email: string, password: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Use the centralized saveAuthToken function
    await saveAuthToken();
    console.log('✅ User registered:', result.user.email);
    return result.user;
  },

  // Login con Google
  loginWithGoogle: async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    // Use the centralized saveAuthToken function
    await saveAuthToken();
    console.log('✅ User logged in with Google:', result.user.email);
    return result.user;
  },

  // Logout
  logout: async () => {
    // Use the centralized clearAuthToken function
    clearAuthToken();
    console.log('👋 User logged out');
    return signOut(auth);
  },

  // Observer
  onAuthChange: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update token using centralized function
        try {
          await saveAuthToken();
          console.log('🔄 Auth state changed - token refreshed for:', user.email);
        } catch (error) {
          console.error('Error refreshing auth token:', error);
        }
      } else {
        // Clear token when user logs out
        clearAuthToken();
        console.log('🔄 Auth state changed - user logged out');
      }
      callback(user);
    }),

  // Usuario actual
  getCurrentUser: () => auth.currentUser,

  // Obtener token
  getToken: async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
};