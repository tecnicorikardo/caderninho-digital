import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface EmailReportData {
  to: string;
  subject?: string;
  reportType: 'sales' | 'stock' | 'fiados' | 'general';
  reportData: any;
}

/**
 * Envia relatório por email
 */
export const sendReportByEmail = async (data: EmailReportData) => {
  try {
    console.log('📧 emailService - Enviando para Cloud Function...');
    console.log('📊 Dados enviados:', data);
    
    const sendEmail = httpsCallable(functions, 'sendReportEmail');
    const result = await sendEmail(data);
    
    console.log('✅ Resposta da Cloud Function:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
};

/**
 * Envia relatório de vendas por email
 */
export const sendSalesReport = async (
  email: string,
  salesData: any,
  period: string
) => {
  return sendReportByEmail({
    to: email,
    subject: `Relatório de Vendas - ${period}`,
    reportType: 'sales',
    reportData: {
      period,
      totalSales: salesData.totalSales,
      salesCount: salesData.salesCount,
      averageTicket: salesData.averageTicket,
      sales: salesData.sales,
    },
  });
};

/**
 * Envia relatório de estoque por email
 */
export const sendStockReport = async (
  email: string,
  stockData: any
) => {
  return sendReportByEmail({
    to: email,
    subject: 'Relatório de Estoque - Produtos em Baixa',
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
) => {
  return sendReportByEmail({
    to: email,
    subject: 'Relatório de Fiados - Pendências',
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
