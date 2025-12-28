import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { sendReportByEmail } from './emailService';

export interface MobileEmailOptions {
  to: string;
  subject: string;
  reportType: 'sales' | 'stock' | 'fiados' | 'general';
  reportData: any;
}

/**
 * Serviço inteligente de email que funciona em todas as plataformas
 */
export class MobileEmailService {
  
  /**
   * Envia email usando a melhor abordagem para cada plataforma
   */
  static async sendEmail(options: MobileEmailOptions): Promise<{ success: boolean; message: string }> {
    const { to, subject, reportType, reportData } = options;
    
    try {
      if (Capacitor.isNativePlatform()) {
        // MOBILE: Usar app nativo de email
        return await this.sendViaNativeApp(options);
      } else {
        // WEB: Tentar Cloud Functions primeiro, depois fallback
        return await this.sendViaWeb(options);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // FALLBACK FINAL: Copiar para clipboard
      return await this.copyToClipboard(options);
    }
  }

  /**
   * Envia via app nativo no mobile
   */
  private static async sendViaNativeApp(options: MobileEmailOptions): Promise<{ success: boolean; message: string }> {
    const { to, subject, reportData } = options;
    
    try {
      // Gerar conteúdo do email em texto
      const emailBody = this.generateTextReport(options.reportType, reportData);
      
      // Tentar usar Share API para abrir app de email
      const shareData = {
        title: subject,
        text: `Para: ${to}\n\n${emailBody}`,
        dialogTitle: 'Enviar Relatório por Email'
      };

      await Share.share(shareData);
      
      // Mostrar toast de sucesso
      if (Capacitor.isNativePlatform()) {
        await Toast.show({
          text: 'App de email aberto! Complete o envio.',
          duration: 'long',
          position: 'bottom'
        });
      }
      
      return {
        success: true,
        message: 'App de email aberto com sucesso!'
      };
      
    } catch (error) {
      console.error('Erro no app nativo:', error);
      
      // Fallback: Tentar mailto
      return await this.sendViaMailto(options);
    }
  }

  /**
   * Envia via web (Cloud Functions + fallbacks)
   */
  private static async sendViaWeb(options: MobileEmailOptions): Promise<{ success: boolean; message: string }> {
    try {
      // Tentar Cloud Functions primeiro
      const result = await sendReportByEmail({
        to: options.to,
        subject: options.subject,
        reportType: options.reportType,
        reportData: options.reportData
      });
      
      return {
        success: true,
        message: 'Email enviado com sucesso via servidor!'
      };
      
    } catch (error) {
      console.error('Cloud Functions falharam:', error);
      
      // Fallback: mailto
      return await this.sendViaMailto(options);
    }
  }

  /**
   * Fallback: Abrir cliente de email via mailto
   */
  private static async sendViaMailto(options: MobileEmailOptions): Promise<{ success: boolean; message: string }> {
    const { to, subject, reportType, reportData } = options;
    
    try {
      const emailBody = this.generateTextReport(reportType, reportData);
      const encodedBody = encodeURIComponent(emailBody);
      const encodedSubject = encodeURIComponent(subject);
      
      const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Abrir cliente de email
      window.open(mailtoUrl, '_blank');
      
      return {
        success: true,
        message: 'Cliente de email aberto! Complete o envio.'
      };
      
    } catch (error) {
      console.error('Erro no mailto:', error);
      throw error;
    }
  }

  /**
   * Fallback final: Copiar para clipboard
   */
  private static async copyToClipboard(options: MobileEmailOptions): Promise<{ success: boolean; message: string }> {
    const { to, subject, reportType, reportData } = options;
    
    try {
      const emailContent = `Para: ${to}\nAssunto: ${subject}\n\n${this.generateTextReport(reportType, reportData)}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(emailContent);
      } else {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = emailContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      if (Capacitor.isNativePlatform()) {
        await Toast.show({
          text: 'Relatório copiado! Cole no seu app de email.',
          duration: 'long',
          position: 'bottom'
        });
      }
      
      return {
        success: true,
        message: 'Relatório copiado para área de transferência!'
      };
      
    } catch (error) {
      console.error('Erro ao copiar:', error);
      return {
        success: false,
        message: 'Erro ao processar relatório. Tente novamente.'
      };
    }
  }

  /**
   * Gera relatório em formato texto
   */
  private static generateTextReport(reportType: string, data: any): string {
    const date = new Date().toLocaleDateString('pt-BR');
    
    switch (reportType) {
      case 'sales':
        let salesReport = `📊 RELATÓRIO DE VENDAS\nData: ${date}\n${'='.repeat(40)}\n\n`;
        
        if (data.totalSalesToday !== undefined) {
          salesReport += `📅 VENDAS DE HOJE\n`;
          salesReport += `Vendas: ${data.salesCountToday || 0}\n`;
          salesReport += `Faturamento: R$ ${(data.totalSalesToday || 0).toFixed(2)}\n\n`;
        }
        
        salesReport += `📊 TOTAIS GERAIS\n`;
        salesReport += `Total: R$ ${(data.totalSales || 0).toFixed(2)}\n`;
        salesReport += `Quantidade: ${data.salesCount || 0}\n`;
        salesReport += `Ticket Médio: R$ ${(data.averageTicket || 0).toFixed(2)}\n\n`;
        
        if (data.sales && data.sales.length > 0) {
          salesReport += `ÚLTIMAS VENDAS\n${'-'.repeat(30)}\n`;
          data.sales.slice(0, 10).forEach((sale: any, index: number) => {
            salesReport += `${index + 1}. ${sale.clientName || 'Venda Direta'}\n`;
            salesReport += `   ${sale.productName || 'Venda Livre'}\n`;
            salesReport += `   R$ ${(sale.total || 0).toFixed(2)}\n\n`;
          });
        }
        
        salesReport += `\n📱 Caderninho Digital\nRelatório gerado automaticamente`;
        return salesReport;

      case 'stock':
        let stockReport = `📦 RELATÓRIO DE ESTOQUE\nData: ${date}\n${'='.repeat(40)}\n\n`;
        stockReport += `Total de Produtos: ${data.totalProducts || 0}\n`;
        stockReport += `Produtos em Baixa: ${data.lowStockCount || 0}\n\n`;
        
        if (data.lowStockProducts && data.lowStockProducts.length > 0) {
          stockReport += `⚠️ PRODUTOS EM BAIXA\n${'-'.repeat(30)}\n`;
          data.lowStockProducts.forEach((product: any, index: number) => {
            stockReport += `${index + 1}. ${product.name}\n`;
            stockReport += `   Estoque: ${product.quantity} (Mín: ${product.minStock})\n\n`;
          });
        } else {
          stockReport += `✅ Todos os produtos com estoque adequado!\n\n`;
        }
        
        stockReport += `\n📱 Caderninho Digital\nRelatório gerado automaticamente`;
        return stockReport;

      case 'fiados':
        let fiadosReport = `💳 RELATÓRIO DE FIADOS\nData: ${date}\n${'='.repeat(40)}\n\n`;
        fiadosReport += `Total a Receber: R$ ${(data.totalPending || 0).toFixed(2)}\n`;
        fiadosReport += `Fiados Vencidos: ${data.overdueCount || 0}\n\n`;
        
        if (data.pendingFiados && data.pendingFiados.length > 0) {
          fiadosReport += `📋 FIADOS PENDENTES\n${'-'.repeat(30)}\n`;
          data.pendingFiados.forEach((fiado: any, index: number) => {
            fiadosReport += `${index + 1}. ${fiado.clientName}\n`;
            fiadosReport += `   R$ ${(fiado.amount || 0).toFixed(2)}\n`;
            fiadosReport += `   Venc: ${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}\n\n`;
          });
        } else {
          fiadosReport += `✅ Nenhum fiado pendente!\n\n`;
        }
        
        fiadosReport += `\n📱 Caderninho Digital\nRelatório gerado automaticamente`;
        return fiadosReport;

      default:
        return `📄 RELATÓRIO\nData: ${date}\n\n${JSON.stringify(data, null, 2)}\n\n📱 Caderninho Digital`;
    }
  }

  /**
   * Verifica se o email é válido
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Função de conveniência para usar no componente
export const sendMobileEmail = MobileEmailService.sendEmail.bind(MobileEmailService);