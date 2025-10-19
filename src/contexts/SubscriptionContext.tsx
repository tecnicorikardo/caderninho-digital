import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    sales: number;
    clients: number;
    products: number;
  };
}

interface UserSubscription {
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date;
  trialUsed: boolean;
  paymentMethod?: string;
  lastPayment?: Date;
}

interface UserUsage {
  salesCount: number;
  clientsCount: number;
  productsCount: number;
  lastReset: Date;
}

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  isActive: boolean;
  canCreateSale: boolean;
  canCreateClient: boolean;
  canCreateProduct: boolean;
  daysRemaining: number;
  checkLimits: (type: 'sale' | 'client' | 'product') => boolean;
  upgradeToPremium: () => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Planos disponíveis
const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: [
      '12 meses gratuitos',
      'Até 1000 vendas/mês',
      'Até 500 clientes',
      'Até 200 produtos',
      'Relatórios básicos',
      'Suporte por email'
    ],
    limits: {
      sales: 1000,
      clients: 500,
      products: 200
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 20,
    features: [
      'Vendas ilimitadas',
      'Clientes ilimitados',
      'Produtos ilimitados',
      'Relatórios avançados',
      'Backup automático',
      'Suporte prioritário',
      'API para integrações',
      'Sem anúncios'
    ],
    limits: {
      sales: -1, // ilimitado
      clients: -1,
      products: -1
    }
  }
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Carregar dados da assinatura
      const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));
      
      if (subDoc.exists()) {
        const data = subDoc.data();
        setSubscription({
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          lastPayment: data.lastPayment?.toDate()
        } as UserSubscription);
      } else {
        // Criar assinatura gratuita para novo usuário
        await createFreeSubscription();
      }

      // Carregar dados de uso
      const usageDoc = await getDoc(doc(db, 'usage', user.uid));
      
      if (usageDoc.exists()) {
        const data = usageDoc.data();
        setUsage({
          ...data,
          lastReset: data.lastReset?.toDate() || new Date()
        } as UserUsage);
      } else {
        // Criar dados de uso iniciais
        await createInitialUsage();
      }

    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const createFreeSubscription = async () => {
    if (!user) return;

    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano grátis

    const newSubscription: UserSubscription = {
      plan: 'free',
      status: 'trial',
      startDate: now,
      endDate: endDate,
      trialUsed: true
    };

    await setDoc(doc(db, 'subscriptions', user.uid), {
      ...newSubscription,
      startDate: now,
      endDate: endDate
    });

    setSubscription(newSubscription);
    
    toast.success('🎉 Bem-vindo! Você tem 12 meses gratuitos para testar todas as funcionalidades!');
  };

  const createInitialUsage = async () => {
    if (!user) return;

    const newUsage: UserUsage = {
      salesCount: 0,
      clientsCount: 0,
      productsCount: 0,
      lastReset: new Date()
    };

    await setDoc(doc(db, 'usage', user.uid), {
      ...newUsage,
      lastReset: new Date()
    });

    setUsage(newUsage);
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const checkLimits = (type: 'sale' | 'client' | 'product'): boolean => {
    if (!subscription || !usage) return false;
    
    // Premium não tem limites
    if (subscription.plan === 'premium') return true;
    
    // Verificar se a assinatura está ativa
    if (!isActive) return false;

    const plan = PLANS.find(p => p.id === subscription.plan);
    if (!plan) return false;

    switch (type) {
      case 'sale':
        return plan.limits.sales === -1 || usage.salesCount < plan.limits.sales;
      case 'client':
        return plan.limits.clients === -1 || usage.clientsCount < plan.limits.clients;
      case 'product':
        return plan.limits.products === -1 || usage.productsCount < plan.limits.products;
      default:
        return false;
    }
  };

  const upgradeToPremium = () => {
    // Redirecionar para página de pagamento na mesma aba
    window.location.href = '/upgrade';
  };

  // Calcular se a assinatura está ativa
  const isActive = subscription ? 
    subscription.status === 'active' || 
    (subscription.status === 'trial' && new Date() <= subscription.endDate) 
    : false;

  // Calcular dias restantes
  const daysRemaining = subscription ? 
    Math.max(0, Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificar se pode criar cada tipo de item
  const canCreateSale = checkLimits('sale');
  const canCreateClient = checkLimits('client');
  const canCreateProduct = checkLimits('product');

  const value: SubscriptionContextType = {
    subscription,
    usage,
    plans: PLANS,
    loading,
    isActive,
    canCreateSale,
    canCreateClient,
    canCreateProduct,
    daysRemaining,
    checkLimits,
    upgradeToPremium,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}