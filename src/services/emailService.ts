// Serviço de email simplificado usando mailto (sempre funciona)
export interface EmailReportData {
  to: string;
  subject?: string;
  reportType: 'sales' | 'stock' | 'fiados' | 'general';
  reportData: any;
}

/**
 * Envia relatório por email usando mailto (abre cliente de email padrão)
 */
export const sendReportByEmail = async (data: EmailReportData): Promise<boolean> => {
  try {
    console.log('📧 Enviando relatório por email via mailto...');
    
    // Gerar conteúdo do relatório
    const reportContent = generateReportContent(data.reportType, data.reportData);
    
    // Criar link mailto
    const subject = encodeURIComponent(data.subject || `📊 Relatório ${data.reportType} - Caderninho Digital`);
    const body = encodeURIComponent(reportContent);
    const mailtoLink = `mailto:${data.to}?subject=${subject}&body=${body}`;
    
    // Abrir cliente de email
    window.open(mailtoLink, '_blank');
    
    console.log('✅ Cliente de email aberto com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao abrir cliente de email:', error);
    return false;
  }
};

/**
 * Envia relatório de vendas por email
 */
export const sendSalesReport = async (
  email: string,
  salesData: any,
  period: string
): Promise<boolean> => {
  return sendReportByEmail({
    to: email,
    subject: `📊 Relatório de Vendas - ${period}`,
    reportType: 'sales',
    reportData: {
      period,
      totalSales: salesData.totalSales,
      salesCount: salesData.salesCount,
      averageTicket: salesData.averageTicket,
      sales: salesData.sales,
      totalSalesToday: salesData.totalSalesToday,
      salesCountToday: salesData.salesCountToday,
    },
  });
};

/**
 * Envia relatório de estoque por email
 */
export const sendStockReport = async (
  email: string,
  stockData: any
): Promise<boolean> => {
  return sendReportByEmail({
    to: email,
    subject: '📦 Relatório de Estoque - Produtos em Baixa',
    reportType: 'stock',
    reportData: {
      totalProducts: stockData.totalProducts,
      lowStockCount: stockData.lowStockCount,
      lowStockProducts: stockData.lowStockProducts,
    },
  });
};

/**
 * Envia relatório de fiados por email
 */
