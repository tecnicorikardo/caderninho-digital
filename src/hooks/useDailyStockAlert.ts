import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Product {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
}

export function useDailyStockAlert() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkStockAlert = async () => {
      try {
        // Verificar se já mostrou o alerta hoje
        const lastAlertDate = localStorage.getItem('lastStockAlertDate');
        const today = new Date().toDateString();

        if (lastAlertDate === today) {
          console.log('✅ Alerta de estoque já foi mostrado hoje');
          return;
        }

        // Buscar produtos com estoque baixo
        const q = query(
          collection(db, 'products'),
          where('userId', '==', user.uid)
        );

        const snapshot = await getDocs(q);
        const lowStockProducts: Product[] = [];

        snapshot.forEach((doc) => {
          const product = doc.data() as Product;
          const currentStock = product.quantity || 0;
          const minStock = product.minQuantity || 5;

          if (currentStock <= minStock && currentStock > 0) {
            lowStockProducts.push({
              id: doc.id,
              name: product.name,
              quantity: currentStock,
              minQuantity: minStock
            });
          }
        });

        // Se houver produtos com estoque baixo, mostrar alerta
        if (lowStockProducts.length > 0) {
          // Limitar a 10 produtos para não ficar muito grande
          const displayProducts = lowStockProducts.slice(0, 10);
          const hasMore = lowStockProducts.length > 10;
          
          const productList = displayProducts
            .map(p => `• ${p.name}: ${p.quantity} unidades (mínimo: ${p.minQuantity})`)
            .join('\n');

          const moreText = hasMore ? `\n\n... e mais ${lowStockProducts.length - 10} produto(s)` : '';
          const message = `⚠️ ALERTA DE ESTOQUE BAIXO\n\n${lowStockProducts.length} produto(s) com estoque baixo:\n\n${productList}${moreText}\n\nAcesse o menu Estoque para repor.`;

          // Mostrar alerta
          alert(message);

          // Salvar que já mostrou hoje
          localStorage.setItem('lastStockAlertDate', today);
          console.log(`✅ Alerta de estoque mostrado (${lowStockProducts.length} produtos)`);
        } else {
          console.log('✅ Nenhum produto com estoque baixo');
          // Salvar que verificou hoje (mesmo sem produtos)
          localStorage.setItem('lastStockAlertDate', today);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar estoque:', error);
      }
    };

    // Aguardar 2 segundos após login para mostrar o alerta
    const timer = setTimeout(() => {
      checkStockAlert();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);
}
