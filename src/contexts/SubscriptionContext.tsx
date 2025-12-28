import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    transactions: number;
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

interface UsageData {
  salesCount: number;
  clientsCount: number;
  productsCount: number;
  transactionsCount: number;
  lastReset: Date;
}

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  isActive: boolean;
  daysRemaining: number;
  usage: UsageData | null;
  canCreateSale: boolean;
  canCreateClient: boolean;
  canCreateProduct: boolean;
  canCreateTransaction: boolean;
  upgradeToPremium: () => void;
  refreshSubscription: () => Promise<void>;
  createExpiredTestUser: () => Promise<void>;
  activatePremiumSubscription: (amountPaid?: number) => Promise<void>;
  incrementUsage: (type: 'sale' | 'client' | 'product' | 'transaction') => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Planos disponíveis
const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: [
      '2 meses gratuitos',
      'Até 50 vendas',
      'Até 50 clientes',
      'Até 50 produtos',
      'Até 50 transações',
      'Relatórios básicos',
      'Suporte por email'
    ],
    limits: {
      sales: 50,
      clients: 50,
      products: 50,
      transactions: 50
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
      'Transações ilimitadas',
      'Relatórios avançados',
      'Backup automático',
      'Suporte prioritário',
      'API para integrações',
      'Sem anúncios'
    ],
    limits: {
      sales: -1, // ilimitado
      clients: -1,
      products: -1,
      transactions: -1
    }
  }
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      console.log('📊 Carregando assinatura para usuário:', user.uid);
      
      // Carregar dados da assinatura
      const subDoc = await getDoc(doc(db, 'subscriptions', user.uid));
      
      if (subDoc.exists()) {
        const data = subDoc.data();
        console.log('✅ Assinatura encontrada:', data);
        
        let subscriptionData = {
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          lastPayment: data.lastPayment?.toDate()
        } as UserSubscription;
        
        // 🔄 MIGRAÇÃO: Verificar se é assinatura antiga (mais de 3 meses)
        const now = new Date();
        const daysRemaining = Math.ceil((subscriptionData.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('🔍 Verificando migração:', {
          plan: subscriptionData.plan,
          daysRemaining,
          endDate: subscriptionData.endDate.toLocaleDateString('pt-BR'),
          needsMigration: subscriptionData.plan === 'free' && daysRemaining > 90,
          alreadyMigrated: data.migrated
        });
        
        // Se tem mais de 90 dias restantes, é plano free e ainda não foi migrado
        if (subscriptionData.plan === 'free' && daysRemaining > 90 && !data.migrated) {
          console.log('🔄 Detectada assinatura antiga com', daysRemaining, 'dias. Migrando para novo formato...');
          
          // Criar nova assinatura com 2 meses a partir de agora
          const newEndDate = new Date();
          newEndDate.setMonth(newEndDate.getMonth() + 2);
          
          subscriptionData = {
            ...subscriptionData,
            startDate: now,
            endDate: newEndDate,
            status: 'trial' // Garantir que o status seja correto
          };
          
          // Atualizar no Firebase - remover campos undefined
          const updateData = {
            plan: subscriptionData.plan,
            status: subscriptionData.status,
            startDate: now,
            endDate: newEndDate,
            trialUsed: subscriptionData.trialUsed || true,
            migrated: true,
            migratedAt: now
          };
          
          // Só adicionar lastPayment se existir
          if (subscriptionData.lastPayment) {
            updateData.lastPayment = subscriptionData.lastPayment;
          }
          
          // Só adicionar paymentMethod se existir
          if (subscriptionData.paymentMethod) {
            updateData.paymentMethod = subscriptionData.paymentMethod;
          }
          
          await setDoc(doc(db, 'subscriptions', user.uid), updateData);
          
          console.log('✅ Assinatura migrada para novo formato:', subscriptionData);
          toast.success('🔄 Sua assinatura foi atualizada para o novo formato: 2 meses gratuitos!');
        }
        
        console.log('📅 Data de expiração:', subscriptionData.endDate.toLocaleDateString('pt-BR'));
        console.log('📊 Status:', subscriptionData.status);
        console.log('💎 Plano:', subscriptionData.plan);
        
        setSubscription(subscriptionData);
      } else {
        console.log('🆕 Nenhuma assinatura encontrada. Criando assinatura gratuita...');
        // Criar assinatura gratuita para novo usuário
        await createFreeSubscription();
      }

      // Carregar dados de uso
      await loadUsage();

    } catch (error) {
      console.error('❌ Erro ao carregar assinatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    if (!user) return;

    try {
      const usageDoc = await getDoc(doc(db, 'usage', user.uid));
      
      if (usageDoc.exists()) {
        const data = usageDoc.data();
        let usageData = {
          ...data,
          lastReset: data.lastReset?.toDate() || new Date()
        } as UsageData;
        
        // 🔄 MIGRAÇÃO: Adicionar campo transactionsCount se não existir
        if (typeof usageData.transactionsCount === 'undefined') {
          console.log('🔄 Adicionando campo transactionsCount aos dados de uso...');
          usageData.transactionsCount = 0;
          
          // Atualizar no Firebase
          await setDoc(doc(db, 'usage', user.uid), {
            ...usageData,
            lastReset: usageData.lastReset
          });
        }
        
        setUsage(usageData);
      } else {
        // Criar dados de uso inicial
        const initialUsage: UsageData = {
          salesCount: 0,
          clientsCount: 0,
          productsCount: 0,
          transactionsCount: 0,
          lastReset: new Date()
        };
        
        await setDoc(doc(db, 'usage', user.uid), {
          ...initialUsage,
          lastReset: initialUsage.lastReset
        });
        
        setUsage(initialUsage);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de uso:', error);
    }
  };

  const createFreeSubscription = async () => {
    if (!user) return;

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2); // 2 meses grátis

    const newSubscription = {
      plan: 'free',
      status: 'trial',
      startDate: now,
      endDate: endDate,
      trialUsed: true
    };

    await setDoc(doc(db, 'subscriptions', user.uid), newSubscription);

    setSubscription(newSubscription as UserSubscription);
    
    toast.success('🎉 Bem-vindo! Você tem 2 meses gratuitos para testar todas as funcionalidades!');
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const upgradeToPremium = () => {
    // Redirecionar para página de pagamento na mesma aba
    window.location.href = '/upgrade';
  };

  // Função para criar usuário teste com conta expirada
  const createExpiredTestUser = async () => {
    if (!user) return;

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30); // Expirou há 30 dias

    const testSubscription: UserSubscription = {
      plan: 'free',
      status: 'expired',
      startDate: new Date(expiredDate.getTime() - (60 * 24 * 60 * 60 * 1000)), // Começou há 2 meses e 30 dias
      endDate: expiredDate,
      trialUsed: true
    };

    await setDoc(doc(db, 'subscriptions', user.uid), {
      ...testSubscription,
      startDate: testSubscription.startDate,
      endDate: testSubscription.endDate
    });

    setSubscription(testSubscription);
    
    toast.success('🧪 Usuário teste criado com conta expirada há 30 dias!');
  };

  // Função para simular ativação premium após pagamento
  const activatePremiumSubscription = async (amountPaid: number = 20) => {
    if (!user) return;

    const now = new Date();
    let endDate = new Date();
    
    // Calcular dias baseado no valor pago
    let daysToAdd = 0;
    let months = 0;
    let isPromo = false;
    
    if (amountPaid >= 200) {
      // 🎁 Promoção: R$ 200 = 10 meses + 4 grátis = 14 meses
      daysToAdd = 14 * 30; // 420 dias
      months = 14;
      isPromo = true;
    } else {
      // Regra normal: R$ 20 por mês
      months = Math.floor(amountPaid / 20);
      daysToAdd = months * 30;
    }
    
    // Se já tem assinatura ativa, adicionar ao período atual
    if (subscription && subscription.status === 'active' && subscription.endDate > now) {
      endDate = new Date(subscription.endDate);
      endDate.setDate(endDate.getDate() + daysToAdd);
    } else {
      // Novo período
      endDate.setDate(endDate.getDate() + daysToAdd);
    }

    const premiumSubscription = {
      plan: 'premium',
      status: 'active',
      startDate: now,
      endDate: endDate,
      trialUsed: true,
      paymentMethod: 'pix',
      lastPayment: now,
      amountPaid: amountPaid
    };

    await setDoc(doc(db, 'subscriptions', user.uid), premiumSubscription);

    setSubscription(premiumSubscription);
    
    // Mensagem personalizada
    if (isPromo) {
      toast.success('🎉 Promoção! Premium ativado por 14 meses (10 + 4 GRÁTIS)!');
    } else if (months === 1) {
      toast.success('🎉 Premium ativado por 1 mês!');
    } else {
      toast.success(`🎉 Premium ativado por ${months} meses!`);
    }
  };

  // Calcular se a assinatura está ativa
  const isActive = subscription ? 
    (subscription.status === 'active' && new Date() <= subscription.endDate) || 
    (subscription.status === 'trial' && new Date() <= subscription.endDate)
    : false;

  // Calcular dias restantes
  const daysRemaining = subscription ? 
    Math.max(0, Math.ceil((subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificar limites de uso
  const currentPlan = PLANS.find(p => p.id === subscription?.plan) || PLANS[0];
  
  const canCreateSale = !subscription || subscription.plan === 'premium' || 
    (usage ? (currentPlan.limits.sales === -1 || usage.salesCount < currentPlan.limits.sales) : false);
    
  const canCreateClient = !subscription || subscription.plan === 'premium' || 
    (usage ? (currentPlan.limits.clients === -1 || usage.clientsCount < currentPlan.limits.clients) : false);
    
  const canCreateProduct = !subscription || subscription.plan === 'premium' || 
    (usage ? (currentPlan.limits.products === -1 || usage.productsCount < currentPlan.limits.products) : false);

  const canCreateTransaction = !subscription || subscription.plan === 'premium' || 
    (usage ? (currentPlan.limits.transactions === -1 || usage.transactionsCount < currentPlan.limits.transactions) : false);

  const incrementUsage = async (type: 'sale' | 'client' | 'product' | 'transaction') => {
    if (!user || !usage) return;

    try {
      const newUsage = { ...usage };
      
      switch (type) {
        case 'sale':
          newUsage.salesCount += 1;
          break;
        case 'client':
          newUsage.clientsCount += 1;
          break;
        case 'product':
          newUsage.productsCount += 1;
          break;
        case 'transaction':
          newUsage.transactionsCount += 1;
          break;
      }

      await setDoc(doc(db, 'usage', user.uid), {
        ...newUsage,
        lastReset: newUsage.lastReset
      });

      setUsage(newUsage);
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    plans: PLANS,
    loading,
    isActive,
    daysRemaining,
    usage,
    canCreateSale,
    canCreateClient,
    canCreateProduct,
    canCreateTransaction,
    upgradeToPremium,
    refreshSubscription,
    createExpiredTestUser,
    activatePremiumSubscription,
    incrementUsage
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