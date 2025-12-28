// ========================================
// EXEMPLO: Como adicionar botão de email na página de vendas
// ========================================

// 1. ADICIONAR IMPORTS NO TOPO DO ARQUIVO
import { useState } from 'react';
import EmailReportModal from '../../components/EmailReportModal';

// 2. ADICIONAR ESTADO NO COMPONENTE (junto com os outros useState)
const [showEmailModal, setShowEmailModal] = useState(false);

// 3. ADICIONAR FUNÇÃO PARA PREPARAR DADOS DO RELATÓRIO
const prepareEmailReport = () => {
  // Calcular totais
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = sales.length;
  const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

  // Preparar dados formatados
  return {
    period: `${new Date().toLocaleDateString('pt-BR')}`,
    totalSales: totalSales,
    salesCount: salesCount,
    averageTicket: averageTicket,
    sales: sales.map(sale => ({
      date: sale.createdAt,
      clientName: sale.clientName || 'Venda Direta',
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      productName: sale.productName || 'Venda Customizada',
      quantity: sale.quantity,
    })),
  };
};

// 4. ADICIONAR BOTÃO NA INTERFACE (exemplo de onde colocar)
// Procure por uma seção de botões ou ações, geralmente perto do topo da página
// Adicione este código:

<div style={{ 
  display: 'flex', 
  gap: '1rem', 
  marginBottom: '1.5rem',
  flexWrap: 'wrap' 
}}>
  {/* Botão de Nova Venda (já existe) */}
  <button
    onClick={() => setShowForm(true)}
    style={{
      padding: '0.75rem 1.5rem',
      backgroundColor: '#38a169',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}
  >
    ➕ Nova Venda
  </button>

  {/* NOVO: Botão de Enviar por Email */}
  <button
    onClick={() => setShowEmailModal(true)}
    disabled={sales.length === 0}
    style={{
      padding: '0.75rem 1.5rem',
      backgroundColor: sales.length === 0 ? '#a0aec0' : '#3182ce',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: sales.length === 0 ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}
  >
    📧 Enviar Relatório
  </button>
</div>

// 5. ADICIONAR MODAL NO FINAL DO RETURN (antes do último </div>)
{/* Modal de Email */}
<EmailReportModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  reportType="sales"
  reportData={prepareEmailReport()}
  defaultSubject={`Relatório de Vendas - ${new Date().toLocaleDateString('pt-BR')}`}
/>

// ========================================
// CÓDIGO COMPLETO DO COMPONENTE (EXEMPLO)
// ========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EmailReportModal from '../../components/EmailReportModal'; // NOVO

export function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); // NOVO

  // ... resto do código existente ...

  // NOVA FUNÇÃO
  const prepareEmailReport = () => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

    return {
      period: new Date().toLocaleDateString('pt-BR'),
      totalSales,
      salesCount,
      averageTicket,
      sales: sales.map(sale => ({
        date: sale.createdAt,
        clientName: sale.clientName || 'Venda Direta',
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        productName: sale.productName || 'Venda Customizada',
        quantity: sale.quantity,
      })),
    };
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Vendas</h1>

      {/* Botões de Ação */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap' 
      }}>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ➕ Nova Venda
        </button>

        {/* NOVO BOTÃO */}
        <button
          onClick={() => setShowEmailModal(true)}
          disabled={sales.length === 0}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: sales.length === 0 ? '#a0aec0' : '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: sales.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          📧 Enviar Relatório
        </button>
      </div>

      {/* Lista de Vendas */}
      <div>
        {sales.map(sale => (
          <div key={sale.id}>
            {/* Conteúdo da venda */}
          </div>
        ))}
      </div>

      {/* NOVO MODAL */}
      <EmailReportModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType="sales"
        reportData={prepareEmailReport()}
        defaultSubject={`Relatório de Vendas - ${new Date().toLocaleDateString('pt-BR')}`}
      />
    </div>
  );
}

// ========================================
// VERSÃO COM FILTRO DE DATA
// ========================================

// Se você tem filtro de data, pode usar assim:
const prepareEmailReportWithDateFilter = () => {
  // Filtrar vendas por data
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = filteredSales.length;
  const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

  return {
    period: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
    totalSales,
    salesCount,
    averageTicket,
    sales: filteredSales.map(sale => ({
      date: sale.createdAt,
      clientName: sale.clientName || 'Venda Direta',
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      productName: sale.productName || 'Venda Customizada',
      quantity: sale.quantity,
    })),
  };
};

// ========================================
// DICAS IMPORTANTES
// ========================================

/*
1. O botão fica desabilitado se não houver vendas
2. O modal fecha automaticamente após enviar
3. Mostra mensagem de sucesso ou erro
4. Valida o email antes de enviar
5. Usa as cores profissionais do novo design

ONDE ADICIONAR:
- Procure por "Nova Venda" ou botões similares
- Adicione o novo botão ao lado
- Mantenha o mesmo estilo visual

TESTAR:
1. Clique no botão "Enviar Relatório"
2. Digite seu email
3. Clique em "Enviar Email"
4. Verifique sua caixa de entrada
*/
