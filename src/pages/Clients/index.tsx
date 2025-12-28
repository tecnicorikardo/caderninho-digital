import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useWindowSize } from '../../hooks/useWindowSize';
import { MobileButton } from '../../components/MobileButton';

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
  const { isMobile } = useWindowSize();
  const { guardClient } = useSubscriptionGuard();
  const { incrementUsage } = useSubscription();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    if (!user) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      // Import dynamically to avoid loading if not used
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Dados do Excel (Clientes):', jsonData);

      let successCount = 0;
      let errorCount = 0;

      for (const rawRow of jsonData as any[]) {
        try {
          // Normalizar chaves para minúsculas e sem espaços extras
          const row: any = {};
          Object.keys(rawRow).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            row[cleanKey] = rawRow[key];
          });

          // Mapeamento mais robusto para clientes
          const clientData = {
            name: row['nome'] || row['name'] || row['cliente'] || row['client'] || '',
            email: row['email'] || row['e-mail'] || row['mail'] || '',
            phone: row['telefone'] || row['phone'] || row['celular'] || row['fone'] || '',
            address: {
              street: row['endereço'] || row['endereco'] || row['address'] || row['rua'] || '',
              city: row['cidade'] || row['city'] || '',
              state: row['estado'] || row['state'] || row['uf'] || '',
              zipCode: row['cep'] || row['zipcode'] || row['zip'] || ''
            }
          };

          // Validações básicas
          if (!clientData.name) {
            console.warn('Cliente sem nome ignorado (verifique os cabeçalhos da planilha):', rawRow);
            continue;
          }

          if (!clientData.email) {
            console.warn('Cliente sem email ignorado:', rawRow);
            continue;
          }

          if (!clientData.phone) {
            console.warn('Cliente sem telefone ignorado:', rawRow);
            continue;
          }

          // Criar cliente
          await clientService.createClient(clientData, user.uid);

          // Incrementar contador de uso
          await incrementUsage('client');

          successCount++;
        } catch (err) {
          console.error('Erro ao importar linha:', rawRow, err);
          errorCount++;
        }
      }

      toast.success(`${successCount} clientes importados com sucesso!`);
      if (errorCount > 0) {
        toast.error(`${errorCount} falhas na importação.`);
      }
      
      loadClients();
    } catch (error) {
      console.error('Erro ao processar arquivo Excel:', error);
      toast.error('Erro ao processar arquivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Filtrar clientes em tempo real
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

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

    // Verificar limites de assinatura antes de criar cliente (apenas para novos clientes)
    if (!editingClient && !guardClient()) {
      return;
    }



    try {
      if (editingClient) {
        // Atualizar cliente existente no Firebase
        await clientService.updateClient(editingClient.id, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente no Firebase
        await clientService.createClient(formData, user.uid);
        
        // Incrementar contador de uso
        await incrementUsage('client');
        
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
        }) as any[];
        
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
      `📱 Telefone: ${client.phone}\n`;

    // Adicionar endereço apenas se houver dados
    if (client.address.street || client.address.city || client.address.state || client.address.zipCode) {
      message += `📍 Endereço: `;
      if (client.address.street) message += `${client.address.street}, `;
      if (client.address.city) message += `${client.address.city}`;
      if (client.address.state) message += ` - ${client.address.state}`;
      message += `\n`;
      if (client.address.zipCode) message += `📮 CEP: ${client.address.zipCode}\n`;
    }
    message += `\n`;

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
    <SubscriptionGuard feature="o módulo de clientes">
      <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '1rem' : '0',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ marginBottom: isMobile ? '0.5rem' : '0' }}>Clientes</h1>
          <MobileButton
            onClick={() => navigate('/')}
            variant="secondary"
            size="sm"
            icon="←"
            style={{ marginTop: '0.5rem' }}
          >
            Voltar ao Dashboard
          </MobileButton>
        </div>
        
        <div className={isMobile ? 'btn-group-mobile' : ''} style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={{ display: 'none' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
            />
          </div>

          <MobileButton
            onClick={handleCreateClient}
            variant="success"
            icon="+"
          >
            Novo Cliente
          </MobileButton>

          <MobileButton
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            icon="📤"
          >
            Importar Excel
          </MobileButton>

          <MobileButton
            onClick={() => {
              const element = document.getElementById('excel-guide-clients');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            variant="outline"
            icon="❓"
          >
            Como Importar?
          </MobileButton>
        </div>
      </div>

      {/* Campo de Busca Inteligente */}
      <div style={{
        marginBottom: '2rem',
        position: 'relative'
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.2rem'
          }}>
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              border: '2px solid #e1e5e9',
              borderRadius: '12px',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e1e5e9';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#666',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </div>
        )}
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
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="Rua, número, bairro (opcional)"
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
                  placeholder="Cidade (opcional)"
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
                  placeholder="Estado (opcional)"
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
                  placeholder="CEP (opcional)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="btn-group-mobile" style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
                flexDirection: isMobile ? 'column-reverse' : 'row'
              }}>
                <MobileButton
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="secondary"
                >
                  Cancelar
                </MobileButton>
                <MobileButton
                  type="submit"
                  variant="success"
                  icon={editingClient ? '✅' : '➕'}
                >
                  {editingClient ? 'Atualizar' : 'Salvar'}
                </MobileButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          {searchTerm ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>Nenhum cliente encontrado</h3>
              <p>Tente buscar por outro nome, email ou telefone</p>
            </>
          ) : (
            <>
              <h3>Nenhum cliente cadastrado</h3>
              <p>Clique em "Novo Cliente" para começar</p>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {filteredClients.map((client) => (
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
                {(client.address.street || client.address.city || client.address.state || client.address.zipCode) && (
                  <div>
                    <strong>📍 Endereço:</strong><br />
                    {client.address.street && <>{client.address.street}<br /></>}
                    {(client.address.city || client.address.state) && (
                      <>{client.address.city}{client.address.city && client.address.state ? ' - ' : ''}{client.address.state}<br /></>
                    )}
                    {client.address.zipCode && <>CEP: {client.address.zipCode}</>}
                  </div>
                )}
              </div>

              <div className={isMobile ? 'btn-group-mobile' : 'btn-group-mobile-row'} style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <MobileButton
                  onClick={() => handleEditClient(client)}
                  variant="primary"
                  icon="✏️"
                  size="sm"
                >
                  Editar
                </MobileButton>
                
                <MobileButton
                  onClick={() => {
                    toast.loading('Buscando histórico de vendas...', { id: 'share-client' });
                    handleShareClient(client).finally(() => {
                      toast.dismiss('share-client');
                    });
                  }}
                  variant="success"
                  icon="📱"
                  size="sm"
                  style={{
                    background: 'linear-gradient(135deg, #128C7E 0%, #25d366 100%)'
                  }}
                >
                  WhatsApp
                </MobileButton>
                
                {/* Botão de debug - remover em produção */}
                {process.env.NODE_ENV === 'development' && (
                  <MobileButton
                    onClick={async () => {
                      console.log('🔍 DEBUG: Testando busca de vendas para:', client.name);
                      await handleShareClient(client);
                    }}
                    variant="secondary"
                    icon="🔍"
                    size="sm"
                  >
                    Debug
                  </MobileButton>
                )}
                
                <MobileButton
                  onClick={() => handleDeleteClient(client.id)}
                  variant="danger"
                  icon="🗑️"
                  size="sm"
                >
                  Excluir
                </MobileButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guia de Importação Excel */}
      <div 
        id="excel-guide-clients"
        style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px solid #e9ecef'
        }}
      >
        <h2 style={{ 
          color: '#495057', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          👥 Como Importar Clientes via Excel
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>📝 Estrutura da Planilha</h3>
          <p style={{ marginBottom: '1rem', color: '#495057' }}>
            Crie uma planilha Excel (.xlsx ou .xls) com as seguintes colunas na primeira linha:
          </p>
          
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong style={{ color: '#dc3545' }}>nome*</strong>
                <div style={{ color: '#6c757d' }}>Nome completo</div>
              </div>
              <div>
                <strong style={{ color: '#dc3545' }}>email*</strong>
                <div style={{ color: '#6c757d' }}>Email válido</div>
              </div>
              <div>
                <strong style={{ color: '#dc3545' }}>telefone*</strong>
                <div style={{ color: '#6c757d' }}>Número de telefone</div>
              </div>
              <div>
                <strong>endereco</strong>
                <div style={{ color: '#6c757d' }}>Rua, número, bairro</div>
              </div>
              <div>
                <strong>cidade</strong>
                <div style={{ color: '#6c757d' }}>Nome da cidade</div>
              </div>
              <div>
                <strong>estado</strong>
                <div style={{ color: '#6c757d' }}>Estado ou UF</div>
              </div>
              <div>
                <strong>cep</strong>
                <div style={{ color: '#6c757d' }}>Código postal</div>
              </div>
            </div>
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#fff3cd', 
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#856404'
            }}>
              <strong>* Campos obrigatórios:</strong> nome, email e telefone são obrigatórios
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>📊 Exemplo de Planilha</h3>
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>nome</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>email</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>telefone</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>endereco</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>cidade</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>estado</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #dee2e6', textAlign: 'left' }}>cep</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>João Silva</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>joao@email.com</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>(11) 99999-1234</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Rua das Flores, 123</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>São Paulo</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>SP</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>01234-567</td>
                </tr>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Maria Santos</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>maria@email.com</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>(11) 88888-5678</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Av. Principal, 456</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Rio de Janeiro</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>RJ</td>
                  <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>20000-000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>⚠️ Dicas Importantes</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 Formatação
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d' }}>
                <li>Use a primeira linha para os cabeçalhos</li>
                <li>Não deixe linhas vazias entre os dados</li>
                <li>Use emails válidos (ex: nome@email.com)</li>
                <li>Telefones podem ter ou não formatação</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📱 Integração
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d' }}>
                <li>Clientes importados aparecem nas vendas</li>
                <li>Histórico de compras é vinculado automaticamente</li>
                <li>Compartilhamento via WhatsApp disponível</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔄 Nomes Alternativos
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#6c757d', fontSize: '0.85rem' }}>
                <li><strong>nome:</strong> name, cliente, client</li>
                <li><strong>email:</strong> e-mail, mail</li>
                <li><strong>telefone:</strong> phone, celular, fone</li>
                <li><strong>endereco:</strong> address, rua</li>
                <li><strong>estado:</strong> state, uf</li>
                <li><strong>cep:</strong> zipcode, zip</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h4 style={{ color: '#0c5460', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚀 Passo a Passo
          </h4>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#0c5460' }}>
            <li style={{ marginBottom: '0.5rem' }}>Crie uma planilha Excel com as colunas acima</li>
            <li style={{ marginBottom: '0.5rem' }}>Preencha os dados dos seus clientes</li>
            <li style={{ marginBottom: '0.5rem' }}>Certifique-se de que nome, email e telefone estão preenchidos</li>
            <li style={{ marginBottom: '0.5rem' }}>Salve o arquivo como .xlsx ou .xls</li>
            <li style={{ marginBottom: '0.5rem' }}>Clique no botão "Importar Excel" acima</li>
            <li style={{ marginBottom: '0.5rem' }}>Selecione seu arquivo e aguarde a importação</li>
            <li>Pronto! Seus clientes serão importados automaticamente</li>
          </ol>
        </div>
      </div>
      </div>
    </SubscriptionGuard>
  );
}