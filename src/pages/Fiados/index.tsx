import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { clientService } from '../../services/clientService';
import EmailReportModal from '../../components/EmailReportModal';

interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  products: any[];
  total: number;
  paymentMethod: string;
  paymentStatus: 'pago' | 'pendente' | 'parcial';
  paidAmount: number;
  remainingAmount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: 'dinheiro' | 'pix';
  date: Date;
  notes?: string;
}

export function Fiados() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fiadoSales, setFiadoSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix'>('dinheiro');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);

  useEffect(() => {
    loadFiadoSales();
  }, []);

  // Recarregar dados quando a página for focada
  useEffect(() => {
    const handleFocus = () => {
      loadFiadoSales();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadFiadoSales = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Carregar vendas fiado do Firebase
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
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Sale;
      });

      // Filtrar apenas vendas com valor pendente
      const pendingSales = salesData.filter(sale => 
        sale.remainingAmount > 0 && sale.paymentStatus !== 'pago'
      );

      setFiadoSales(pendingSales);
      
      // Carregar histórico de pagamentos
      const savedPayments = localStorage.getItem(`fiado_payments_${user.uid}`);
      if (savedPayments) {
        const parsedPayments = JSON.parse(savedPayments).map((payment: any) => ({
          ...payment,
          date: new Date(payment.date)
        }));
        setPayments(parsedPayments);
      }

    } catch (error) {
      console.error('Erro ao carregar vendas fiado:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailCollection = async (sale: Sale) => {
    let clientEmail = '';
    
    // Tentar buscar email do cliente se tiver ID
    if (sale.clientId) {
      try {
        const client = await clientService.getClientById(sale.clientId);
        if (client && client.email) {
          clientEmail = client.email;
        }
      } catch (error) {
        console.error('Erro ao buscar email do cliente:', error);
      }
    }

    setEmailData({
      reportType: 'customer_collection',
      to: clientEmail,
      subject: `Lembrete de Pagamento - ${user?.displayName || 'Caderninho Digital'}`,
      reportData: {
        storeName: user?.displayName || 'Caderninho Digital', 
        clientName: sale.clientName,
        amount: sale.remainingAmount,
        saleDate: sale.createdAt,
        items: sale.products?.map(p => `${p.quantity}x ${p.name}`).join(', ') || 'Venda Fiado'
      }
    });
    setShowEmailModal(true);
  };

  const handleAddPayment = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.remainingAmount); // Sugerir pagamento total
    setPaymentMethod('dinheiro');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !user) return;

    if (paymentAmount <= 0 || paymentAmount > selectedSale.remainingAmount) {
      toast.error(`Valor deve ser entre R$ 0,01 e R$ ${selectedSale.remainingAmount.toFixed(2)}`);
      return;
    }

    try {
      // Calcular novos valores
      const newPaidAmount = selectedSale.paidAmount + paymentAmount;
      const newRemainingAmount = selectedSale.remainingAmount - paymentAmount;
      const newPaymentStatus = newRemainingAmount <= 0 ? 'pago' : 'parcial';

      // Atualizar venda no Firebase
      const saleRef = doc(db, 'sales', selectedSale.id);
      await updateDoc(saleRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      });

      // Registrar pagamento no histórico
      const newPayment: Payment = {
        id: Date.now().toString(),
        saleId: selectedSale.id,
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date(),
        notes: paymentNotes
      };

      const savedPayments = localStorage.getItem(`fiado_payments_${user.uid}`);
      const paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
      paymentsList.push(newPayment);
      localStorage.setItem(`fiado_payments_${user.uid}`, JSON.stringify(paymentsList));

      // Registrar receita no financeiro
      await registerPaymentInFinance(newPayment, selectedSale);

      toast.success(`Pagamento de R$ ${paymentAmount.toFixed(2)} registrado com sucesso!`);
      setShowPaymentModal(false);
      setSelectedSale(null);
      loadFiadoSales();

    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  const registerPaymentInFinance = async (payment: Payment, sale: Sale) => {
    if (!user) return;

    try {
      const financialTransaction = {
        id: `fiado_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'receita',
        category: 'Vendas',
        description: `Pagamento fiado - ${sale.clientName || 'Cliente'} (${payment.notes || 'Sem observações'})`,
        amount: payment.amount,
        date: new Date().toISOString(),
        paymentMethod: payment.method,
        status: 'pago',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        financialType: 'comercial',
        autoGenerated: true,
        fiadoPayment: true,
        saleId: sale.id
      };

      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactionsList = savedTransactions ? JSON.parse(savedTransactions) : [];
      transactionsList.push(financialTransaction);
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactionsList));

      console.log('✅ Pagamento fiado registrado no financeiro');
    } catch (error) {
      console.error('❌ Erro ao registrar no financeiro:', error);
    }
  };

  const getTotalDebt = () => {
    return fiadoSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
  };

  const shareSaleDetails = async (sale: Sale) => {
    const salePayments = getPaymentHistory(sale.id);
    
    // Criar mensagem detalhada
    let message = `📝 *PENDÊNCIA - ${sale.clientName || 'Cliente'}*\n\n`;
    message += `📅 Data da venda: ${sale.createdAt.toLocaleDateString('pt-BR')}\n\n`;
    message += `💰 *VALORES:*\n`;
    message += `• Total da compra: R$ ${sale.total.toFixed(2)}\n`;
    message += `• Já pago: R$ ${sale.paidAmount.toFixed(2)}\n`;
    message += `• *Falta pagar: R$ ${sale.remainingAmount.toFixed(2)}*\n\n`;
    
    // Adicionar histórico de pagamentos se houver
    if (salePayments.length > 0) {
      message += `📊 *HISTÓRICO DE PAGAMENTOS:*\n`;
      salePayments.forEach((payment, index) => {
        message += `${index + 1}. R$ ${payment.amount.toFixed(2)} - ${payment.date.toLocaleDateString('pt-BR')}`;
        if (payment.notes) {
          message += ` (${payment.notes})`;
        }
        message += `\n`;
      });
      message += `\n`;
    }
    
    // Adicionar produtos se houver
    if (sale.products && sale.products.length > 0) {
      message += `🛒 *PRODUTOS:*\n`;
      sale.products.forEach((product, index) => {
        message += `${index + 1}. ${product.name} - ${product.quantity}x R$ ${product.price.toFixed(2)} = R$ ${(product.quantity * product.price).toFixed(2)}\n`;
      });
      message += `\n`;
    }
    
    message += `---\n`;
    message += `📱 Caderninho Digital`;

    try {
      // Tentar usar Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `Pendência - ${sale.clientName || 'Cliente'}`,
          text: message
        });
        toast.success('Compartilhado com sucesso!');
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(message);
        toast.success('Mensagem copiada! Cole no WhatsApp ou onde desejar.');
      }
    } catch (error) {
      // Se falhar, tentar copiar para clipboard
      try {
        await navigator.clipboard.writeText(message);
        toast.success('Mensagem copiada! Cole no WhatsApp ou onde desejar.');
      } catch (clipboardError) {
        console.error('Erro ao compartilhar:', error);
        toast.error('Erro ao compartilhar. Tente novamente.');
      }
    }
  };

  const getPaymentHistory = (saleId: string) => {
    return payments.filter(payment => payment.saleId === saleId);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div>Carregando vendas fiado...</div>
      </div>
    );
  }

  return (
    <SubscriptionGuard feature="o módulo de fiados">
      <style>
        {`
          @media (max-width: 600px) {
            .fiado-buttons {
              flex-direction: column;
              width: 100%;
            }
            .fiado-buttons button {
              width: 100% !important;
              min-width: auto !important;
              margin-bottom: 0.25rem;
            }
          }
        `}
      </style>
      <div style={{ 
        minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem 2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5rem',
            fontWeight: 'bold'
          }}>
            📝 Gestão de Fiados
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            ← Voltar ao Dashboard
          </button>
          
          <button
            onClick={() => {
              console.log('🔍 Debug - Vendas fiado encontradas:', fiadoSales);
              console.log('🔍 Debug - Total de vendas:', fiadoSales.length);
              fiadoSales.forEach(sale => {
                console.log(`Venda ${sale.id}:`, {
                  clientName: sale.clientName,
                  total: sale.total,
                  paidAmount: sale.paidAmount,
                  remainingAmount: sale.remainingAmount,
                  paymentStatus: sale.paymentStatus,
                  paymentMethod: sale.paymentMethod
                });
              });
              loadFiadoSales(); // Recarregar dados
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              marginTop: '0.5rem'
            }}
          >
            🔍 Debug & Recarregar
          </button>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total em Aberto</div>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: getTotalDebt() > 0 ? '#dc3545' : '#28a745',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            R$ {getTotalDebt().toFixed(2)}
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        maxWidth: '1200px',
        margin: '0 auto 2rem auto'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#FF6B6B', fontSize: '1.1rem' }}>Clientes Devendo</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#FF6B6B' }}>
            {fiadoSales.length}
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#4ECDC4', fontSize: '1.1rem' }}>Valor Total</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#4ECDC4' }}>
            R$ {getTotalDebt().toFixed(2)}
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#FFE66D', fontSize: '1.1rem' }}>Ticket Médio</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#FFE66D' }}>
            R$ {fiadoSales.length > 0 ? (getTotalDebt() / fiadoSales.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Lista de Fiados */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ 
          margin: '0 0 2rem 0', 
          fontSize: '1.8rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          📋 Clientes com Pendências
        </h3>
        
        {fiadoSales.length === 0 ? (
          <div className="success-card" style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              color: '#4ECDC4',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>
              Parabéns! Sem Pendências!
            </h2>
            <p style={{ 
              margin: '0 0 2rem 0', 
              fontSize: '1.2rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.6'
            }}>
              Todos os seus clientes estão em dia com os pagamentos.<br/>
              Seu controle financeiro está impecável! 
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontWeight: 'bold', color: '#4ECDC4' }}>Controle Perfeito</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Zero inadimplência</div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <div style={{ fontWeight: 'bold', color: '#FFE66D' }}>Fluxo Saudável</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Pagamentos em dia</div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
                <div style={{ fontWeight: 'bold', color: '#FF6B6B' }}>Gestão Eficiente</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Continue assim!</div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={() => navigate('/sales')}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  marginRight: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(78, 205, 196, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
              >
                🛍️ Nova Venda
              </button>
              
              <button
                onClick={() => navigate('/clients')}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }}
              >
                👥 Gerenciar Clientes
              </button>
            </div>
          </div>
        ) : (
          <div className="scroll-container" style={{ 
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingBottom: '0.5rem'
          }}>
            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              minWidth: '650px'
            }}>
              {fiadoSales
                .sort((a, b) => b.remainingAmount - a.remainingAmount) // Maior dívida primeiro
                .map((sale) => {
                  const salePayments = getPaymentHistory(sale.id);
                  const daysSinceCreation = Math.floor((new Date().getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={sale.id} className={`fiado-card ${daysSinceCreation > 30 ? 'fiado-overdue' : ''}`} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: '#fff3cd',
                    borderRadius: '12px',
                    border: '2px solid #ffc107',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        marginBottom: '0.5rem' 
                      }}>
                        👤 {sale.clientName || 'Cliente não informado'}
                        {daysSinceCreation > 30 && (
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            ⚠️ +30 DIAS
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                        📅 Venda: {sale.createdAt.toLocaleDateString('pt-BR')} ({daysSinceCreation} dias atrás)
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                        💰 Total da venda: R$ {sale.total.toFixed(2)} | 
                        ✅ Já pago: R$ {sale.paidAmount.toFixed(2)}
                      </div>
                      
                      {salePayments.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#28a745' }}>
                          📊 {salePayments.length} pagamento(s) realizado(s)
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                        Valor Pendente
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#dc3545'
                      }}>
                        R$ {sale.remainingAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="fiado-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAddPayment(sale)}
                        className="payment-button"
                        style={{
                          fontSize: '0.9rem',
                          flex: '1',
                          minWidth: '150px'
                        }}
                      >
                        💰 Receber Pagamento
                      </button>
                      <button
                        onClick={() => shareSaleDetails(sale)}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#25D366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          flex: '1',
                          minWidth: '150px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#128C7E';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#25D366';
                        }}
                      >
                        📤 Compartilhar
                      </button>
                      <button
                        onClick={() => handleEmailCollection(sale)}
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: '#2b6cb0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          flex: '1',
                          minWidth: '150px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#2c5282';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#2b6cb0';
                        }}
                      >
                        📧 Cobrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && selectedSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#28a745' }}>
              💰 Registrar Pagamento
            </h2>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              marginBottom: '1.5rem' 
            }}>
              <div><strong>Cliente:</strong> {selectedSale.clientName}</div>
              <div><strong>Total da venda:</strong> R$ {selectedSale.total.toFixed(2)}</div>
              <div><strong>Já pago:</strong> R$ {selectedSale.paidAmount.toFixed(2)}</div>
              <div style={{ fontWeight: 'bold', color: '#dc3545' }}>
                <strong>Restante:</strong> R$ {selectedSale.remainingAmount.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Valor do Pagamento (R$) *
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0.01"
                  max={selectedSale.remainingAmount}
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  💡 Máximo: R$ {selectedSale.remainingAmount.toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'dinheiro' | 'pix')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="pix">📱 PIX</option>
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Observações (opcional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Pagamento parcial, desconto aplicado..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  💰 Registrar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Email */}
      {showEmailModal && emailData && (
        <EmailReportModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          defaultTo={emailData.to}
          defaultSubject={emailData.subject}
          reportType={emailData.reportType}
          reportData={emailData.reportData}
        />
      )}
      </div>
    </SubscriptionGuard>
  );
}