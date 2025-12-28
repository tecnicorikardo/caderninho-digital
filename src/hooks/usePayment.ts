import { useState } from 'react';
import { picpayService } from '../services/picpayService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function usePayment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const generateReferenceId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sub_${user?.uid}_${timestamp}_${random}`;
  };

  const createSubscriptionPayment = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return null;
    }

    setLoading(true);

    try {
      const referenceId = generateReferenceId();
      const value = plan === 'monthly' ? 20.00 : 200.00; // R$ 200 anual (2 meses grátis)

      console.log('💳 Criando pagamento PicPay:', { plan, value, referenceId });

      const payment = await picpayService.createPayment({
        referenceId,
        callbackUrl: `${window.location.origin}/api/picpay/callback`,
        returnUrl: `${window.location.origin}/upgrade/success?ref=${referenceId}`,
        value,
        buyer: {
          firstName: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Cliente',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'PicPay',
          document: '11111111111', // CPF - em produção, coletar do usuário
          email: user.email || 'cliente@email.com',
          phone: '+5511999999999' // Em produção, coletar do usuário
        }
      });

      console.log('✅ Pagamento criado:', payment);
      setPaymentData(payment);
      
      // Salvar dados do pagamento no localStorage para recuperar depois
      localStorage.setItem(`payment_${referenceId}`, JSON.stringify({
        ...payment,
        plan,
        userId: user.uid,
        createdAt: new Date().toISOString()
      }));

      return payment;

    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      toast.error('Erro ao criar pagamento PicPay');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async (referenceId: string) => {
    try {
      console.log('🔍 Verificando status do pagamento:', referenceId);
      const status = await picpayService.checkPaymentStatus(referenceId);
      
      console.log('📊 Status do pagamento:', status);
      return status;
    } catch (error) {
      console.error('❌ Erro ao verificar pagamento:', error);
      return null;
    }
  };

  const cancelPayment = async (referenceId: string) => {
    try {
      console.log('❌ Cancelando pagamento:', referenceId);
      const result = await picpayService.cancelPayment(referenceId);
      
      // Remover dados do localStorage
      localStorage.removeItem(`payment_${referenceId}`);
      
      toast.success('Pagamento cancelado');
      return result;
    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
      toast.error('Erro ao cancelar pagamento');
      return null;
    }
  };

  const simulatePaymentSuccess = (referenceId: string) => {
    // Função para simular sucesso do pagamento em desenvolvimento
    console.log('🎉 Simulando sucesso do pagamento:', referenceId);
    
    const paymentInfo = localStorage.getItem(`payment_${referenceId}`);
    if (paymentInfo) {
      // const payment = JSON.parse(paymentInfo); // Não utilizado no momento
      
      // Simular ativação da assinatura
      toast.success('🎉 Pagamento aprovado! Bem-vindo ao Premium!');
      
      // Aqui seria onde ativamos a assinatura no Firebase
      // Por enquanto, apenas mostrar sucesso
      
      return true;
    }
    
    return false;
  };

  return {
    loading,
    paymentData,
    createSubscriptionPayment,
    checkPayment,
    cancelPayment,
    simulatePaymentSuccess
  };
}