import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
}

export function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Carregar clientes do Firebase (fonte principal)
      try {
        const firebaseClients = await clientService.getClients(user.uid);
        setClients(firebaseClients);
        // Salvar no localStorage como cache
        localStorage.setItem(`clients_${user.uid}`, JSON.stringify(firebaseClients));
      } catch (error) {
        console.log('Erro ao carregar do Firebase, usando localStorage:', error);
        // Fallback: carregar do localStorage se Firebase falhar
        const savedClients = localStorage.getItem(`clients_${user.uid}`);
        if (savedClients) {
          const parsedClients = JSON.parse(savedClients).map((client: any) => ({
            ...client,
            createdAt: new Date(client.createdAt)
          }));
          setClients(parsedClients);
        } else {
          setClients([]);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar clientes');
      console.error('Erro:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: { street: '', city: '', state: '', zipCode: '' }
    });
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: { ...client.address }
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingClient) {
        // Atualizar cliente existente no Firebase
        await clientService.updateClient(editingClient.id, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente no Firebase
        await clientService.createClient(formData, user.uid);
        toast.success('Cliente criado com sucesso!');
      }
      
      setShowForm(false);
      loadClients(); // Recarregar do Firebase e atualizar cache
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      // Deletar cliente do Firebase (fonte principal)
      await clientService.deleteClient(clientId);
      
      toast.success('Cliente excluído com sucesso!');
      loadClients(); // Recarregar do Firebase e atualizar cache
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleShareClient = async (client: Client) => {
    if (!user) return;
    
    // Buscar histórico de compras do cliente do Firebase e localStorage
    let clientSales: any[] = [];
    let totalSpent = 0;
    let totalPending = 0;
    
    try {
      // 1. Buscar vendas do Firebase (fonte principal)
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        const salesQuery = query(collection(db, 'sales'), where('userId', '==', user.uid));
        const salesSnapshot = await getDocs(salesQuery);
        
        const firebaseSales = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        
        // Filtrar vendas do cliente específico
        clientSales = firebaseSales.filter((sale: any) => {
          const matchById = sale.clientId === client.id;
          const matchByName = sale.clientName && 
            sale.clientName.toLowerCase().trim() === client.name.toLowerCase().trim();
          
          return matchById || matchByName;
        });
        
        console.log(`🔍 Buscando vendas para cliente:`, {
          clientId: client.id,
          clientName: client.name,
          totalSales: firebaseSales.length,
          clientSales: clientSales.length
        });
        
        // Debug: mostrar algumas vendas para verificar
        if (firebaseSales.length > 0) {
          console.log('📊 Exemplo de vendas encontradas:', firebaseSales.slice(0, 5).map(sale => ({
            id: sale.id,
            clientId: sale.clientId,
            clientName: sale.clientName,
            total: sale.total,
            createdAt: sale.createdAt
          })));
          
          // Debug: verificar se alguma venda tem o clientId ou clientName
          const salesWithClient = firebaseSales.filter(sale => 
            sale.clientId || sale.clientName
          );
          console.log(`👥 Vendas com cliente definido: ${salesWithClient.length}/${firebaseSales.length}`);
          
          // Debug: mostrar vendas que poderiam ser do cliente
          const possibleMatches = firebaseSales.filter(sale => {
            const hasClientId = sale.clientId === client.id;
            const hasClientName = sale.clientName && 
              sale.clientName.toLowerCase().includes(client.name.toLowerCase());
            return hasClientId || hasClientName;
          });
          
          if (possibleMatches.length > 0) {
            console.log('🎯 Possíveis correspondências encontradas:', possibleMatches);
          } else {
            console.log('❌ Nenhuma correspondência encontrada. Verificando critérios...');
            console.log('🔍 Critérios de busca:', {
              procurandoClientId: client.id,
              procurandoClientName: client.name.toLowerCase(),
              vendasComClientId: firebaseSales.filter(s => s.clientId).length,
              vendasComClientName: firebaseSales.filter(s => s.clientName).length
            });
          }
        }
        
      } catch (error) {
        console.warn('⚠️ Erro ao buscar vendas do Firebase, tentando localStorage:', error);
        
        // Fallback: buscar do localStorage
        const savedSales = localStorage.getItem(`sales_${user.uid}`);
        if (savedSales) {
          const allSales = JSON.parse(savedSales).map((sale: any) => ({
            ...sale,
            createdAt: new Date(sale.createdAt)
          }));
          
          clientSales = allSales.filter((sale: any) => 
            sale.clientId === client.id || 
            (sale.clientName && sale.clientName.toLowerCase() === client.name.toLowerCase())
          );
          
          console.log(`📦 Encontradas ${clientSales.length} vendas do cliente ${client.name} no localStorage`);
        }
      }
      
      // Calcular totais
      totalSpent = clientSales.reduce((sum: number, sale: any) => {
        const paidAmount = sale.paidAmount || sale.total || 0;
        return sum + paidAmount;
      }, 0);
      
      totalPending = clientSales.reduce((sum: number, sale: any) => {
        const remainingAmount = sale.remainingAmount || 0;
        return sum + remainingAmount;
      }, 0);
      
    } catch (error) {
      console.error('❌ Erro ao buscar vendas do cliente:', error);
      toast.error('Erro ao buscar histórico de vendas');
      return;
    }

    let message = `*Cliente: ${client.name}*\n\n` +
      `📧 Email: ${client.email}\n` +
      `📱 Telefone: ${client.phone}\n` +
      `📍 Endereço: ${client.address.street}, ${client.address.city} - ${client.address.state}\n` +
      `📮 CEP: ${client.address.zipCode}\n\n`;

    if (clientSales.length > 0) {
      message += `💰 *HISTÓRICO DE COMPRAS*\n`;
      message += `📊 Total de compras: ${clientSales.length}\n`;
      message += `💵 Total gasto: R$ ${totalSpent.toFixed(2)}\n`;
      
      if (totalPending > 0) {
        message += `⏳ Valor pendente: R$ ${totalPending.toFixed(2)}\n`;
      }
      
      message += `\n*ÚLTIMAS COMPRAS:*\n`;
      
      // Mostrar as 5 últimas compras
      const recentSales = clientSales
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      recentSales.forEach((sale: any, index: number) => {
        const saleDate = new Date(sale.createdAt).toLocaleDateString('pt-BR');
        
        // Determinar status do pagamento
        let statusIcon = '✅';
        let paymentStatus = 'pago';
        
        if (sale.paymentStatus) {
          paymentStatus = sale.paymentStatus;
        } else if (sale.remainingAmount && sale.remainingAmount > 0) {
          paymentStatus = sale.paidAmount > 0 ? 'parcial' : 'pendente';
        }
        
        statusIcon = paymentStatus === 'pago' ? '✅' : 
                    paymentStatus === 'parcial' ? '🟡' : '🔴';
        
        message += `\n${index + 1}. ${saleDate} ${statusIcon}\n`;
        
        const saleTotal = sale.total || (sale.price * sale.quantity) || 0;
        const paymentMethod = sale.paymentMethod || 'não informado';
        
        message += `   Total: R$ ${saleTotal.toFixed(2)} (${paymentMethod})\n`;
        
        // Mostrar produtos (diferentes formatos de venda)
        if (sale.products && sale.products.length > 0) {
          // Venda com múltiplos produtos
          const mainProducts = sale.products.slice(0, 2);
          message += `   Produtos: ${mainProducts.map((p: any) => `${p.name} (${p.quantity}x)`).join(', ')}`;
          if (sale.products.length > 2) {
            message += ` +${sale.products.length - 2} mais`;
          }
          message += `\n`;
        } else if (sale.productName) {
          // Venda simples com um produto
          const quantity = sale.quantity || 1;
          message += `   Produto: ${sale.productName} (${quantity}x)\n`;
        } else {
          // Venda livre
          message += `   Venda livre\n`;
        }
        
        const remainingAmount = sale.remainingAmount || 0;
        if (remainingAmount > 0) {
          message += `   Pendente: R$ ${remainingAmount.toFixed(2)}\n`;
        }
      });
      
      if (clientSales.length > 5) {
        message += `\n... e mais ${clientSales.length - 5} compras anteriores`;
      }
    } else {
      message += `📝 *Nenhuma compra registrada ainda*\n\n`;
      message += `💡 *Dica:* Certifique-se de que as vendas foram feitas selecionando este cliente ou usando exatamente o nome "${client.name}"`;
    }
    
    // Mostrar mensagem de sucesso
    if (clientSales.length > 0) {
      toast.success(`Encontradas ${clientSales.length} vendas para ${client.name}!`);
      console.log('✅ Resumo das vendas encontradas:', {
        cliente: client.name,
        totalVendas: clientSales.length,
        totalGasto: totalSpent,
        totalPendente: totalPending,
        vendas: clientSales.map(sale => ({
          id: sale.id,
          data: new Date(sale.createdAt).toLocaleDateString('pt-BR'),
          total: sale.total || (sale.price * sale.quantity) || 0,
          status: sale.paymentStatus || 'não definido'
        }))
      });
    } else {
      toast.error(`Nenhuma venda encontrada para ${client.name}`);
      console.log('❌ Debug: Nenhuma venda encontrada para o cliente:', {
        clienteId: client.id,
        clienteNome: client.name,
        totalVendasUsuario: 'verificar no console acima'
      });
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div>Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>Clientes</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        
        <button
          onClick={handleCreateClient}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Novo Cliente
        </button>
      </div>

      {/* Formulário Modal */}
      {showForm && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="(11) 99999-9999"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Endereço *
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  required
                  placeholder="Rua, número, bairro"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '0.5rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  required
                  placeholder="Cidade"
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  required
                  placeholder="Estado"
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, zipCode: e.target.value }
                  }))}
                  required
                  placeholder="CEP"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
      {clients.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>Nenhum cliente cadastrado</h3>
          <p>Clique em "Novo Cliente" para começar</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {clients.map((client) => (
            <div
              key={client.id}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                  {client.name}
                </h3>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                  Cadastrado em {client.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>📧 Email:</strong> {client.email}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>📱 Telefone:</strong> {client.phone}
                </div>
                <div>
                  <strong>📍 Endereço:</strong><br />
                  {client.address.street}<br />
                  {client.address.city} - {client.address.state}<br />
                  CEP: {client.address.zipCode}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleEditClient(client)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✏️ Editar
                </button>
                
                <button
                  onClick={() => {
                    toast.loading('Buscando histórico de vendas...', { id: 'share-client' });
                    handleShareClient(client).finally(() => {
                      toast.dismiss('share-client');
                    });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#25d366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  📱 WhatsApp
                </button>
                
                {/* Botão de debug - remover em produção */}
                <button
                  onClick={async () => {
                    console.log('🔍 DEBUG: Testando busca de vendas para:', client.name);
                    await handleShareClient(client);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🔍 Debug
                </button>
                
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}