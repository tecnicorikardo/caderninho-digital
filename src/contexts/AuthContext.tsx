import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isAuthenticated = !!user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar se o documento do usuário existe no Firestore
        await ensureUserDocument(user);
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função para garantir que o documento do usuário existe no Firestore
  const ensureUserDocument = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Criar documento do usuário se não existir
        await setDoc(userDocRef, {
          email: user.email,
          role: 'user',
          createdAt: new Date(),
          lastLogin: new Date()
        });
        console.log('✅ Documento do usuário criado no Firestore');
      } else {
        // Atualizar último login
        await setDoc(userDocRef, {
          lastLogin: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar documento do usuário:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer login: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('🆕 Novo usuário criado no Authentication:', email, '| UID:', userCredential.user.uid);
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'user',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      console.log('✅ Documento criado no Firestore para:', email);
      
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error);
      toast.error('Erro ao criar conta: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer logout: ' + error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      signIn, 
      signUp,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}