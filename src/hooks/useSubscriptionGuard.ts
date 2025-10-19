import { useSubscription } from '../contexts/SubscriptionContext';
import toast from 'react-hot-toast';

export function useSubscriptionGuard() {
  const { 
    isActive, 
    canCreateSale, 
    canCreateClient, 
    canCreateProduct, 
    subscription,
    usage,
    upgradeToPremium 
  } = useSubscription();

  const checkAndWarn = (type: 'sale' | 'client' | 'product'): boolean => {
    // Verificar se a assinatura está ativa
    if (!isActive) {
      toast.error('Seu período gratuito expirou! Faça upgrade para continuar.', {
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: upgradeToPremium
        }
      });
      return false;
    }

    // Verificar limites específicos
    let canCreate = false;
    let limitMessage = '';

    switch (type) {
      case 'sale':
        canCreate = canCreateSale;
        limitMessage = `Limite de vendas atingido (${usage?.salesCount}/1000 este mês)`;
        break;
      case 'client':
        canCreate = canCreateClient;
        limitMessage = `Limite de clientes atingido (${usage?.clientsCount}/500)`;
        break;
      case 'product':
        canCreate = canCreateProduct;
        limitMessage = `Limite de produtos atingido (${usage?.productsCount}/200)`;
        break;
    }

    if (!canCreate && subscription?.plan === 'free') {
      toast.error(limitMessage + '. Faça upgrade para Premium!', {
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: upgradeToPremium
        }
      });
      return false;
    }

    return true;
  };

  const guardSale = () => checkAndWarn('sale');
  const guardClient = () => checkAndWarn('client');
  const guardProduct = () => checkAndWarn('product');

  return {
    guardSale,
    guardClient,
    guardProduct,
    isActive,
    canCreateSale,
    canCreateClient,
    canCreateProduct
  };
}