import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData?.role === 'admin' || userData?.role === 'superadmin';
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

export async function getUserRole(userId: string): Promise<'user' | 'admin' | 'superadmin'> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 'user';
    
    const userData = userDoc.data();
    return userData?.role || 'user';
  } catch (error) {
    console.error('Erro ao buscar role:', error);
    return 'user';
  }
}
