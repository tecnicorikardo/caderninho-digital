export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  clientId?: string; // Opcional - venda pode ser sem cliente
  clientName?: string; // Nome do cliente se não tiver ID
  products: Product[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'dinheiro' | 'pix' | 'fiado';
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number; // Valor já pago
  remainingAmount: number; // Valor restante
  isLoan: boolean; // Se é empréstimo
  loanAmount?: number; // Valor do empréstimo
  installments?: Installment[]; // Parcelas
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  notes?: string;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pendente' | 'pago' | 'atrasado';
}

export interface SaleFormData {
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

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: 'dinheiro' | 'pix';
  date: Date;
  notes?: string;
}