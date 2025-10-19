export interface Client {
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
  userId: string; // Para associar ao usuário logado
}

export interface ClientFormData {
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

export interface Purchase {
  id: string;
  clientId: string;
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
}