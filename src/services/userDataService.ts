import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { saleService } from './saleService';
import { productService } from './productService';
import { clientService } from './clientService';

export interface UserBusinessData {
  totalSales: number;
  salesCount: number;
  totalClients: number;
  totalProducts: number;
  totalFiados: number;
  fiadosAmount: number;
  recentSales: any[];
  topProducts: any[];
  topClients: any[];
  lowStockProducts: any[];
}

export interface UserPersonalData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionsCount: number;
  topExpenseCategory: { category: string; amount: number } | null;
  topIncomeCategory: { category: string; amount: number } | null;
  recentTransactions: any[];
}

export async function getUserBusinessData(userId: string): Promise<UserBusinessData> {
  try {
    const data: UserBusinessData = {
      totalSales: 0,
      salesCount: 0,
      totalClients: 0,
      totalProducts: 0,
      totalFiados: 0,
      fiadosAmount: 0,
      recentSales: [],
      topProducts: [],
      topClients: [],
      lowStockProducts: []
    };

    // 1. Buscar TODAS as vendas usando o serviço confiável (sem problemas de índice)
    const allSales = await saleService.getSales(userId);

    data.salesCount = allSales.length;

    // Processar dados das vendas
    const productSalesCount: { [key: string]: number } = {};
    const clientSalesCount: { [key: string]: number } = {};

    allSales.forEach(sale => {
      data.totalSales += sale.total || 0;

      // Contar fiados pendentes
      if (sale.paymentMethod === 'fiado' && sale.remainingAmount > 0) {
        data.totalFiados++;
        data.fiadosAmount += sale.remainingAmount || 0;
      }

      // Contar produtos vendidos para ranking
      if (sale.products) {
        sale.products.forEach(p => {
          productSalesCount[p.name] = (productSalesCount[p.name] || 0) + (p.quantity || 1);
        });
      } else if (sale.productName) { // Legado
        productSalesCount[sale.productName] = (productSalesCount[sale.productName] || 0) + (sale.quantity || 1);
      }

      // Contar compras por cliente
      const clientName = sale.clientName || 'Cliente não identificado';
      clientSalesCount[clientName] = (clientSalesCount[clientName] || 0) + 1;
    });

    // Pegar as 5 vendas mais recentes (já vêm ordenadas do service)
    data.recentSales = allSales.slice(0, 10).map(sale => ({
      total: sale.total,
      date: sale.createdAt,
      client: sale.clientName || 'Cliente não informado',
      paymentMethod: sale.paymentMethod,
      products: sale.products?.map(p => `${p.quantity}x ${p.name}`).join(', ') || sale.productName
    }));

    // Processar Top Produtos
    data.topProducts = Object.entries(productSalesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Processar Top Clientes
    data.topClients = Object.entries(clientSalesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 2. Buscar Clientes usando service
    const clients = await clientService.getClients(userId);
    data.totalClients = clients.length;

    // 3. Buscar Produtos usando service
    const products = await productService.getProducts(userId);
    data.totalProducts = products.length;

    data.lowStockProducts = products
      .filter(p => p.quantity <= (p.minQuantity || 5))
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        minQuantity: p.minQuantity || 5
      }));

    return data;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return {
      totalSales: 0,
      salesCount: 0,
      totalClients: 0,
      totalProducts: 0,
      totalFiados: 0,
      fiadosAmount: 0,
      recentSales: [],
      topProducts: [],
      topClients: [],
      lowStockProducts: []
    };
  }
}

export function formatBusinessDataForAI(data: UserBusinessData): string {
  let context = `\n\n📊 DADOS REAIS DO NEGÓCIO DO USUÁRIO:\n\n`;

  context += `💰 VENDAS e FATURAMENTO:\n`;
  context += `- Faturamento Total: R$ ${data.totalSales.toFixed(2)}\n`;
  context += `- Número total de vendas: ${data.salesCount}\n`;
  context += `- Ticket médio: R$ ${data.salesCount > 0 ? (data.totalSales / data.salesCount).toFixed(2) : '0.00'}\n`;

  if (data.recentSales.length > 0) {
    context += `\n🕐 ÚLTIMAS 5 VENDAS (Mais recentes primeiro):\n`;
    data.recentSales.slice(0, 5).forEach((sale, i) => {
      const date = sale.date ? sale.date.toLocaleDateString('pt-BR') : 'Data n/d';
      const time = sale.date ? sale.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      context += `${i + 1}. R$ ${sale.total.toFixed(2)} - ${sale.client} (${sale.paymentMethod}) - ${date} ${time}\n`;
      if (sale.products) context += `   Itens: ${sale.products}\n`;
    });
  }

  context += `\n📦 PRODUTOS MAIS VENDIDOS:\n`;
  if (data.topProducts.length > 0) {
    data.topProducts.forEach((p, i) => {
      context += `${i + 1}. ${p.name} (${p.count} und)\n`;
    });
  } else {
    context += `- Nenhum dado de produto ainda.\n`;
  }

  context += `\n👥 CLIENTES FIÉIS:\n`;
  if (data.topClients.length > 0) {
    data.topClients.forEach((c, i) => {
      context += `${i + 1}. ${c.name} (${c.count} compras)\n`;
    });
  }

  context += `\n⚠️ ESTOQUE E ALERTAS:\n`;
  context += `- Total de produtos cadastrados: ${data.totalProducts}\n`;
  if (data.lowStockProducts.length > 0) {
    context += `- Produtos com estoque baixo (${data.lowStockProducts.length}):\n`;
    data.lowStockProducts.slice(0, 5).forEach(p => {
      context += `  • ${p.name}: ${p.quantity} (Mín: ${p.minQuantity})\n`;
    });
  } else {
    context += `- Estoque está saudável.\n`;
  }

  context += `\n📝 FIADOS (Contas a Receber):\n`;
  context += `- Clientes devendo: ${data.totalFiados}\n`;
  context += `- Valor total a receber: R$ ${data.fiadosAmount.toFixed(2)}\n\n`;

  context += `💡 INSTRUÇÃO: Use esses DADOS REAIS para responder. Se o usuário perguntar "quanto vendi?", use o valor de Faturamento Total. Se perguntar "qual produto sai mais?", use a lista de Produtos Mais Vendidos.\n`;

  return context;
}

