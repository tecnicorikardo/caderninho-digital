import React, { useState, useEffect } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';


interface SmartBriefingModalProps {
  businessData: {
    sales: any[];
    products: any[];
    clients: any[];
  };
  onClose: () => void;
}

export const SmartBriefingModal: React.FC<SmartBriefingModalProps> = ({ businessData, onClose }) => {
  const { isMobile } = useWindowSize();
  const [briefing, setBriefing] = useState<any>(null);

  useEffect(() => {
    if (businessData) {
      generateBriefing();
    }
  }, [businessData]);

  const generateBriefing = () => {
    const today = new Date();
    const todayStr = today.toDateString();

    // 1. Análise de Vendas de Hoje
    const todaySales = businessData.sales.filter(sale => {
      const saleDate = sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt);
      return saleDate.toDateString() === todayStr;
    });

    const totalToday = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    // 2. Maior Venda (Geral ou do Dia - priorizando do dia se houver)
    const sortedSales = [...businessData.sales].sort((a, b) => b.total - a.total);
    const topSale = sortedSales.length > 0 ? sortedSales[0] : null;

    // 3. Estoque Baixo
    const lowStockProducts = businessData.products.filter(p => p.quantity <= (p.minStock || 5));

    // 4. Fiados Pendentes
    const pendingFiados = businessData.sales.filter(sale => 
      sale.paymentMethod === 'fiado' && 
      (sale.remainingAmount > 0) &&
      sale.paymentStatus !== 'pago'
    );
    const totalPending = pendingFiados.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0);

    // 5. Alertas de Vencimento
    const dueAlerts: any[] = [];
    
    pendingFiados.forEach((sale: any) => {
      if (sale.dueDate) {
        const dueDate = sale.dueDate.toDate ? sale.dueDate.toDate() : new Date(sale.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) { // Atrasado
          dueAlerts.push({
            type: 'late',
            clientName: sale.clientName || 'Cliente',
            amount: sale.remainingAmount || sale.total,
            days: Math.abs(diffDays)
          });
        } else if (diffDays === 0) { // Vence Hoje
          dueAlerts.push({
            type: 'today',
            clientName: sale.clientName || 'Cliente',
            amount: sale.remainingAmount || sale.total
          });
        } else if (diffDays === 1) { // Vence Amanhã
          dueAlerts.push({
            type: 'tomorrow',
            clientName: sale.clientName || 'Cliente',
            amount: sale.remainingAmount || sale.total
          });
        }
      }
    });

    setBriefing({
      todaySalesCount: todaySales.length,
      totalToday,
      topSale,
      lowStockCount: lowStockProducts.length,
      lowStockItems: lowStockProducts.slice(0, 3), // Pegar top 3
      pendingFiadosCount: pendingFiados.length,
      totalPending,
      dueAlerts: dueAlerts.sort((a, b) => {
        // Prioridade: Hoje > Atrasado > Amanhã
        const score = (type: string) => type === 'today' ? 3 : type === 'late' ? 2 : 1;
        return score(b.type) - score(a.type);
      })
    });
  };

  if (!briefing) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(5px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        width: isMobile ? '90%' : '500px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        position: 'relative',
        animation: 'slideUp 0.4s ease'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderBottom: '1px solid #f1f5f9',
          color: '#1e293b',
          position: 'relative',
          borderRadius: '24px 24px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
            🤖 Bom dia!
          </h2>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem', color: '#64748b' }}>
            Aqui está o resumo inteligente do seu negócio.
          </p>
          
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          
          {/* Vendas de Hoje */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Performance Hoje</h3>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px' 
            }}>
              <div style={{ 
                background: '#f0f9ff', 
                padding: '16px', 
                borderRadius: '16px',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', marginBottom: '4px' }}>Vendido Hoje</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                  R$ {briefing.totalToday.toFixed(2)}
                </div>
              </div>
              <div style={{ 
                background: '#f0f9ff', 
                padding: '16px', 
                borderRadius: '16px',
                border: '1px solid #e0f2fe'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', marginBottom: '4px' }}>Quantidade</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                  {briefing.todaySalesCount} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>vendas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Destaque Maior Venda */}
          {briefing.topSale && (
            <div style={{ marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🏆</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Maior Venda Registrada</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #fde68a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '1.2rem' }}>
                    R$ {briefing.topSale.total.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                    Cliente: {briefing.topSale.clientName || 'Não identificado'}
                  </div>
                </div>
                <div style={{ fontSize: '24px' }}>🥇</div>
              </div>
            </div>
          )}

          {/* Alertas (Estoque e Fiado) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Alertas de Vencimento */}
            {briefing.dueAlerts && briefing.dueAlerts.length > 0 && (
              <div style={{
                border: '2px solid #f59e0b',
                background: '#fffbeb',
                borderRadius: '16px',
                padding: '16px',
                animation: 'pulse 2s infinite'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span>📅</span>
                  <span style={{ fontWeight: 'bold', color: '#b45309' }}>Avisos de Cobrança</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {briefing.dueAlerts.map((alert: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '10px',
                      background: 'white',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        alert.type === 'today' ? '#ef4444' : 
                        alert.type === 'late' ? '#dc2626' : '#f59e0b'
                      }`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>
                          {alert.clientName}
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#b45309' }}>
                          R$ {alert.amount.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#666' }}>
                        {alert.type === 'today' ? '🔴 VENCE HOJE!' : 
                         alert.type === 'late' ? `⚠️ Atrasado ${alert.days} dia(s)` : 
                         '🔔 Vence amanhã'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Fiados */}
            <div style={{
              border: '1px solid #fee2e2',
              background: '#fef2f2',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📝</span>
                  <span style={{ fontWeight: 'bold', color: '#991b1b' }}>Fiados Pendentes</span>
                </div>
                <div style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {briefing.pendingFiadosCount}
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7f1d1d' }}>
                R$ {briefing.totalPending.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '4px' }}>
                Total a receber dos clientes
              </div>
            </div>

            {/* Estoque */}
            <div style={{
              border: '1px solid #ffedd5',
              background: '#fff7ed',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📦</span>
                  <span style={{ fontWeight: 'bold', color: '#9a3412' }}>Estoque Baixo</span>
                </div>
                {briefing.lowStockCount > 0 ? (
                  <div style={{ 
                    background: '#f97316', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {briefing.lowStockCount}
                  </div>
                ) : (
                   <span style={{ fontSize: '1.2rem' }}>✅</span>
                )}
              </div>
              
              {briefing.lowStockCount > 0 ? (
                <div>
                   <div style={{ fontSize: '0.9rem', color: '#c2410c', marginBottom: '8px' }}>
                     Itens precisando de reposição:
                   </div>
                   {briefing.lowStockItems.map((item: any, idx: number) => (
                     <div key={idx} style={{ 
                       padding: '4px 8px', 
                       background: 'rgba(255,255,255,0.5)', 
                       borderRadius: '6px',
                       marginBottom: '4px',
                       fontSize: '0.85rem',
                       color: '#9a3412',
                       display: 'flex',
                       justifyContent: 'space-between'
                     }}>
                       <span>{item.name}</span>
                       <strong>剩 {item.quantity}</strong>
                     </div>
                   ))}
                </div>
              ) : (
                <div style={{ color: '#9a3412', fontSize: '0.9rem' }}>
                  Tudo certo! Nenhum produto em falta.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Entendido, ir para o painel
          </button>
        </div>

      </div>
    </div>
  );
};
