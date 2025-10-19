import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';
import { saleService } from '../../services/saleService';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const clearAllData = async () => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    if (deleteConfirmation !== 'APAGAR TUDO') {
      toast.error('Digite "APAGAR TUDO" para confirmar');
      return;
    }

    try {
      const loadingToast = toast.loading('Apagando transações...');
      
      // Apagar apenas transações do localStorage
      const key = `transactions_${user.uid}`;
      console.log('Apagando transações do localStorage:', key);
      localStorage.removeItem(key);
      
      toast.dismiss(loadingToast);
      toast.success('Todas as transações foram apagadas!');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Erro ao apagar dados:', error);
      toast.error('Erro ao apagar dados');
    }
  };

  const clearAllSystemData = async () => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    if (deleteConfirmation !== 'RESETAR SISTEMA') {
      toast.error('Digite "RESETAR SISTEMA" para confirmar');
      return;
    }

    try {
      const loadingToast = toast.loading('Resetando sistema completo...');
      
      // 1. Apagar dados do localStorage
      const localKeys = [
        `transactions_${user.uid}`,
        `sales_${user.uid}`,
        `clients_${user.uid}`,
        `products_${user.uid}`
      ];
      
      console.log('Apagando dados do localStorage...');
      localKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removido: ${key}`);
      });
      
      // 2. Apagar vendas do Firebase
      console.log('Apagando vendas do Firebase...');
      const salesQuery = query(
        collection(db, 'sales'),
        where('userId', '==', user.uid)
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesDeletePromises = salesSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'sales', docSnapshot.id))
      );
      await Promise.all(salesDeletePromises);
      console.log(`${salesSnapshot.docs.length} vendas removidas do Firebase`);
      
      // 3. Apagar clientes do Firebase
      console.log('Apagando clientes do Firebase...');
      const clientsQuery = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsDeletePromises = clientsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'clients', docSnapshot.id))
      );
      await Promise.all(clientsDeletePromises);
      console.log(`${clientsSnapshot.docs.length} clientes removidos do Firebase`);
      
      // 4. Apagar pagamentos relacionados às vendas do usuário
      console.log('Apagando pagamentos do Firebase...');
      const saleIds = salesSnapshot.docs.map(doc => doc.id);
      let paymentsDeleted = 0;
      
      if (saleIds.length > 0) {
        // Buscar pagamentos relacionados às vendas do usuário
        const allPaymentsSnapshot = await getDocs(collection(db, 'payments'));
        const userPayments = allPaymentsSnapshot.docs.filter(doc => 
          saleIds.includes(doc.data().saleId)
        );
        
        const paymentsDeletePromises = userPayments.map(docSnapshot => 
          deleteDoc(doc(db, 'payments', docSnapshot.id))
        );
        await Promise.all(paymentsDeletePromises);
        paymentsDeleted = userPayments.length;
      }
      
      console.log(`${paymentsDeleted} pagamentos removidos do Firebase`);
      
      toast.dismiss(loadingToast);
      toast.success('Sistema resetado completamente! Todos os dados foram apagados.');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      toast.error('Erro ao resetar sistema: ' + (error as Error).message);
    }
  };

  const checkStorageData = async () => {
    if (!user) return;
    
    try {
      const loadingToast = toast.loading('Verificando dados...');
      
      console.log('=== VERIFICAÇÃO COMPLETA DOS DADOS ===');
      console.log('User UID:', user.uid);
      
      // 1. Verificar localStorage
      console.log('\n--- LOCALSTORAGE ---');
      const localKeys = [
        `transactions_${user.uid}`,
        `sales_${user.uid}`,
        `clients_${user.uid}`,
        `products_${user.uid}`
      ];
      
      localKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`${key}: ${Array.isArray(parsed) ? parsed.length : 'não é array'} itens`);
          } catch {
            console.log(`${key}: dados corrompidos`);
          }
        } else {
          console.log(`${key}: vazio/não existe`);
        }
      });
      
      // 2. Verificar Firebase
      console.log('\n--- FIREBASE ---');
      
      // Verificar vendas
      const salesQuery = query(
        collection(db, 'sales'),
        where('userId', '==', user.uid)
      );
      const salesSnapshot = await getDocs(salesQuery);
      console.log(`Vendas no Firebase: ${salesSnapshot.docs.length} itens`);
      
      // Verificar clientes
      const clientsQuery = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      console.log(`Clientes no Firebase: ${clientsSnapshot.docs.length} itens`);
      
      // Verificar pagamentos (todos, pois não têm userId direto)
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      console.log(`Pagamentos no Firebase (todos): ${paymentsSnapshot.docs.length} itens`);
      
      console.log('\n=== FIM DA VERIFICAÇÃO ===');
      
      toast.dismiss(loadingToast);
      toast.success('Verificação concluída - veja o console do navegador');
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
      toast.error('Erro ao verificar dados');
    }
  };

  const exportData = async () => {
    if (!user) return;

    try {
      const loadingToast = toast.loading('Exportando backup completo...');
      
      // Dados do localStorage
      const localData = {
        transactions: JSON.parse(localStorage.getItem(`transactions_${user.uid}`) || '[]'),
        products: JSON.parse(localStorage.getItem(`products_${user.uid}`) || '[]')
      };

      // Dados do Firebase
      const firebaseData = {
        sales: [],
        clients: [],
        payments: []
      };

      // Buscar vendas do Firebase
      const salesQuery = query(
        collection(db, 'sales'),
        where('userId', '==', user.uid)
      );
      const salesSnapshot = await getDocs(salesQuery);
      firebaseData.sales = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Buscar clientes do Firebase
      const clientsQuery = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      firebaseData.clients = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Buscar pagamentos relacionados às vendas do usuário
      const saleIds = firebaseData.sales.map(sale => sale.id);
      if (saleIds.length > 0) {
        const paymentsSnapshot = await getDocs(collection(db, 'payments'));
        firebaseData.payments = paymentsSnapshot.docs
          .filter(doc => saleIds.includes(doc.data().saleId))
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      }

      const completeData = {
        ...localData,
        ...firebaseData,
        exportDate: new Date().toISOString(),
        userEmail: user.email,
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(completeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success(`Backup completo exportado! ${firebaseData.sales.length} vendas, ${firebaseData.clients.length} clientes, ${localData.transactions.length} transações`);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados: ' + (error as Error).message);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const loadingToast = toast.loading('Importando backup...');
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validar estrutura do backup
      if (!data.exportDate || !data.userEmail) {
        throw new Error('Arquivo de backup inválido - estrutura não reconhecida');
      }

      // Validar se é um backup do mesmo usuário (opcional - aviso)
      if (data.userEmail !== user.email) {
        const confirmImport = window.confirm(
          `Este backup é de outro usuário (${data.userEmail}). Deseja continuar a importação?`
        );
        if (!confirmImport) {
          toast.dismiss(loadingToast);
          return;
        }
      }

      let importedCount = 0;

      // Importar dados do localStorage
      if (data.transactions && Array.isArray(data.transactions)) {
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(data.transactions));
        importedCount += data.transactions.length;
      }

      if (data.products && Array.isArray(data.products)) {
        localStorage.setItem(`products_${user.uid}`, JSON.stringify(data.products));
        importedCount += data.products.length;
      }

      // Importar clientes para o Firebase
      if (data.clients && Array.isArray(data.clients)) {
        for (const client of data.clients) {
          const { id, userId, createdAt, updatedAt, ...clientData } = client;
          try {
            await clientService.createClient(clientData, user.uid);
            importedCount++;
          } catch (error) {
            console.warn('Erro ao importar cliente:', client.name, error);
          }
        }
      }

      // Importar vendas para o Firebase
      if (data.sales && Array.isArray(data.sales)) {
        for (const sale of data.sales) {
          const { id, userId, createdAt, updatedAt, subtotal, total, remainingAmount, paymentStatus, installments, ...saleData } = sale;
          try {
            await saleService.createSale(saleData, user.uid);
            importedCount++;
          } catch (error) {
            console.warn('Erro ao importar venda:', sale.id, error);
          }
        }
      }

      // Importar pagamentos para o Firebase (se existirem)
      if (data.payments && Array.isArray(data.payments)) {
        for (const payment of data.payments) {
          const { id, ...paymentData } = payment;
          try {
            // Adicionar pagamento diretamente ao Firestore
            await addDoc(collection(db, 'payments'), paymentData);
            importedCount++;
          } catch (error) {
            console.warn('Erro ao importar pagamento:', payment.id, error);
          }
        }
      }

      toast.dismiss(loadingToast);
      toast.success(`Backup importado com sucesso! ${importedCount} itens restaurados.`);
      
      // Limpar o input
      event.target.value = '';
      
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      toast.error('Erro ao importar backup: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ 
      padding: '1rem',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>⚙️ Configurações</h1>
      </div>

      {/* Seção Dados */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          💾 Gerenciar Dados
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Status do Sistema */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #28a745'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#28a745' }}>
              📊 Status do Sistema
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              ✅ Backup completo: Inclui dados do localStorage E Firebase<br/>
              ✅ Importação: Restaura todos os dados automaticamente<br/>
              ✅ Validação: Verifica integridade antes da importação<br/>
              ⚠️ Importante: Faça backup antes de importar dados
            </div>
          </div>

          {/* Verificar Dados */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #2196f3'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                🔍 Verificar Dados
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Verificar quais dados existem no localStorage (veja o console)
              </div>
            </div>
            
            <button
              onClick={checkStorageData}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔍 Verificar
            </button>
          </div>

          {/* Exportar Backup */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #28a745'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                📤 Exportar Backup Completo
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Baixar TODOS os dados (localStorage + Firebase) em arquivo JSON
              </div>
            </div>
            
            <button
              onClick={exportData}
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
              📥 Exportar
            </button>
          </div>

          {/* Importar Backup */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #2196f3'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                📥 Importar Backup
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Restaurar dados de um arquivo de backup JSON
              </div>
            </div>
            
            <label style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'inline-block'
            }}>
              📤 Importar
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Apagar Transações */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#856404' }}>
                🗑️ Apagar Transações
              </div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>
                Remove apenas transações financeiras do localStorage (mantém vendas, clientes, produtos)
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteConfirmation('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffc107',
                color: '#856404',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🗑️ Apagar
            </button>
          </div>

          {/* Reset Completo */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f8d7da',
            borderRadius: '8px',
            border: '1px solid #dc3545'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#721c24' }}>
                ⚠️ Reset Completo
              </div>
              <div style={{ fontSize: '0.9rem', color: '#721c24' }}>
                APAGA TUDO: vendas e clientes (Firebase) + produtos e transações (localStorage)
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteConfirmation('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              💥 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Seção Conta */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 Conta
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
              📧 {user?.email}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Conta logada no sistema
            </div>
          </div>
          
          <button
            onClick={logout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Seção Sobre */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ℹ️ Sobre
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              📓 Caderninho Digital
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#666' }}>
              Versão 1.0.0 - Sistema completo para gestão de vendas, estoque, clientes e finanças
            </div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>
              Desenvolvido com React + TypeScript + Firebase
            </div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #2196f3'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976d2' }}>
              📞 Contato e Suporte
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> tecnicorikardo@gmail.com
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>WhatsApp:</strong> (21) 97090-2074
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Entre em contato para suporte técnico, dúvidas ou sugestões
            </div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #28a745'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#28a745' }}>
              🚀 Funcionalidades
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#666' }}>
              <li>Gestão completa de clientes</li>
              <li>Controle de vendas e pagamentos</li>
              <li>Gerenciamento de estoque</li>
              <li>Controle financeiro</li>
              <li>Relatórios com IA offline</li>
              <li>Interface responsiva</li>
              <li>Dados seguros no Firebase</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>
              ⚠️ Confirmação de Exclusão
            </h3>
            
            <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Esta ação não pode ser desfeita. Escolha o que deseja apagar:
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  🗑️ Apagar apenas Transações
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Remove apenas as transações financeiras do localStorage (receitas e despesas).
                  Mantém vendas, clientes e produtos intactos.
                </div>
                <input
                  type="text"
                  placeholder='Digite "APAGAR TUDO" para confirmar'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}
                />
                <button
                  onClick={clearAllData}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#ffc107',
                    color: '#856404',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🗑️ Confirmar - Apagar Transações
                </button>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #dc3545'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#721c24' }}>
                  💥 Reset Completo do Sistema
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#721c24' }}>
                  APAGA TUDO: vendas e clientes (Firebase) + produtos e transações (localStorage).
                  Use apenas se quiser começar do zero.
                </div>
                <input
                  type="text"
                  placeholder='Digite "RESETAR SISTEMA" para confirmar'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}
                />
                <button
                  onClick={clearAllSystemData}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  💥 Confirmar - Reset Completo
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}