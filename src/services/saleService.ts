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
import { auth, db } from '../config/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Installment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pendente' | 'pago' | 'atrasado';
}

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  products: Product[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number;
  remainingAmount: number;
  isLoan: boolean;
  loanAmount?: number;
  installments?: Installment[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  notes?: string;
}

interface SaleFormData {
  clientId?: string;
  clientName?: string;
  products: Product[];
  discount: number;
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paidAmount: number;
  isLoan: boolean;
  loanAmount?: number;
  installmentCount?: number;
  notes?: string;
}

interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: 'dinheiro' | 'pix';
  date: Date;
  notes?: string;
}

const SALES_COLLECTION = 'sales';
const PAYMENTS_COLLECTION = 'payments';

export const saleService = {
  // Criar venda
  async createSale(saleData: SaleFormData, userId: string): Promise<string> {
    try {
      console.log('🔥 SERVIÇO: Iniciando criação de venda');
      console.log('📊 SERVIÇO: Dados recebidos:', saleData);
      console.log('👤 SERVIÇO: User ID:', userId);
      
      // Verificar autenticação
      const currentUser = auth.currentUser;
      console.log('🔐 SERVIÇO: Usuário atual do Firebase:', currentUser?.email);
      console.log('🔑 SERVIÇO: UID atual do Firebase:', currentUser?.uid);
      console.log('✅ SERVIÇO: UIDs coincidem?', currentUser?.uid === userId);
      const subtotal = saleData.products.reduce((sum, product) => 
        sum + (product.price * product.quantity), 0
      );
      
      const total = subtotal - saleData.discount + (saleData.loanAmount || 0);
      const remainingAmount = total - saleData.paidAmount;
      
      // Criar parcelas se for fiado
      let installments: Installment[] = [];
      if (saleData.paymentMethod === 'fiado' && saleData.installmentCount && saleData.installmentCount > 1) {
        const installmentAmount = remainingAmount / saleData.installmentCount;
        const today = new Date();
        
        for (let i = 0; i < saleData.installmentCount; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(today.getMonth() + i + 1);
          
          installments.push({
            id: `installment_${i + 1}`,
            amount: installmentAmount,
            dueDate,
            status: 'pendente'
          });
        }
      }

      const sale: Omit<Sale, 'id'> = {
        ...saleData,
        subtotal,
        total,
        remainingAmount,
        paymentStatus: remainingAmount <= 0 ? 'pago' : (saleData.paidAmount > 0 ? 'parcial' : 'pendente'),
        installments,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 SERVIÇO: Salvando no Firebase...');
      
      const documentData = {
        ...sale,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        installments: installments.map(inst => ({
          ...inst,
          dueDate: Timestamp.fromDate(inst.dueDate),
          paidDate: inst.paidDate ? Timestamp.fromDate(inst.paidDate) : null
        }))
      };
      
      console.log('📄 SERVIÇO: Dados que serão salvos:', documentData);
      console.log('🔑 SERVIÇO: userId no documento:', documentData.userId);
      
      const docRef = await addDoc(collection(db, SALES_COLLECTION), documentData);
      
      console.log('✅ SERVIÇO: Venda salva com ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('💥 SERVIÇO: Erro ao criar venda:', error);
      console.error('🔥 SERVIÇO: Código do erro:', error.code);
      console.error('📝 SERVIÇO: Mensagem do erro:', error.message);
      console.error('📋 SERVIÇO: Stack trace:', error.stack);
      
      // Verificar se é erro de permissão
      if (error.code === 'permission-denied') {
        console.error('🚫 SERVIÇO: ERRO DE PERMISSÃO - Verifique as regras do Firestore');
        console.error('👤 SERVIÇO: Usuário atual:', auth.currentUser?.email);
        console.error('🔑 SERVIÇO: UID atual:', auth.currentUser?.uid);
      }
      
      throw error;
    }
  },

  // Listar vendas do usuário (sem orderBy para evitar problemas de índice)
  async getSales(userId: string): Promise<Sale[]> {
    try {
      console.log('🔍 SERVIÇO: Buscando vendas para usuário:', userId);
      const q = query(
        collection(db, SALES_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const sales: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 SERVIÇO: Documento encontrado:', doc.id, data);
        sales.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          installments: data.installments?.map((inst: any) => ({
            ...inst,
            dueDate: inst.dueDate?.toDate() || new Date(),
            paidDate: inst.paidDate ? inst.paidDate.toDate() : undefined
          })) || []
        } as Sale);
      });
      
      console.log(`✅ SERVIÇO: ${sales.length} vendas encontradas`);
      // Ordenar no cliente para evitar problemas de índice
      return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('💥 SERVIÇO: Erro ao buscar vendas:', error);
      console.error('📋 SERVIÇO: Stack trace:', (error as Error).stack);
      throw error;
    }
  },

  // Adicionar pagamento parcial
  async addPayment(saleId: string, amount: number, method: 'dinheiro' | 'pix', notes?: string): Promise<void> {
    try {
      // Registrar pagamento
      await addDoc(collection(db, PAYMENTS_COLLECTION), {
        saleId,
        amount,
        method,
        notes: notes || '',
        date: Timestamp.now()
      });

      // Atualizar venda (isso seria feito em uma função separada que busca a venda atual)
      // Por simplicidade, vamos assumir que isso será tratado na interface
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      throw error;
    }
  },

  // Atualizar status de pagamento da venda
  async updateSalePayment(saleId: string, paidAmount: number): Promise<void> {
    try {
      const saleRef = doc(db, SALES_COLLECTION, saleId);
      
      // Buscar venda atual para calcular novo status
      // Por simplicidade, vamos passar os valores calculados
      await updateDoc(saleRef, {
        paidAmount,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  },

  // Deletar venda
  async deleteSale(saleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SALES_COLLECTION, saleId));
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      throw error;
    }
  },

  // Buscar pagamentos de uma venda (sem orderBy para evitar problemas de índice)
  async getPayments(saleId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('saleId', '==', saleId)
      );
      
      const querySnapshot = await getDocs(q);
      const payments: Payment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date()
        } as Payment);
      });
      
      // Ordenar no cliente para evitar problemas de índice
      return payments.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      throw error;
    }
  }
};