export async function getUserPersonalData(userId: string): Promise<UserPersonalData> {
  try {
    const data: UserPersonalData = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionsCount: 0,
      topExpenseCategory: null,
      topIncomeCategory: null,
      recentTransactions: []
    };

    // Buscar transações pessoais do mês atual e passado para comparação
    const transactionsQuery = query(
      collection(db, 'personal_transactions'),
      where('userId', '==', userId)
    );
    // Aqui ainda usamos query direta pois transactions costuma ter menos problemas de índice simples
    // ou se houver erro, podemos refatorar depois para um service se existir.

    // Nota: Se houver transactionService, seria ideal usar.
    const transactionsSnapshot = await getDocs(transactionsQuery);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expensesByCategory: { [key: string]: number } = {};
    const incomeByCategory: { [key: string]: number } = {};

    const allTransactions: any[] = [];

    transactionsSnapshot.forEach(doc => {
      const transaction = doc.data();
      const transDate = transaction.date?.toDate();

      if (!transDate) return;

      allTransactions.push({
        ...transaction,
        date: transDate
      });

      // Filtrar apenas do mês atual para totais
      if (transDate >= startOfMonth) {
        if (transaction.type === 'receita') {
          data.totalIncome += transaction.amount || 0;
          incomeByCategory[transaction.category] = (incomeByCategory[transaction.category] || 0) + transaction.amount;
        } else if (transaction.type === 'despesa') {
          data.totalExpenses += transaction.amount || 0;
          expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + transaction.amount;
        }
        data.transactionsCount++;
      }
    });

    data.balance = data.totalIncome - data.totalExpenses;

    // Encontrar categoria com maior despesa
    const expensesArray = Object.entries(expensesByCategory);
    if (expensesArray.length > 0) {
      const [category, amount] = expensesArray.reduce((max, curr) =>
        curr[1] > max[1] ? curr : max
      );
      data.topExpenseCategory = { category, amount };
    }

    // Encontrar categoria com maior receita
    const incomeArray = Object.entries(incomeByCategory);
    if (incomeArray.length > 0) {
      const [category, amount] = incomeArray.reduce((max, curr) =>
        curr[1] > max[1] ? curr : max
      );
      data.topIncomeCategory = { category, amount };
    }

    // Ordenar todas por data decrescente
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    data.recentTransactions = allTransactions.slice(0, 5).map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date
    }));

    return data;
  } catch (error) {
    console.error('Erro ao buscar dados pessoais:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionsCount: 0,
      topExpenseCategory: null,
      topIncomeCategory: null,
      recentTransactions: []
    };
  }
}

export function formatPersonalDataForAI(data: UserPersonalData): string {
  let context = `\n\n💰 DADOS REAIS DE GESTÃO PESSOAL DO USUÁRIO (MÊS ATUAL):\n\n`;

  context += `💵 RECEITAS E DESPESAS:\n`;
  context += `- Receitas: R$ ${data.totalIncome.toFixed(2)}\n`;
  context += `- Despesas: R$ ${data.totalExpenses.toFixed(2)}\n`;
  context += `- Saldo Líquido: R$ ${data.balance.toFixed(2)}\n`;

  if (data.topExpenseCategory) {
    context += `- Onde você mais gastou: ${data.topExpenseCategory.category} (R$ ${data.topExpenseCategory.amount.toFixed(2)})\n`;
  }

  if (data.recentTransactions.length > 0) {
    context += `\n🕐 ÚLTIMAS 5 TRANSAÇÕES PESSOAIS:\n`;
    data.recentTransactions.forEach((trans, i) => {
      const date = trans.date ? trans.date.toLocaleDateString('pt-BR') : 'Data n/d';
      const symbol = trans.type === 'receita' ? '+' : '-';
      context += `${i + 1}. ${symbol} R$ ${trans.amount.toFixed(2)} - ${trans.description} (${trans.category}) - ${date}\n`;
    });
  }

  context += `\n💡 Use esses dados para ajudar o usuário a economizar e controlar gastos!\n`;

  return context;
}
