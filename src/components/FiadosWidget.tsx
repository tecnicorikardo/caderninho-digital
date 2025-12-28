import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Sale {
  id: string;
  clientName?: string;
  total: number;
  remainingAmount: number;
  paymentStatus: string;
  createdAt: Date;
}

export function FiadosWidget() {
  const { user } = useAuth();
  const [fiadoSales, setFiadoSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiadoSummary();
  }, [user]);

  // Recarregar dados periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      loadFiadoSummary();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  const loadFiadoSummary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const salesQuery = query(
        collection(db, 'sales'),
        where('userId', '==', user.uid),
        where('paymentMethod', '==', 'fiado')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const salesData = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Sale;
      });

      // Filtrar apenas vendas com valor pendente
      const pendingSales = salesData.filter(sale => 
        sale.remainingAmount > 0 && sale.paymentStatus !== 'pago'
      );

      setFiadoSales(pendingSales);
    } catch (error) {
      console.error('Erro ao carregar resumo de fiados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDebt = () => {
    return fiadoSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
  };

  const getOverdueCount = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return fiadoSales.filter(sale => sale.createdAt < thirtyDaysAgo).length;
  };

  if (loading) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: '12px',
        border: '2px solid rgba(255, 193, 7, 0.3)'
      }}>
        <div>Carregando fiados...</div>
      </div>
    );
  }

  if (fiadoSales.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '20px',
        border: '2px solid #28a745',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(40, 167, 69, 0.15)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <div style={{ 
          fontWeight: 'bold', 
          color: '#28a745', 
          fontSize: '1.3rem',
          marginBottom: '0.5rem'
        }}>
          Parabéns! Sem Pendências!
        </div>
        <div style={{ 
          fontSize: '1rem', 
          color: '#666',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          Todos os clientes estão em dia.<br/>
          Seu controle financeiro está perfeito! ✨
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#d4edda',
            borderRadius: '12px',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
            <div style={{ fontWeight: 'bold', color: '#155724', fontSize: '0.9rem' }}>
              Zero Inadimplência
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            borderRadius: '12px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>💰</div>
            <div style={{ fontWeight: 'bold', color: '#856404', fontSize: '0.9rem' }}>
              Fluxo Saudável
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '20px',
      border: '2px solid #FF6B6B',
      boxShadow: '0 8px 32px rgba(255, 107, 107, 0.15)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
          borderRadius: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
        }}>
          📝
        </div>
        <div>
          <strong style={{ 
            color: '#FF6B6B', 
            fontSize: '1.3rem',
            display: 'block'
          }}>
            Fiados Pendentes
          </strong>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Requer atenção
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>👥 Clientes devendo:</span>
          <span style={{ fontWeight: 'bold', color: '#FF6B6B', fontSize: '1.1rem' }}>
            {fiadoSales.length}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>💰 Valor total:</span>
          <span style={{ fontWeight: 'bold', color: '#FF6B6B', fontSize: '1.2rem' }}>
            R$ {getTotalDebt().toFixed(2)}
          </span>
        </div>
        
        {getOverdueCount() > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>⚠️ Vencidos (+30 dias):</span>
            <span style={{ fontWeight: 'bold', color: '#FF9500' }}>
              {getOverdueCount()}
            </span>
          </div>
        )}
        
        <div style={{ 
          marginTop: '0.5rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid #e1e5e9' 
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
            Próximos a receber:
          </div>
          {fiadoSales
            .sort((a, b) => b.remainingAmount - a.remainingAmount)
            .slice(0, 3)
            .map((sale) => (
              <div key={sale.id} style={{ 
                fontSize: '0.85rem', 
                color: '#333',
                marginBottom: '0.25rem'
              }}>
                • {sale.clientName || 'Cliente'}: <strong>R$ {sale.remainingAmount.toFixed(2)}</strong>
              </div>
            ))}
          {fiadoSales.length > 3 && (
            <div style={{ fontSize: '0.8rem', color: '#FF9500', fontStyle: 'italic', marginTop: '0.5rem' }}>
              ... e mais {fiadoSales.length - 3} cliente(s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}