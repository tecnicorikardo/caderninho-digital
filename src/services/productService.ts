import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  category: string;
  supplier: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  category: string;
  supplier: string;
}

const COLLECTION_NAME = 'products';

export const productService = {
  // Criar produto
  async createProduct(productData: ProductFormData, userId: string): Promise<string> {
    try {
      const quantity = Number(productData.quantity) || 0;
      const minQuantity = Number(productData.minQuantity) || 0;

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...productData,
        costPrice: Number(productData.costPrice) || 0,
        salePrice: Number(productData.salePrice) || 0,
        quantity,
        minQuantity,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Produto criado no Firebase:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      throw error;
    }
  },

  // Listar produtos do usuário
  async getProducts(userId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Product);
      });

      console.log(`✅ ${products.length} produtos carregados do Firebase`);
      // Ordenação feita em memória para evitar erros de índice composto no Firestore
      return products.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      throw error;
    }
  },

  // Buscar produto por ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { getDoc } = await import('firebase/firestore');
      const productDoc = await getDoc(doc(db, COLLECTION_NAME, productId));

      if (!productDoc.exists()) {
        return null;
      }

      const data = productDoc.data();
      return {
        id: productDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Product;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      throw error;
    }
  },

  // Atualizar produto
  async updateProduct(productId: string, productData: Partial<ProductFormData>, _userId: string): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);

      const updateData: any = {
        ...productData,
        updatedAt: Timestamp.now()
      };

      // Garantir que valores numéricos sejam números
      if (productData.costPrice !== undefined) {
        updateData.costPrice = Number(productData.costPrice) || 0;
      }
      if (productData.salePrice !== undefined) {
        updateData.salePrice = Number(productData.salePrice) || 0;
      }
      if (productData.quantity !== undefined) {
        updateData.quantity = Number(productData.quantity) || 0;
      }
      if (productData.minQuantity !== undefined) {
        updateData.minQuantity = Number(productData.minQuantity) || 0;
      }

      await updateDoc(productRef, updateData);
      console.log('✅ Produto atualizado no Firebase:', productId);
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Deletar produto
  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, productId));
      console.log('✅ Produto deletado do Firebase:', productId);
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  },

  // Buscar produtos com estoque baixo
  async getLowStockProducts(userId: string): Promise<Product[]> {
    try {
      const products = await this.getProducts(userId);
      return products.filter(product => product.quantity <= product.minQuantity);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos com estoque baixo:', error);
      throw error;
    }
  },

  // Buscar produtos por categoria
  async getProductsByCategory(userId: string, category: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('category', '==', category)
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Product);
      });

      return products.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('❌ Erro ao buscar produtos por categoria:', error);
      throw error;
    }
  },

  // Atualizar quantidade do produto
  async updateQuantity(productId: string, newQuantity: number): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      await updateDoc(productRef, {
        quantity: Math.max(0, Number(newQuantity)),
        updatedAt: Timestamp.now()
      });
      console.log('✅ Quantidade atualizada no Firebase:', productId);
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      throw error;
    }
  },

  // Migrar dados do localStorage para Firebase
  async migrateFromLocalStorage(userId: string): Promise<number> {
    try {
      const localData = localStorage.getItem(`products_${userId}`);
      if (!localData) {
        console.log('ℹ️ Nenhum produto para migrar do localStorage');
        return 0;
      }

      const products = JSON.parse(localData);
      let migratedCount = 0;

      for (const product of products) {
        try {
          // Verificar se já existe no Firebase (evitar duplicatas)
          const existingQuery = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('name', '==', product.name),
            where('sku', '==', product.sku || '')
          );

          const existingDocs = await getDocs(existingQuery);

          if (existingDocs.empty) {
            await addDoc(collection(db, COLLECTION_NAME), {
              name: product.name,
              description: product.description || '',
              sku: product.sku || '',
              costPrice: Number(product.costPrice) || 0,
              salePrice: Number(product.salePrice) || 0,
              quantity: Number(product.quantity) || 0,
              minQuantity: Number(product.minQuantity) || 5,
              category: product.category || '',
              supplier: product.supplier || '',
              userId,
              createdAt: product.createdAt ? new Date(product.createdAt) : Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            migratedCount++;
          }
        } catch (error) {
          console.error('Erro ao migrar produto individual:', error);
        }
      }

      console.log(`✅ ${migratedCount} produtos migrados do localStorage para Firebase`);
      return migratedCount;
    } catch (error) {
      console.error('❌ Erro ao migrar produtos:', error);
      throw error;
    }
  },

  // Calcular valor total do estoque
  async getTotalStockValue(userId: string): Promise<number> {
    try {
      const products = await this.getProducts(userId);
      return products.reduce((total, product) => {
        return total + (product.quantity * product.costPrice);
      }, 0);
    } catch (error) {
      console.error('❌ Erro ao calcular valor do estoque:', error);
      return 0;
    }
  }
};
