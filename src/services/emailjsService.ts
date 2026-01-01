import emailjs from '@emailjs/browser';

// Configurações do EmailJS
const EMAILJS_CONFIG = {
  serviceId: 'service_mtv4wwx', // Service ID do Gmail configurado
  templateId: 'template_08539ju', // Template ID configurado
  publicKey: 'blGVMW835aUFh3CWn', // Public Key configurada
};

export interface EmailJSReportData {
  to: string;
  subject: string;
  reportType: 'sales' | 'stock' | 'fiados' | 'general' | 'customer_collection';
  reportData: any;
}

/**
 * Envia relatório por email usando EmailJS
 */
export const sendReportViaEmailJS = async (data: EmailJSReportData): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('📧 Enviando email via EmailJS...', data);

    // Gerar conteúdo do relatório
    const reportContent = generateReportContent(data.reportType, data.reportData);

    // Preparar dados para o template EmailJS
    const templateParams = {
      to_email: data.to,
      subject: data.subject,
      report_type: data.reportType,
      report_content: reportContent,
      report_html: generateReportHTML(data.reportType, data.reportData),
      from_name: 'Caderninho Digital',
      reply_to: 'noreply@caderninho.com',
    };

    console.log('📤 Enviando via EmailJS com parâmetros:', templateParams);

    // Enviar email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('✅ EmailJS Response:', response);

    return {
      success: true,
      message: 'Email enviado com sucesso via EmailJS!'
    };

  } catch (error: any) {
    console.error('❌ Erro no EmailJS:', error);

    // Tratar erros específicos do EmailJS
    let errorMessage = 'Erro ao enviar email';

    if (error.status === 400) {
      errorMessage = 'Erro de configuração do EmailJS. Verifique as credenciais.';
    } else if (error.status === 402) {
      errorMessage = 'Limite de emails do EmailJS excedido.';
    } else if (error.status === 403) {
      errorMessage = 'Acesso negado. Verifique a configuração do EmailJS.';
    } else if (error.text) {
      errorMessage = error.text;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Inicializa o EmailJS com as configurações
 */
export const initEmailJS = () => {
  try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('✅ EmailJS inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar EmailJS:', error);
  }
};

/**
 * Gera conteúdo do relatório em texto
 */
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
        data.sales.slice(0, 10).forEach((sale: any, index: number) => {
          content += `${index + 1}. ${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'N/A'}\n`;
          content += `   Cliente: ${sale.clientName || 'Venda Direta'}\n`;
          content += `   Produto: ${sale.productName || 'Venda Livre'}\n`;
          content += `   Quantidade: ${sale.quantity || 1}\n`;
          content += `   Valor: R$ ${(sale.total || 0).toFixed(2)}\n\n`;
        });
      }

      content += `\n📱 Caderninho Digital - Sistema de Gestão\n`;
      content += `Relatório gerado automaticamente em ${date} às ${time}`;
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
          stockContent += `   Quantidade Mínima: ${product.minStock || 5}\n\n`;
        });
      } else {
        stockContent += `✅ Todos os produtos estão com estoque adequado!\n\n`;
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
          fiadosContent += `   Vencimento: ${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}\n\n`;
        });
      } else {
        fiadosContent += `✅ Nenhum fiado pendente!\n\n`;
      }

      fiadosContent += `\n📱 Caderninho Digital - Sistema de Gestão\n`;
      fiadosContent += `Relatório gerado automaticamente em ${date} às ${time}`;
      return fiadosContent;

    default:
      return `📄 Relatório - Caderninho Digital\n\nData: ${date} às ${time}\n\n${JSON.stringify(data, null, 2)}`;
  }
}

/**
 * Gera conteúdo HTML do relatório para emails mais bonitos
 */
