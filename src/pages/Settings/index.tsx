import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { SubscriptionStatus } from '../../components/SubscriptionStatus';
import { AsaasIntegration } from '../../components/AsaasIntegration';

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Estado do Perfil
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    cpf: '', // O usuário forneceu 10579769704, podemos preencher se vazio depois
    phone: '' // O usuário forneceu 21970902074
  });

  // Carregar dados user assim que abrir
  useState(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
        
        // Correção: getDocs retorna querySnapshot, vamos tentar pegar direto pelo ID se possível ou da query
        // A melhor forma é usar getDoc(doc(db, 'users', user.uid)) que já importamos
        const docSnap = await import('firebase/firestore').then(mod => mod.getDoc(userDocRef));
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            cpf: data.cpf || '',
            phone: data.phone || ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };
    loadProfile();
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        updatedAt: new Date()
      }, { merge: true });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

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
      
      // 4. Apagar pagamentos do usuário
      console.log('Apagando pagamentos do Firebase...');
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsDeletePromises = paymentsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'payments', docSnapshot.id))
      );
      await Promise.all(paymentsDeletePromises);
      console.log(`${paymentsSnapshot.docs.length} pagamentos removidos do Firebase`);
      
      // 5. ✅ CORRIGIDO: Apagar produtos do Firebase
      console.log('Apagando produtos do Firebase...');
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsDeletePromises = productsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'products', docSnapshot.id))
      );
      await Promise.all(productsDeletePromises);
      console.log(`${productsSnapshot.docs.length} produtos removidos do Firebase`);
      
      toast.dismiss(loadingToast);
      toast.success('Sistema resetado completamente! Todos os dados foram apagados (incluindo produtos).');
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
      
      // Verificar pagamentos do usuário
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      console.log(`Pagamentos no Firebase: ${paymentsSnapshot.docs.length} itens`);
      
      console.log('\n=== FIM DA VERIFICAÇÃO ===');
      
      toast.dismiss(loadingToast);
      toast.success('Verificação concluída - veja o console do navegador');
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
      toast.error('Erro ao verificar dados');
    }
  };

  const syncStockExpenses = async () => {
    if (!user) {
      toast.error('Usuário não encontrado');
      return;
    }

    try {
      const loadingToast = toast.loading('Sincronizando despesas de estoque...');
      
      console.log('🔄 Iniciando sincronização de despesas de estoque...');
      
      // 1. Buscar todos os produtos do Firebase
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      
      console.log(`📦 ${productsSnapshot.docs.length} produtos encontrados`);
      
      // 2. Calcular valor total do estoque
      let totalStockValue = 0;
      const productsData: any[] = [];
      
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const quantity = Number(data.quantity) || 0;
        const costPrice = Number(data.costPrice) || 0;
        const productValue = quantity * costPrice;
        
        totalStockValue += productValue;
        productsData.push({
          id: doc.id,
          name: data.name,
          quantity,
          costPrice,
          value: productValue
        });
        
        console.log(`  - ${data.name}: ${quantity} × R$ ${costPrice.toFixed(2)} = R$ ${productValue.toFixed(2)}`);
      });
      
      console.log(`💰 Valor total do estoque: R$ ${totalStockValue.toFixed(2)}`);
      
      // 3. Buscar despesas de estoque existentes
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      const stockExpenses = transactions.filter((t: any) => 
        t.type === 'despesa' && (t.stockGenerated || t.stockMovementGenerated)
      );
      
      let totalExpenses = 0;
      stockExpenses.forEach((expense: any) => {
        totalExpenses += Number(expense.amount) || 0;
      });
      
      console.log(`📊 Despesas de estoque registradas: R$ ${totalExpenses.toFixed(2)}`);
      console.log(`📊 Total de despesas de estoque: ${stockExpenses.length}`);
      
      // 4. Calcular diferença
      const difference = totalStockValue - totalExpenses;
      console.log(`📉 Diferença: R$ ${difference.toFixed(2)}`);
      
      if (Math.abs(difference) < 0.01) {
        toast.dismiss(loadingToast);
        toast.success('✅ Despesas já estão sincronizadas!');
        console.log('✅ Não há diferença para ajustar');
        return;
      }
      
      // 5. Criar transação de ajuste
      if (difference > 0) {
        // Falta registrar despesas
        const adjustmentTransaction = {
          id: `stock_adjustment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'despesa',
          category: 'Fornecedores',
          description: `Ajuste de Estoque - Sincronização (${productsData.length} produtos)`,
          amount: difference,
          date: new Date().toISOString(),
          paymentMethod: 'dinheiro',
          status: 'pago',
          userId: user.uid,
          createdAt: new Date().toISOString(),
          financialType: 'comercial',
          autoGenerated: true,
          stockGenerated: true,
          notes: 'Ajuste automático para sincronizar valor do estoque com despesas registradas'
        };
        
        transactions.push(adjustmentTransaction);
        localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactions));
        
        console.log('✅ Transação de ajuste criada:', adjustmentTransaction);
        
        toast.dismiss(loadingToast);
        toast.success(`✅ Ajuste de R$ ${difference.toFixed(2)} registrado!`);
      } else {
        // Há despesas a mais (não deveria acontecer, mas vamos avisar)
        toast.dismiss(loadingToast);
        toast.error(`⚠️ Há R$ ${Math.abs(difference).toFixed(2)} a mais em despesas. Verifique manualmente.`);
        console.warn('⚠️ Despesas registradas são maiores que o valor do estoque');
      }
      
      console.log('🎉 Sincronização concluída!');
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar despesas:', error);
      toast.error('Erro ao sincronizar despesas');
    }
  };

  const exportData = async () => {
    if (!user) return;

    try {
      const loadingToast = toast.loading('Exportando backup completo...');
      
      // Dados do localStorage
      const localData = {
        transactions: JSON.parse(localStorage.getItem(`transactions_${user.uid}`) || '[]')
      };

      // Dados do Firebase
      const firebaseData = {
        sales: [],
        clients: [],
        payments: [],
        products: [] // ✅ CORRIGIDO: Adicionar produtos do Firebase
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
      })) as any;

      // Buscar clientes do Firebase
      const clientsQuery = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      firebaseData.clients = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any;

      // Buscar pagamentos do usuário
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      firebaseData.payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any;

      // ✅ CORRIGIDO: Buscar produtos do Firebase
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', user.uid)
      );
      const productsSnapshot = await getDocs(productsQuery);
      firebaseData.products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any;

      const completeData = {
        ...localData,
        ...firebaseData,
        exportDate: new Date().toISOString(),
        userEmail: user.email,
        version: '1.1.0' // ✅ Atualizado versão
      };

      const dataStr = JSON.stringify(completeData, null, 2);
      const fileName = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Tentar usar Web Share API primeiro (melhor para mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([dataBlob], fileName, { type: 'application/json' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Backup Caderninho Digital',
              text: `Backup completo - ${firebaseData.sales.length} vendas, ${firebaseData.clients.length} clientes, ${firebaseData.products.length} produtos`
            });
            
            toast.dismiss(loadingToast);
            toast.success(`Backup compartilhado! ${firebaseData.sales.length} vendas, ${firebaseData.clients.length} clientes, ${firebaseData.products.length} produtos`);
            return;
          }
        } catch (shareError) {
          console.log('Web Share API não disponível ou cancelado, usando download tradicional');
        }
      }
      
      // Fallback: Download tradicional
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Para iOS Safari - adicionar atributo target
      link.setAttribute('target', '_blank');
      
      document.body.appendChild(link);
      link.click();
      
      // Aguardar um pouco antes de limpar (importante para mobile)
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.dismiss(loadingToast);
      toast.success(`Backup completo exportado! ${firebaseData.sales.length} vendas, ${firebaseData.clients.length} clientes, ${firebaseData.products.length} produtos, ${localData.transactions.length} transações`);
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
        console.log('📊 Total de vendas no backup:', data.sales.length);
        console.log('📝 Vendas fiadas no backup:', data.sales.filter((s: any) => s.paymentMethod === 'fiado').length);
        
        for (const sale of data.sales) {
          const { id, ...saleDataWithoutId } = sale;
          try {
            // ✅ CORRIGIDO: Importar DIRETAMENTE preservando todos os campos
            await addDoc(collection(db, 'sales'), {
              ...saleDataWithoutId,
              userId: user.uid,
              // Converter timestamps se necessário
              createdAt: saleDataWithoutId.createdAt?.seconds 
                ? Timestamp.fromMillis(saleDataWithoutId.createdAt.seconds * 1000)
                : Timestamp.now(),
              updatedAt: Timestamp.now(),
              // Garantir que valores numéricos sejam números
              subtotal: Number(saleDataWithoutId.subtotal) || 0,
              discount: Number(saleDataWithoutId.discount) || 0,
              total: Number(saleDataWithoutId.total) || 0,
              paidAmount: Number(saleDataWithoutId.paidAmount) || 0,
              remainingAmount: Number(saleDataWithoutId.remainingAmount) || 0
            });
            importedCount++;
            console.log('✅ Venda importada:', sale.clientName || 'Sem cliente', '- Método:', sale.paymentMethod);
          } catch (error) {
            console.error('❌ Erro ao importar venda:', sale.id, error);
            console.warn('Erro ao importar venda:', sale.id, error);
          }
        }
        
        console.log('✅ Total de vendas importadas:', importedCount);
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

      // ✅ CORRIGIDO: Importar produtos para o Firebase
      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          const { id, userId, createdAt, updatedAt, ...productData } = product;
          try {
            await addDoc(collection(db, 'products'), {
              ...productData,
              costPrice: Number(productData.costPrice) || 0,
              salePrice: Number(productData.salePrice) || 0,
              quantity: Number(productData.quantity) || 0,
              minQuantity: Number(productData.minQuantity) || 5,
              userId: user.uid,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            importedCount++;
          } catch (error) {
            console.warn('Erro ao importar produto:', product.name, error);
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>⚙️ Configurações</h1>
      </div>

      {/* Status da Assinatura */}
      <SubscriptionStatus />

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👤 Meu Perfil
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Nome Completo</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              placeholder="Seu nome"
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>CPF (Somente números)</label>
            <input
              type="text"
              value={profileData.cpf}
              onChange={(e) => setProfileData({...profileData, cpf: e.target.value.replace(/\D/g, '')})}
              placeholder="000.000.000-00"
              maxLength={11}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Telefone / WhatsApp</label>
            <input
              type="text"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              placeholder="(00) 00000-0000"
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loadingProfile}
          style={{
            padding: '0.8rem 2rem',
            backgroundColor: '#32BCAD',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loadingProfile ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: loadingProfile ? 0.7 : 1
          }}
        >
          {loadingProfile ? 'Salvando...' : '💾 Salvar Perfil'}
        </button>
      </div>

      {/* Seção Dados */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          {/* Sincronizar Despesas de Estoque */}
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
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                🔄 Sincronizar Despesas de Estoque
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Ajusta as despesas para corresponder ao valor real do estoque
              </div>
            </div>
            
            <button
              onClick={syncStockExpenses}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Sincronizar
            </button>
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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

      {/* Integração Asaas */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <AsaasIntegration />
      </div>

      {/* Seção Sobre */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
              💼 Caderninho Digital
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
            width: '100%',
            color: '#333333'
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
                    padding: '0.75rem',
                    border: '2px solid #ffc107',
                    borderRadius: '6px',
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
                  🗑️ Apagar Transações
                </button>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #dc3545'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc3545' }}>
                  💥 Reset Completo do Sistema
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  APAGA TUDO: vendas e clientes (Firebase) + produtos e transações (localStorage).
                  O sistema volta completamente ao estado inicial.
                </div>
                <input
                  type="text"
                  placeholder='Digite "RESETAR SISTEMA" para confirmar'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #dc3545',
                    borderRadius: '6px',
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
                  💥 Reset Sistema
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}