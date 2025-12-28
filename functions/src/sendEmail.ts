import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou 'outlook', 'yahoo', etc.
  auth: {
    user: functions.config().email.user, // seu-email@gmail.com
    pass: functions.config().email.password, // senha de app do Gmail
  },
});

// Função para enviar relatório por email
export const sendReportEmail = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  const { to, subject, reportType, reportData } = data;

  try {
    // Gerar HTML do relatório
    const htmlContent = generateReportHTML(reportType, reportData);
    
    // Gerar versão texto
    const textContent = generateReportText(reportType, reportData);

    // Configurar email
    const mailOptions = {
      from: `Caderninho Digital <${functions.config().email.user}>`,
      to: to,
      subject: subject || 'Relatório - Caderninho Digital',
      html: htmlContent,
      text: textContent, // Versão texto alternativa
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Email enviado com sucesso!' };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao enviar email');
  }
});

// Função para gerar HTML do relatório
function generateReportHTML(reportType: string, data: any): string {
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1d23; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; }
      .footer { background: #f5f6f8; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 8px 8px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #f5f6f8; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
      .metric { background: #f5f6f8; padding: 15px; margin: 10px 0; border-radius: 6px; }
      .metric-value { font-size: 24px; font-weight: bold; color: #2d3748; }
      .metric-label { font-size: 14px; color: #4a5568; }
    </style>
  `;

  switch (reportType) {
    case 'sales':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📊 Relatório de Vendas</h1>
            <p>Data: ${data.period || new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="content">
            ${data.totalSalesToday !== undefined ? `
              <h3 style="color: #3b82f6; margin: 0 0 15px 0;">📅 Vendas de Hoje</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div class="metric" style="border-left: 4px solid #3b82f6;">
                  <div class="metric-label">Vendas Hoje</div>
                  <div class="metric-value" style="color: #3b82f6;">${data.salesCountToday || 0}</div>
                </div>
                <div class="metric" style="border-left: 4px solid #10b981;">
                  <div class="metric-label">Faturamento Hoje</div>
                  <div class="metric-value" style="color: #10b981;">R$ ${(data.totalSalesToday || 0).toFixed(2)}</div>
                </div>
              </div>
            ` : ''}
            
            <h3 style="color: #6b7280; margin: 20px 0 15px 0;">📊 Totais Gerais</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
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
            </div>
            
            ${data.sales && data.sales.length > 0 ? `
              <h3>Detalhes das Vendas</h3>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.sales.map((sale: any) => `
                    <tr>
                      <td>${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td>${sale.clientName || 'Venda Direta'}</td>
                      <td>${sale.productName || 'Venda Livre'}</td>
                      <td>${sale.quantity || 1}</td>
                      <td>R$ ${(sale.total || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #718096; padding: 20px;">Nenhuma venda registrada no período.</p>'}
          </div>
          <div class="footer">
            <p>📓 Caderninho Digital - Sistema de Gestão</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      `;

    case 'stock':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📦 Relatório de Estoque</h1>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="content">
            <div class="metric">
              <div class="metric-label">Total de Produtos</div>
              <div class="metric-value">${data.totalProducts || 0}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Produtos em Baixa</div>
              <div class="metric-value" style="color: #e53e3e;">${data.lowStockCount || 0}</div>
            </div>
            
            ${data.lowStockProducts && data.lowStockProducts.length > 0 ? `
              <h3>Produtos em Baixa no Estoque</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.lowStockProducts.map((product: any) => `
                    <tr>
                      <td>${product.name || 'N/A'}</td>
                      <td style="color: #e53e3e;">${product.quantity || 0}</td>
                      <td>${product.minStock || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #718096; padding: 20px;">✅ Todos os produtos estão com estoque adequado!</p>'}
          </div>
          <div class="footer">
            <p>📓 Caderninho Digital - Sistema de Gestão</p>
          </div>
        </div>
      `;

    case 'fiados':
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>💳 Relatório de Fiados</h1>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="content">
            <div class="metric">
              <div class="metric-label">Total a Receber</div>
              <div class="metric-value">R$ ${(data.totalPending || 0).toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Fiados Vencidos</div>
              <div class="metric-value" style="color: #e53e3e;">${data.overdueCount || 0}</div>
            </div>
            
            ${data.pendingFiados && data.pendingFiados.length > 0 ? `
              <h3>Fiados Pendentes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.pendingFiados.map((fiado: any) => `
                    <tr>
                      <td>${fiado.clientName || 'N/A'}</td>
                      <td>R$ ${(fiado.amount || 0).toFixed(2)}</td>
                      <td style="color: ${fiado.isOverdue ? '#e53e3e' : '#4a5568'};">
                        ${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #718096; padding: 20px;">✅ Nenhum fiado pendente!</p>'}
          </div>
          <div class="footer">
            <p>📓 Caderninho Digital - Sistema de Gestão</p>
          </div>
        </div>
      `;

    default:
      return `
        ${styles}
        <div class="container">
          <div class="header">
            <h1>📄 Relatório</h1>
          </div>
          <div class="content">
            <p>Relatório gerado com sucesso!</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
          <div class="footer">
            <p>Caderninho Digital - Sistema de Gestão</p>
          </div>
        </div>
      `;
  }
}

// Função para gerar versão texto do relatório
function generateReportText(reportType: string, data: any): string {
  switch (reportType) {
    case 'sales':
      let text = '📊 RELATÓRIO DE VENDAS\n';
      text += `Data: ${data.period || new Date().toLocaleDateString('pt-BR')}\n`;
      text += '═══════════════════════════════════════\n\n';
      
      if (data.totalSalesToday !== undefined) {
        text += '📅 VENDAS DE HOJE\n';
        text += `Vendas Hoje: ${data.salesCountToday || 0}\n`;
        text += `Faturamento Hoje: R$ ${(data.totalSalesToday || 0).toFixed(2)}\n\n`;
      }
      
      text += '📊 TOTAIS GERAIS\n';
      text += `Total de Vendas: R$ ${(data.totalSales || 0).toFixed(2)}\n`;
      text += `Quantidade de Vendas: ${data.salesCount || 0}\n`;
      text += `Ticket Médio: R$ ${(data.averageTicket || 0).toFixed(2)}\n\n`;
      
      if (data.sales && data.sales.length > 0) {
        text += 'DETALHES DAS VENDAS\n';
        text += '───────────────────────────────────────\n';
        data.sales.forEach((sale: any) => {
          text += `📅 ${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'N/A'}\n`;
          text += `👤 Cliente: ${sale.clientName || 'Venda Direta'}\n`;
          text += `📦 Produto: ${sale.productName || 'Venda Livre'}\n`;
          text += `🔢 Quantidade: ${sale.quantity || 1}\n`;
          text += `💰 Valor: R$ ${(sale.total || 0).toFixed(2)}\n`;
          text += '───────────────────────────────────────\n';
        });
      }
      
      text += '\n📓 Caderninho Digital - Sistema de Gestão\n';
      text += 'Este é um email automático, não responda.';
      return text;

    case 'stock':
      let stockText = '📦 RELATÓRIO DE ESTOQUE\n';
      stockText += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
      stockText += '═══════════════════════════════════════\n\n';
      stockText += `Total de Produtos: ${data.totalProducts || 0}\n`;
      stockText += `Produtos em Baixa: ${data.lowStockCount || 0}\n\n`;
      
      if (data.lowStockProducts && data.lowStockProducts.length > 0) {
        stockText += 'PRODUTOS EM BAIXA NO ESTOQUE\n';
        stockText += '───────────────────────────────────────\n';
        data.lowStockProducts.forEach((product: any) => {
          stockText += `📦 ${product.name || 'N/A'}\n`;
          stockText += `   Quantidade: ${product.quantity || 0}\n`;
          stockText += `   Mínimo: ${product.minStock || 0}\n`;
          stockText += '───────────────────────────────────────\n';
        });
      } else {
        stockText += '✅ Todos os produtos estão com estoque adequado!\n';
      }
      
      stockText += '\n📓 Caderninho Digital - Sistema de Gestão';
      return stockText;

    case 'fiados':
      let fiadosText = '💳 RELATÓRIO DE FIADOS\n';
      fiadosText += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
      fiadosText += '═══════════════════════════════════════\n\n';
      fiadosText += `Total a Receber: R$ ${(data.totalPending || 0).toFixed(2)}\n`;
      fiadosText += `Fiados Vencidos: ${data.overdueCount || 0}\n\n`;
      
      if (data.pendingFiados && data.pendingFiados.length > 0) {
        fiadosText += 'FIADOS PENDENTES\n';
        fiadosText += '───────────────────────────────────────\n';
        data.pendingFiados.forEach((fiado: any) => {
          fiadosText += `👤 ${fiado.clientName || 'N/A'}\n`;
          fiadosText += `💰 Valor: R$ ${(fiado.amount || 0).toFixed(2)}\n`;
          fiadosText += `📅 Vencimento: ${fiado.dueDate ? new Date(fiado.dueDate).toLocaleDateString('pt-BR') : 'N/A'}\n`;
          fiadosText += '───────────────────────────────────────\n';
        });
      } else {
        fiadosText += '✅ Nenhum fiado pendente!\n';
      }
      
      fiadosText += '\n📓 Caderninho Digital - Sistema de Gestão';
      return fiadosText;

    default:
      return `Relatório - Caderninho Digital\n\n${JSON.stringify(data, null, 2)}`;
  }
}

// Função para notificações automáticas (trigger)
export const sendDailyReport = functions.pubsub
  .schedule('0 8 * * *') // Todo dia às 8h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    // Buscar usuários que querem receber relatório diário
    // Implementar lógica aqui
    console.log('Enviando relatórios diários...');
    return null;
  });

// Função para alertas de estoque baixo
export const sendLowStockAlert = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Verificar se o estoque ficou baixo
    if (
      newData.quantity <= newData.minStock &&
      oldData.quantity > oldData.minStock
    ) {
      // Buscar email do administrador
      // Enviar alerta
      console.log(`Alerta: Produto ${newData.name} com estoque baixo!`);
    }

    return null;
  });