export const sendFiadosReport = async (
  email: string,
  fiadosData: any
): Promise<boolean> => {
  return sendReportByEmail({
    to: email,
    subject: '💳 Relatório de Fiados - Pendências',
    reportType: 'fiados',
    reportData: {
      totalPending: fiadosData.totalPending,
      overdueCount: fiadosData.overdueCount,
      pendingFiados: fiadosData.pendingFiados,
    },
  });
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para gerar conteúdo do relatório em texto
function generateReportContent(reportType: string, data: any): string {
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR');
  
  switch (reportType) {
    case 'sales':
      let content = `📊 RELATÓRIO DE VENDAS\n`;
      content += `Data: ${date} às ${time}\n`;
      content += `═══════════════════════════════════════\n\n`;
      
      if (data.totalSalesToday !== undefined) {
        content += `📅 VENDAS DE HOJE\n`;
        content += `Vendas Hoje: ${data.salesCountToday || 0}\n`;
        content += `Faturamento Hoje: R$ ${(data.totalSalesToday || 0).toFixed(2)}\n\n`;
      }
      
      content += `📊 TOTAIS GERAIS\n`;
      content += `Total de Vendas: R$ ${(data.totalSales || 0).toFixed(2)}\n`;
      content += `Quantidade de Vendas: ${data.salesCount || 0}\n`;
      content += `Ticket Médio: R$ ${(data.averageTicket || 0).toFixed(2)}\n\n`;
      
      if (data.sales && data.sales.length > 0) {
        content += `DETALHES DAS VENDAS\n`;
        content += `───────────────────────────────────────\n`;
        data.sales.forEach((sale: any, index: number) => {
          content += `${index + 1}. ${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'N/A'}\n`;
          content += `   Cliente: ${sale.clientName || 'Venda Direta'}\n`;
          content += `   Produto: ${sale.productName || 'Venda Livre'}\n`;
          content += `   Quantidade: ${sale.quantity || 1}\n`;
          content += `   Valor: R$ ${(sale.total || 0).toFixed(2)}\n`;
          content += `   Pagamento: ${sale.paymentMethod || 'N/A'}\n\n`;
        });
      } else {
        content += `Nenhuma venda registrada no período.\n\n`;
      }
      
      content += `\n📱 Caderninho Digital - Sistema de Gestão\n`;
      content += `Relatório gerado automaticamente em ${date} às ${time}\n`;
      content += `\nEste relatório foi gerado pelo sistema e contém informações confidenciais.`;
      return content;

    case 'stock':
      let stockContent = `📦 RELATÓRIO DE ESTOQUE\n`;
      stockContent += `Data: ${date} às ${time}\n`;
      stockContent += `═══════════════════════════════════════\n\n`;
      stockContent += `Total de Produtos: ${data.totalProducts || 0}\n`;
      stockContent += `Produtos em Baixa: ${data.lowStockCount || 0}\n\n`;
      
      if (data.lowStockProducts && data.lowStockProducts.length > 0) {
        stockContent += `⚠️ PRODUTOS EM BAIXA NO ESTOQUE\n`;
        stockContent += `───────────────────────────────────────\n`;
        data.lowStockProducts.forEach((product: any, index: number) => {
          stockContent += `${index + 1}. ${product.name || 'N/A'}\n`;
          stockContent += `   Quantidade Atual: ${product.quantity || 0}\n`;
          stockContent += `   Quantidade Mínima: ${product.minStock || 5}\n`;
          stockContent += `   Status: ${(product.quantity || 0) <= (product.minStock || 5) ? '🔴 CRÍTICO' : '🟡 BAIXO'}\n\n`;
        });
        
        stockContent += `\n💡 RECOMENDAÇÕES:\n`;
        stockContent += `- Reabasteça os produtos em baixa o mais rápido possível\n`;
        stockContent += `- Considere aumentar o estoque mínimo dos produtos mais vendidos\n`;
        stockContent += `- Monitore regularmente o estoque para evitar rupturas\n\n`;
      } else {
        stockContent += `✅ Todos os produtos estão com estoque adequado!\n`;
        stockContent += `Parabéns! Seu controle de estoque está em dia.\n\n`;
      }
      
      stockContent += `\n📱 Caderninho Digital - Sistema de Gestão\n`;
      stockContent += `Relatório gerado automaticamente em ${date} às ${time}`;
      return stockContent;

    case 'fiados':
      let fiadosContent = `💳 RELATÓRIO DE FIADOS\n`;
      fiadosContent += `Data: ${date} às ${time}\n`;
      fiadosContent += `═══════════════════════════════════════\n\n`;
      fiadosContent += `Total a Receber: R$ ${(data.totalPending || 0).toFixed(2)}\n`;
      fiadosContent += `Fiados Vencidos: ${data.overdueCount || 0}\n\n`;
      
      if (data.pendingFiados && data.pendingFiados.length > 0) {
        fiadosContent += `📋 FIADOS PENDENTES\n`;
        fiadosContent += `───────────────────────────────────────\n`;
        data.pendingFiados.forEach((fiado: any, index: number) => {
          fiadosContent += `${index + 1}. ${fiado.clientName || 'N/A'}\n`;
          fiadosContent += `   Valor: R$ ${(fiado.amount || 0).toFixed(2)}\n`;
          fiadosContent += `   Vencimento: ${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}\n`;
          
          if (fiado.isOverdue) {
            fiadosContent += `   Status: 🔴 VENCIDO\n`;
          } else {
            const daysUntilDue = fiado.dueDate ? 
              Math.ceil((new Date(fiado.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
            if (daysUntilDue <= 3) {
              fiadosContent += `   Status: 🟡 VENCE EM ${daysUntilDue} DIAS\n`;
            } else {
              fiadosContent += `   Status: 🟢 EM DIA\n`;
            }
          }
          fiadosContent += `\n`;
        });
        
        if (data.overdueCount > 0) {
          fiadosContent += `\n⚠️ ATENÇÃO:\n`;
          fiadosContent += `Você tem ${data.overdueCount} fiado(s) vencido(s).\n`;
          fiadosContent += `Entre em contato com os clientes para regularizar a situação.\n\n`;
        }
      } else {
        fiadosContent += `✅ Nenhum fiado pendente!\n`;
        fiadosContent += `Parabéns! Todos os pagamentos estão em dia.\n\n`;
      }
      
      fiadosContent += `\n📱 Caderninho Digital - Sistema de Gestão\n`;
      fiadosContent += `Relatório gerado automaticamente em ${date} às ${time}`;
      return fiadosContent;

    default:
      return `📄 Relatório - Caderninho Digital\n\nData: ${date} às ${time}\n\n${JSON.stringify(data, null, 2)}`;
  }
}
