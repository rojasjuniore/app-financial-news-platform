import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Login con email/password
  login: async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // Registro
  register: async (email: string, password: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // Login con Google
  loginWithGoogle: async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Logout
  logout: () => signOut(auth),

  // Observer
  onAuthChange: (callback: (user: User | null) => void) => 
    onAuthStateChanged(auth, callback),

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