function generateReportHTML(reportType: string, data: any): string {
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR');

  const styles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; }
      .footer { background: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
      .metric { background: #f7fafc; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3182ce; }
      .metric-value { font-size: 24px; font-weight: bold; color: #2d3748; }
      .metric-label { font-size: 14px; color: #4a5568; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th { background: #f7fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    </style>
  `;

  switch (reportType) {
    case 'sales':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📊 Relatório de Vendas</h1>
            <p>Data: ${date} às ${time}</p>
          </div>
          <div class="content">
            ${data.totalSalesToday !== undefined ? `
              <h3>📅 Vendas de Hoje</h3>
              <div class="metric">
                <div class="metric-label">Vendas Hoje</div>
                <div class="metric-value">${data.salesCountToday || 0}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Faturamento Hoje</div>
                <div class="metric-value">R$ ${(data.totalSalesToday || 0).toFixed(2)}</div>
              </div>
            ` : ''}
            
            <h3>📊 Totais Gerais</h3>
            <div class="metric">
              <div class="metric-label">Total de Vendas</div>
              <div class="metric-value">R$ ${(data.totalSales || 0).toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Quantidade</div>
              <div class="metric-value">${data.salesCount || 0}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Ticket Médio</div>
              <div class="metric-value">R$ ${(data.averageTicket || 0).toFixed(2)}</div>
            </div>
            
            ${data.sales && data.sales.length > 0 ? `
              <h3>Últimas Vendas</h3>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Produto</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.sales.slice(0, 10).map((sale: any) => `
                    <tr>
                      <td>${sale.clientName || 'Venda Direta'}</td>
                      <td>${sale.productName || 'Venda Livre'}</td>
                      <td>R$ ${(sale.total || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Nenhuma venda registrada no período.</p>'}
          </div>
          <div class="footer">
            <p>📱 Caderninho Digital - Sistema de Gestão</p>
            <p>Relatório gerado automaticamente</p>
          </div>
        </div>
      `;

    case 'stock':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📦 Relatório de Estoque</h1>
            <p>Data: ${date} às ${time}</p>
          </div>
          <div class="content">
            <h3>📊 Resumo do Estoque</h3>
            <div class="metric">
              <div class="metric-label">Total de Produtos</div>
              <div class="metric-value">${data.totalProducts || 0}</div>
            </div>
            <div class="metric" style="border-left-color: ${data.lowStockCount > 0 ? '#e53e3e' : '#3182ce'}">
              <div class="metric-label">Produtos em Baixa</div>
              <div class="metric-value" style="color: ${data.lowStockCount > 0 ? '#e53e3e' : '#2d3748'}">${data.lowStockCount || 0}</div>
            </div>
            
            ${data.lowStockProducts && data.lowStockProducts.length > 0 ? `
              <h3>⚠️ Produtos em Baixa</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Atual</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.lowStockProducts.map((product: any) => `
                    <tr>
                      <td>${product.name || 'N/A'}</td>
                      <td style="color: #e53e3e; font-weight: bold;">${product.quantity || 0}</td>
                      <td>${product.minStock || 5}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #38a169; font-weight: bold;">✅ Todos os produtos estão com estoque adequado!</p>'}
          </div>
          <div class="footer">
            <p>📱 Caderninho Digital - Sistema de Gestão</p>
            <p>Relatório gerado automaticamente</p>
          </div>
        </div>
      `;

    case 'fiados':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>💳 Relatório de Fiados</h1>
            <p>Data: ${date} às ${time}</p>
          </div>
          <div class="content">
            <h3>📊 Resumo Financeiro</h3>
            <div class="metric">
              <div class="metric-label">Total a Receber</div>
              <div class="metric-value">R$ ${(data.totalPending || 0).toFixed(2)}</div>
            </div>
            <div class="metric" style="border-left-color: ${data.overdueCount > 0 ? '#e53e3e' : '#3182ce'}">
              <div class="metric-label">Fiados Vencidos</div>
              <div class="metric-value" style="color: ${data.overdueCount > 0 ? '#e53e3e' : '#2d3748'}">${data.overdueCount || 0}</div>
            </div>
            
            ${data.pendingFiados && data.pendingFiados.length > 0 ? `
              <h3>📋 Fiados Pendentes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.pendingFiados.map((fiado: any) => `
                    <tr>
                      <td>${fiado.clientName || 'N/A'}</td>
                      <td>${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td style="font-weight: bold;">R$ ${(fiado.amount || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #38a169; font-weight: bold;">✅ Nenhum fiado pendente!</p>'}
          </div>
          <div class="footer">
            <p>📱 Caderninho Digital - Sistema de Gestão</p>
            <p>Relatório gerado automaticamente</p>
          </div>
        </div>
      `;

    case 'customer_collection':
      return `
        ${styles}
        <div class="container">
          <div class="header" style="background: #2b6cb0;">
            <h1>🔔 Lembrete de Pagamento</h1>
            <p>${data.storeName || 'Caderninho Digital'}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${data.clientName}</strong>!</p>
            <p>Esperamos que esteja tudo bem com você.</p>
            
            <p>Estamos enviando este email apenas para lembrar gentilmente sobre uma pendência em aberto conosco.</p>
            
            <div class="metric" style="border-left-color: #e53e3e; background-color: #fff5f5;">
              <div class="metric-label">Valor Pendente</div>
              <div class="metric-value" style="color: #c53030">R$ ${(data.amount || 0).toFixed(2)}</div>
            </div>

            <p style="margin-top: 20px;"><strong>Detalhes da Compra:</strong></p>
            <ul>
              <li>Data: ${data.saleDate ? new Date(data.saleDate).toLocaleDateString('pt-BR') : 'N/A'}</li>
              ${data.items ? `<li>Itens: ${data.items}</li>` : ''}
            </ul>

            <p>Se você já realizou este pagamento recentemente, por favor, desconsidere este email.</p>
            <p>Caso precise do Pix para pagamento ou tenha alguma dúvida, estamos à disposição!</p>
          </div>
          <div class="footer">
            <p>Enviado via Caderninho Digital</p>
          </div>
        </div>
      `;

    default:
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📄 Relatório</h1>
            <p>Data: ${date} às ${time}</p>
          </div>
          <div class="content">
            <p>Relatório gerado com sucesso!</p>
          </div>
          <div class="footer">
            <p>📱 Caderninho Digital</p>
          </div>
        </div>
      `;
  }
}
