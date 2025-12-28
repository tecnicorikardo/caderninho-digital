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

export interface PersonalTransaction {
  id: string;
  userId: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
  isRecurring: boolean;
  recurringFrequency?: 'mensal' | 'semanal' | 'anual';
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalCategory {
  id: string;
  userId: string;
  name: string;
  type: 'receita' | 'despesa';
  icon: string;
  color: string;
  createdAt: Date;
}

const TRANSACTIONS_COLLECTION = 'personal_transactions';
const CATEGORIES_COLLECTION = 'personal_categories';

// Categorias padrão
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentação', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { name: 'Moradia', icon: '🏠', color: '#45B7D1' },
  { name: 'Saúde', icon: '⚕️', color: '#96CEB4' },
  { name: 'Educação', icon: '📚', color: '#FFEAA7' },
  { name: 'Lazer', icon: '🎮', color: '#DFE6E9' },
  { name: 'Vestuário', icon: '👕', color: '#A29BFE' },
  { name: 'Contas', icon: '📄', color: '#FD79A8' },
  { name: 'Outros', icon: '📦', color: '#B2BEC3' }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salário', icon: '💰', color: '#00B894' },
  { name: 'Freelance', icon: '💼', color: '#00CEC9' },
  { name: 'Investimentos', icon: '📈', color: '#6C5CE7' },
  { name: 'Outros', icon: '💵', color: '#FDCB6E' }
];

export const personalFinanceService = {
  // ========== TRANSAÇÕES ==========

  async createTransaction(data: Omit<PersonalTransaction, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...data,
        userId,
        amount: Number(data.amount),
        date: Timestamp.fromDate(data.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Transação pessoal criada:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar transação pessoal:', error);
      throw error;
    }
  },

  async getTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<PersonalTransaction[]> {
    try {
      // Remover orderBy temporariamente enquanto o índice é construído
      let q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      let transactions: PersonalTransaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PersonalTransaction);
      });

      // Ordenar no cliente
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Filtrar por data no cliente se necessário
      if (startDate || endDate) {
        transactions = transactions.filter(t => {
          const transDate = t.date;
          if (startDate && transDate < startDate) return false;
          if (endDate && transDate > endDate) return false;
          return true;
        });
      }

      console.log(`✅ ${transactions.length} transações pessoais carregadas`);
      return transactions;
    } catch (error) {
      console.error('❌ Erro ao buscar transações pessoais:', error);
      throw error;
    }
  },

  async updateTransaction(transactionId: string, data: Partial<PersonalTransaction>): Promise<void> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
      }

      await updateDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId), updateData);
      console.log('✅ Transação pessoal atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar transação pessoal:', error);
      throw error;
    }
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId));
      console.log('✅ Transação pessoal deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar transação pessoal:', error);
      throw error;
    }
  },

  // ========== CATEGORIAS ==========

  async createCategory(data: Omit<PersonalCategory, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...data,
        userId,
        createdAt: Timestamp.now()
      });

      console.log('✅ Categoria pessoal criada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar categoria pessoal:', error);
      throw error;
    }
  },

  async getCategories(userId: string, type?: 'receita' | 'despesa'): Promise<PersonalCategory[]> {
    try {
      let q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      const categories: PersonalCategory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as PersonalCategory);
      });

      console.log(`✅ ${categories.length} categorias pessoais carregadas`);
      return categories;
    } catch (error) {
      console.error('❌ Erro ao buscar categorias pessoais:', error);
      throw error;
    }
  },

  async updateCategory(categoryId: string, data: Partial<PersonalCategory>): Promise<void> {
    try {
      await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), data);
      console.log('✅ Categoria atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      throw error;
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
      console.log('✅ Categoria deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar categoria:', error);
      throw error;
    }
  },

  async initializeDefaultCategories(userId: string): Promise<void> {
    try {
      console.log('🔍 Verificando categorias existentes para:', userId);
      // Verificar se já tem categorias
      const existing = await this.getCategories(userId);
      console.log('📊 Categorias existentes:', existing.length);

      if (existing.length > 0) {
        console.log('ℹ️ Usuário já tem categorias, pulando inicialização');
        return;
      }

      console.log('🆕 Criando categorias padrão...');

      // Criar categorias de despesa
      for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
        console.log('➕ Criando categoria de despesa:', cat.name);
        await addDoc(collection(db, CATEGORIES_COLLECTION), {
          ...cat,
          type: 'despesa',
          userId,
          createdAt: Timestamp.now()
        });
      }

      // Criar categorias de receita
      for (const cat of DEFAULT_INCOME_CATEGORIES) {
        console.log('➕ Criando categoria de receita:', cat.name);
        await addDoc(collection(db, CATEGORIES_COLLECTION), {
          ...cat,
          type: 'receita',
          userId,
          createdAt: Timestamp.now()
        });
      }

      console.log('✅ Categorias padrão criadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar categorias padrão:', error);
      throw error;
    }
  },

  // ========== VERIFICAÇÕES E ALERTAS ==========

  async checkMonthlyExpenses(userId: string): Promise<void> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      await this.getMonthlyReport(userId, currentYear, currentMonth);

      // Código de notificações removido
    } catch (error) {
      console.error('Erro ao verificar gastos mensais:', error);
    }
  },

  // ========== RELATÓRIOS ==========

  async getMonthlyReport(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.getTransactions(userId, startDate, endDate);

    const totalReceitas = transactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = transactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);

    const saldo = totalReceitas - totalDespesas;

    // Despesas por categoria
    const despesasPorCategoria: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'despesa')
      .forEach(t => {
        despesasPorCategoria[t.category] = (despesasPorCategoria[t.category] || 0) + t.amount;
      });

    // Receitas por categoria
    const receitasPorCategoria: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'receita')
      .forEach(t => {
        receitasPorCategoria[t.category] = (receitasPorCategoria[t.category] || 0) + t.amount;
      });

    // Código de notificações removido

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      despesasPorCategoria,
      receitasPorCategoria,
      transactions
    };
  }
};
