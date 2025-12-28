import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

export function useSubscriptionGuard() {
  const { 
    isActive, 
    canCreateSale, 
    canCreateClient, 
    canCreateProduct, 
    canCreateTransaction,
    subscription,
    usage,
    upgradeToPremium 
  } = useSubscription();

  const checkAndWarn = (type: 'sale' | 'client' | 'product' | 'transaction'): boolean => {
    // Verificar se a assinatura está ativa
    if (!isActive) {
      toast.error('Seu período gratuito expirou! Faça upgrade para continuar.', {
        duration: 5000
      });
      setTimeout(() => {
        upgradeToPremium();
      }, 1000);
      return false;
    }

    // Verificar limites específicos
    let canCreate = false;
    let limitMessage = '';

    switch (type) {
      case 'sale':
        canCreate = canCreateSale;
        limitMessage = `Limite de vendas atingido (${usage?.salesCount || 0}/50)`;
        break;
      case 'client':
        canCreate = canCreateClient;
        limitMessage = `Limite de clientes atingido (${usage?.clientsCount || 0}/50)`;
        break;
      case 'product':
        canCreate = canCreateProduct;
        limitMessage = `Limite de produtos atingido (${usage?.productsCount || 0}/50)`;
        break;
      case 'transaction':
        canCreate = canCreateTransaction;
        limitMessage = `Limite de transações atingido (${usage?.transactionsCount || 0}/50)`;
        break;
    }

    if (!canCreate && subscription?.plan === 'free') {
      toast.error(limitMessage + '. Faça upgrade para Premium!', {
        duration: 5000
      });
      setTimeout(() => {
        upgradeToPremium();
      }, 1000);
      return false;
    }

    return true;
  };

  const guardSale = () => checkAndWarn('sale');
  const guardClient = () => checkAndWarn('client');
  const guardProduct = () => checkAndWarn('product');
  const guardTransaction = () => checkAndWarn('transaction');

  return {
    guardSale,
    guardClient,
    guardProduct,
    guardTransaction,
    isActive,
    canCreateSale,
    canCreateClient,
    canCreateProduct,
    canCreateTransaction
  };
}