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

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
  createdAt: Date;
  // Campos opcionais
  previousQuantity?: number;
  newQuantity?: number;
  costPrice?: number;
  totalCost?: number;
}

interface StockMovementFormData {
  productId: string;
  productName?: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  previousQuantity?: number;
  newQuantity?: number;
  costPrice?: number;
}

const COLLECTION_NAME = 'stock_movements';

export const stockMovementService = {
  // Criar movimentação
  async createMovement(movementData: StockMovementFormData, userId: string): Promise<string> {
    try {
      const totalCost = movementData.costPrice 
        ? movementData.costPrice * movementData.quantity 
        : undefined;

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...movementData,
        totalCost,
        userId,
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      console.log('✅ Movimentação criada no Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar movimentação:', error);
      throw error;
    }
  },

  // Listar movimentações do usuário
  async getMovements(userId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const movements: StockMovement[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        movements.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as StockMovement);
      });
      
      console.log(`✅ ${movements.length} movimentações carregadas do Firebase`);
      return movements;
    } catch (error) {
      console.error('❌ Erro ao buscar movimentações:', error);
      throw error;
    }
  },

  // Buscar movimentações por produto
  async getMovementsByProduct(userId: string, productId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('productId', '==', productId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const movements: StockMovement[]= [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        movements.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as StockMovement);
      });
      
      return movements;
    } catch (error) {
      console.error('❌ Erro ao buscar movimentações por produto:', error);
      throw error;
    }
  },

  // Buscar movimentações por tipo
  async getMovementsByType(userId: string, type: 'entrada' | 'saida' | 'ajuste'): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const movements: StockMovement[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        movements.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as StockMovement);
      });
      
      return movements;
    } catch (error) {
      console.error('❌ Erro ao buscar movimentações por tipo:', error);
      throw error;
    }
  },

  // Migrar dados do localStorage para Firebase
  async migrateFromLocalStorage(userId: string): Promise<number> {
    try {
      const localData = localStorage.getItem(`stock_movements_${userId}`);
      if (!localData) {
        console.log('ℹ️ Nenhum dado para migrar do localStorage');
        return 0;
      }

      const movements = JSON.parse(localData);
      let migratedCount = 0;

      for (const movement of movements) {
        try {
          await addDoc(collection(db, COLLECTION_NAME), {
            ...movement,
            date: new Date(movement.date),
            createdAt: Timestamp.now(),
            userId
          });
          migratedCount++;
        } catch (error) {
          console.error('Erro ao migrar movimentação individual:', error);
        }
      }

      console.log(`✅ ${migratedCount} movimentações migradas do localStorage para Firebase`);
      return migratedCount;
    } catch (error) {
      console.error('❌ Erro ao migrar movimentações:', error);
      throw error;
    }
  }
};
