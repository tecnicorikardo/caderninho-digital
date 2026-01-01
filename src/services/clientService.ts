import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const COLLECTION_NAME = 'clients';

export const clientService = {
  // Criar cliente
  async createClient(clientData: ClientFormData, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...clientData,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Cliente criado:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  },

  // Buscar cliente por ID
  async getClientById(clientId: string): Promise<Client | null> {
    try {
      const clientRef = doc(db, COLLECTION_NAME, clientId);
      const clientSnap = await getDoc(clientRef);

      if (clientSnap.exists()) {
        const data = clientSnap.data();
        return {
          id: clientSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Client;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  },

  // Listar clientes do usuário (sem orderBy para evitar problemas de índice)
  async getClients(userId: string): Promise<Client[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Client);
      });

      // Ordenar no cliente para evitar problemas de índice
      return clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  },

  // Atualizar cliente
  async updateClient(clientId: string, clientData: ClientFormData): Promise<void> {
    try {
      const clientRef = doc(db, COLLECTION_NAME, clientId);
      await updateDoc(clientRef, {
        ...clientData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  // Deletar cliente
  async deleteClient(clientId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, clientId));
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  }
};