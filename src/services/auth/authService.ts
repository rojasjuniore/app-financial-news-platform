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

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Login con email/password
  login: async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Store the JWT token in localStorage
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    return result.user;
  },

  // Registro
  register: async (email: string, password: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Store the JWT token in localStorage
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    return result.user;
  },

  // Login con Google
  loginWithGoogle: async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    // Store the JWT token in localStorage
    const token = await result.user.getIdToken();
    localStorage.setItem('authToken', token);
    return result.user;
  },

  // Logout
  logout: async () => {
    // Clear the token from localStorage
    localStorage.removeItem('authToken');
    return signOut(auth);
  },

  // Observer
  onAuthChange: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update token in localStorage when auth state changes
        try {
          const token = await user.getIdToken(true); // Force refresh
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Error refreshing auth token:', error);
        }
      } else {
        // Clear token when user logs out
        localStorage.removeItem('authToken');
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