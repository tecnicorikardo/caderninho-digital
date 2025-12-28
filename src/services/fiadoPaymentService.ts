import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  Timestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FiadoPayment {
  id: string;
  saleId: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  paymentMethod: 'dinheiro' | 'pix';
  date: Date;
  userId: string;
  createdAt: Date;
  notes?: string;
}

interface FiadoPaymentFormData {
  saleId: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  paymentMethod: 'dinheiro' | 'pix';
  notes?: string;
}

const COLLECTION_NAME = 'fiado_payments';

export const fiadoPaymentService = {
  // Criar pagamento
  async createPayment(paymentData: FiadoPaymentFormData, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...paymentData,
        amount: Number(paymentData.amount),
        userId,
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log('✅ Pagamento fiado criado no Firebase:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento fiado:', error);
      throw error;
    }
  },

  // Listar pagamentos do usuário
  async getPayments(userId: string): Promise<FiadoPayment[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments: FiadoPayment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as FiadoPayment);
      });
      
      console.log(`✅ ${payments.length} pagamentos fiados carregados do Firebase`);
      return payments;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos fiados:', error);
      throw error;
    }
  },

  // Buscar pagamentos por venda
  async getPaymentsBySale(userId: string, saleId: string): Promise<FiadoPayment[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('saleId', '==', saleId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments: FiadoPayment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as FiadoPayment);
      });
      
      return payments;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos por venda:', error);
      throw error;
    }
  },

  // Buscar pagamentos por cliente
  async getPaymentsByClient(userId: string, clientId: string): Promise<FiadoPayment[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('clientId', '==', clientId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments: FiadoPayment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as FiadoPayment);
      });
      
      return payments;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos por cliente:', error);
      throw error;
    }
  },

  // Calcular total pago de uma venda
  async getTotalPaidForSale(userId: string, saleId: string): Promise<number> {
    try {
      const payments = await this.getPaymentsBySale(userId, saleId);
      return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
      console.error('❌ Erro ao calcular total pago:', error);
      return 0;
    }
  },

  // Migrar dados do localStorage para Firebase
  async migrateFromLocalStorage(userId: string): Promise<number> {
    try {
      const localData = localStorage.getItem(`fiado_payments_${userId}`);
      if (!localData) {
        console.log('ℹ️ Nenhum dado para migrar do localStorage');
        return 0;
      }

      const payments = JSON.parse(localData);
      let migratedCount = 0;

      for (const payment of payments) {
        try {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...payment,
            date: new Date(payment.date),
            createdAt: payment.createdAt ? new Date(payment.createdAt) : Timestamp.now(),
            userId
          });
          migratedCount++;
        } catch (error) {
          console.error('Erro ao migrar pagamento individual:', error);
        }
      }

      console.log(`✅ ${migratedCount} pagamentos fiados migrados do localStorage para Firebase`);
      return migratedCount;
    } catch (error) {
      console.error('❌ Erro ao migrar pagamentos fiados:', error);
      throw error;
    }
  }
};
