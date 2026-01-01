import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  email: string;
  role: string;
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
    amountPaid?: number;
    paymentMethod?: string;
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium'>('all');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<'single' | 'all'>('single');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      toast.error('Faça login primeiro');
      navigate('/login');
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Criar documento de usuário se não existir
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user',
          createdAt: new Date()
        });
        toast.error('Acesso negado! Apenas administradores.');
        navigate('/');
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData?.role === 'admin' || userData?.role === 'superadmin') {
        setIsAdmin(true);
        loadUsers();
      } else {
        toast.error('Acesso negado! Apenas administradores.');
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      toast.error('Erro ao verificar permissões');
      navigate('/');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Carregar todos os usuários
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      
      console.log('📊 Total de documentos na coleção users:', usersSnapshot.size);
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        console.log('👤 Usuário encontrado:', userData.email, '| UID:', userDoc.id);
        
        // Carregar assinatura do usuário
        const subDoc = await getDoc(doc(db, 'subscriptions', userDoc.id));
        const subData = subDoc.data();
        
        usersData.push({
          uid: userDoc.id,
          email: userData.email || 'Sem email',
          role: userData.role || 'user',
          subscription: subData ? {
            plan: subData.plan,
            status: subData.status,
            startDate: subData.startDate?.toDate(),
            endDate: subData.endDate?.toDate(),
            amountPaid: subData.amountPaid
          } : undefined
        });
      }
      
      // Ordenar por email
      usersData.sort((a, b) => a.email.localeCompare(b.email));
      
      console.log('✅ Total de usuários carregados:', usersData.length);
      setUsers(usersData);

      // Filtrar pendentes
      const pending = usersData.filter(u => u.subscription?.status === 'pending');
      setPendingUsers(pending);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const activatePremium = async (userId: string, months: number) => {
    if (!confirm(`Ativar premium por ${months} ${months === 1 ? 'mês' : 'meses'}?`)) {
      return;
    }

    try {
      const now = new Date();
      const endDate = new Date();
      
      console.log('💎 Ativando premium para usuário:', userId, '| Meses:', months);
      
      // Verificar se já tem assinatura ativa
      const subDoc = await getDoc(doc(db, 'subscriptions', userId));
      const currentSub = subDoc.data();
      
      if (currentSub && currentSub.status === 'active' && currentSub.endDate?.toDate() > now) {
        // Adicionar ao período atual
        console.log('📅 Assinatura ativa encontrada. Adicionando ao período atual.');
        endDate.setTime(currentSub.endDate.toDate().getTime());
        endDate.setDate(endDate.getDate() + (months * 30));
      } else {
        // Novo período
        console.log('🆕 Criando nova assinatura.');
        endDate.setDate(endDate.getDate() + (months * 30));
      }
      
      const subscriptionData = {
        plan: 'premium',
        status: 'active',
        startDate: now,
        endDate: endDate,
        managedBy: user?.uid,
        lastUpdate: now
      };
      
      console.log('💾 Salvando assinatura:', subscriptionData);
      
      await setDoc(doc(db, 'subscriptions', userId), subscriptionData);
      
      console.log('✅ Premium ativado com sucesso! Expira em:', endDate.toLocaleDateString('pt-BR'));
      
      // Log da ação
      await logAdminAction('activate_premium', userId, { 
        months, 
        endDate: endDate.toISOString(),
        daysAdded: months * 30
      });
      
      toast.success(`✅ Premium ativado por ${months} ${months === 1 ? 'mês' : 'meses'}! Expira em ${endDate.toLocaleDateString('pt-BR')}`);
      loadUsers();
    } catch (error) {
      console.error('❌ Erro ao ativar premium:', error);
      toast.error('Erro ao ativar premium: ' + (error as Error).message);
    }
  };

  const deactivatePremium = async (userId: string) => {
    if (!confirm('Desativar premium deste usuário?')) {
      return;
    }

    try {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1); // Data no passado
      
      console.log('🔴 Desativando premium para usuário:', userId);
      console.log('👤 Admin UID:', user?.uid);
      console.log('📧 Admin Email:', user?.email);
      
      const subscriptionData = {
        plan: 'free',
        status: 'expired',
        startDate: yesterday,
        endDate: yesterday, // Data no passado = expirado
        managedBy: user?.uid,
        lastUpdate: now
      };
      
      console.log('💾 Dados da assinatura a serem salvos:', subscriptionData);
      console.log('📍 Caminho do documento: subscriptions/' + userId);
      
      // Usar setDoc para garantir que o documento seja criado/atualizado
      await setDoc(doc(db, 'subscriptions', userId), subscriptionData);
      
      console.log('✅ Premium desativado com sucesso no Firestore');
      
      // Verificar se foi salvo
      const verifyDoc = await getDoc(doc(db, 'subscriptions', userId));
      if (verifyDoc.exists()) {
        console.log('✅ Verificação: Documento existe no Firestore');
        console.log('📄 Dados salvos:', verifyDoc.data());
      } else {
        console.error('❌ Verificação: Documento NÃO foi salvo!');
      }
      
      // Log da ação
      await logAdminAction('deactivate_premium', userId, {
        previousStatus: 'active',
        newStatus: 'expired',
        endDate: yesterday.toISOString()
      });
      
      toast.success('❌ Premium desativado! Recarregue a página do usuário para ver a mudança.');
      loadUsers();
    } catch (error: any) {
      console.error('❌ Erro ao desativar premium:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem do erro:', error.message);
      
      if (error.code === 'permission-denied') {
        toast.error('❌ Erro de permissão! Verifique se você é admin.');
      } else {
        toast.error('❌ Erro ao desativar premium: ' + error.message);
      }
    }

  };

  const approvePayment = async (userId: string, amount: number) => {
    if (!confirm('Confirmar pagamento e ativar Premium?')) return;

    try {
      const now = new Date();
      let endDate = new Date();
      
      // Lógica de cálculo (mesma do Context, mas server-side logic here basically)
      let months = 0;
      if (amount >= 200) {
        months = 14; // Promo
      } else {
        months = Math.floor(amount / 20) || 1;
      }
      
      endDate.setDate(endDate.getDate() + (months * 30));

      const subscriptionData = {
        plan: 'premium',
        status: 'active',
        startDate: now,
        endDate: endDate,
        managedBy: user?.uid,
        lastUpdate: now,
        amountPaid: amount,
        paymentMethod: 'pix_approved'
      };

      await setDoc(doc(db, 'subscriptions', userId), subscriptionData);

      // Notificar usuário
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        title: '✅ Pagamento Aprovado!',
        message: `Seu plano Premium foi ativado com sucesso por ${months} meses. Aproveite!`,
        type: 'payment_approved',
        read: false,
        createdAt: now
      });

      toast.success('Pagamento aprovado e plano ativado!');
      loadUsers();
    } catch (error: any) {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  };

  const rejectPayment = async (userId: string) => {
    if (!confirm('Rejeitar solicitação de pagamento?')) return;
    
    try {
      // Reverter para free/trial expirado ou o que estava antes
      // Por simplicidade, volta para free basic
      await setDoc(doc(db, 'subscriptions', userId), {
        plan: 'free',
        status: 'cancelled',
        startDate: new Date(),
        endDate: new Date()
      }, { merge: true });

      // Notificar usuário
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        title: '❌ Pagamento não identificado',
        message: 'Não identificamos seu pagamento PIX. Por favor, entre em contato ou tente novamente.',
        type: 'payment_rejected',
        read: false,
        createdAt: new Date()
      });

      toast.success('Solicitação rejeitada.');
      loadUsers();
    } catch (error) {
      toast.error('Erro ao rejeitar.');
    }
  };

  const logAdminAction = async (action: string, targetUserId: string, details: any) => {
    try {
      await addDoc(collection(db, 'admin_logs'), {
        adminId: user?.uid,
        adminEmail: user?.email,
        action: action,
        targetUserId: targetUserId,
        details: details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    if (messageTarget === 'single' && !selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }

    try {
      setSendingMessage(true);

      const targetUsers = messageTarget === 'all' 
        ? filteredUsers.map(u => u.uid)
        : [selectedUserId];

      console.log('📧 Enviando mensagem para:', targetUsers);
      console.log('📝 Título:', messageTitle);
      console.log('💬 Mensagem:', messageContent);

      // Criar mensagem para cada usuário
      let successCount = 0;
      for (const userId of targetUsers) {
        try {
          const notificationData = {
            userId: userId,
            title: messageTitle,
            message: messageContent,
            type: 'admin_message',
            read: false,
            createdAt: new Date(),
            sentBy: user?.uid,
            sentByEmail: user?.email
          };
          
          console.log('📤 Criando notificação para usuário:', userId, notificationData);
          
          const docRef = await addDoc(collection(db, 'notifications'), notificationData);
          
          console.log('✅ Notificação criada com ID:', docRef.id);
          successCount++;
        } catch (userError) {
          console.error('❌ Erro ao enviar para usuário:', userId, userError);
        }
      }

      // Log da ação
      await logAdminAction('send_message', messageTarget === 'all' ? 'all_users' : selectedUserId, {
        title: messageTitle,
        recipientCount: successCount
      });

      if (successCount > 0) {
        toast.success(`✅ Mensagem enviada para ${successCount} ${successCount === 1 ? 'usuário' : 'usuários'}!`);
        console.log(`✅ Total de mensagens enviadas: ${successCount}/${targetUsers.length}`);
      } else {
        toast.error('❌ Nenhuma mensagem foi enviada. Verifique o console.');
      }
      
      // Limpar formulário
      setMessageTitle('');
      setMessageContent('');
      setShowMessageModal(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem: ' + (error as Error).message);
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessageModal = (userId?: string) => {
    if (userId) {
      setMessageTarget('single');
      setSelectedUserId(userId);
    } else {
      setMessageTarget('all');
      setSelectedUserId('');
    }
    setShowMessageModal(true);
  };



  // Filtrar usuários
  const filteredUsers = users.filter(userData => {
    const matchesSearch = userData.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || 
                       (filterPlan === 'premium' && userData.subscription?.plan === 'premium') ||
                       (filterPlan === 'free' && (!userData.subscription || userData.subscription?.plan === 'free'));
    return matchesSearch && matchesPlan;
  });

  // Estatísticas
  const stats = {
    total: users.length,
    premium: users.filter(u => u.subscription?.plan === 'premium').length,
    free: users.filter(u => !u.subscription || u.subscription?.plan === 'free').length,
    active: users.filter(u => u.subscription?.status === 'active').length,
    expiringSoon: users.filter(u => {
      if (!u.subscription?.endDate) return false;
      const daysLeft = Math.ceil((u.subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft >= 0;
    }).length,
    expired: users.filter(u => {
      if (!u.subscription?.endDate) return false;
      const daysLeft = Math.ceil((u.subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft < 0;
    }).length
  };

  if (!isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Verificando permissões...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'white', fontSize: '2rem' }}>
            👨‍💼 Painel de Administração
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.8)' }}>
            Gerenciar usuários e assinaturas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => openMessageModal()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📧 Enviar Mensagem
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>

      {/* Informação sobre usuários */}
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          💡 <strong>Dica:</strong> Se um usuário novo não aparecer, peça para ele fazer <strong>logout e login novamente</strong>. 
          O documento será criado automaticamente no Firestore.
        </p>
      </div>

      {/* Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Total de Usuários
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>
            {stats.total}
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Usuários Premium
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.premium}
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Usuários Free
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6c757d' }}>
            {stats.free}
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Assinaturas Ativas
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.active}
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Expirando em 7 dias
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff9500' }}>
            {stats.expiringSoon}
          </div>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Expirados
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc3545' }}>
            {stats.expired}
          </div>
        </div>
      </div>

      {/* Seção de Aprovações Pendentes */}
      {pendingUsers.length > 0 && (
        <div style={{ 
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏳ Aprovações Pendentes ({pendingUsers.length})
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingUsers.map(u => (
              <div key={u.uid} style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.email}</div>
                  <div style={{ color: '#666' }}>
                    Info: {u.subscription?.amountPaid ? `R$ ${u.subscription.amountPaid}` : 'Valor não inf.'} - 
                    {u.subscription?.paymentMethod || 'PIX'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => approvePayment(u.uid, u.subscription?.amountPaid || 20)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() => rejectPayment(u.uid)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as any)}
            style={{
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todos os Planos</option>
            <option value="premium">Apenas Premium</option>
            <option value="free">Apenas Free</option>
          </select>
          
          <button
            onClick={loadUsers}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Recarregar
          </button>
        </div>
        
        {searchTerm && (
          <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
          </div>
        )}
      </div>

      {/* Lista de Usuários */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e1e5e9' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Plano</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vencimento</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map(userData => (
                  <tr key={userData.uid} style={{ borderBottom: '1px solid #e1e5e9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>{userData.email}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {userData.role === 'admin' && '👨‍💼 Admin'}
                        {userData.role === 'superadmin' && '⭐ Super Admin'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        backgroundColor: userData.subscription?.plan === 'premium' ? '#28a745' : '#6c757d',
                        color: 'white'
                      }}>
                        {userData.subscription?.plan === 'premium' ? '⭐ Premium' : '🆓 Free'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        backgroundColor: userData.subscription?.status === 'active' ? '#e8f5e8' : '#f8d7da',
                        color: userData.subscription?.status === 'active' ? '#28a745' : '#dc3545'
                      }}>
                        {userData.subscription?.status === 'active' ? '✅ Ativo' : '❌ Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {userData.subscription?.endDate ? (
                        <>
                          <div style={{ fontWeight: '500' }}>
                            {userData.subscription.endDate.toLocaleDateString('pt-BR')}
                          </div>
                          {(() => {
                            const daysLeft = Math.ceil((userData.subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isExpired = daysLeft < 0;
                            const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
                            
                            return (
                              <div style={{ 
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: isExpired ? '#dc3545' : isExpiringSoon ? '#ff9500' : '#28a745',
                                marginTop: '0.25rem'
                              }}>
                                {isExpired ? (
                                  <>⚠️ Expirado há {Math.abs(daysLeft)} dias</>
                                ) : daysLeft === 0 ? (
                                  <>⏰ Expira hoje!</>
                                ) : daysLeft === 1 ? (
                                  <>⏰ 1 dia restante</>
                                ) : (
                                  <>⏰ {daysLeft} dias restantes</>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <span style={{ color: '#999' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => activatePremium(userData.uid, 1)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          +1 mês
                        </button>
                        <button
                          onClick={() => activatePremium(userData.uid, 12)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          +1 ano
                        </button>
                        <button
                          onClick={() => deactivatePremium(userData.uid)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          Desativar
                        </button>
                        <button
                          onClick={() => openMessageModal(userData.uid)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                          title="Enviar mensagem"
                        >
                          📧
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Mensagem */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#333' }}>📧 Enviar Mensagem</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* Seletor de destinatário */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                Destinatário:
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={messageTarget === 'single'}
                    onChange={() => setMessageTarget('single')}
                  />
                  <span>Usuário específico</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={messageTarget === 'all'}
                    onChange={() => setMessageTarget('all')}
                  />
                  <span>Todos os usuários ({filteredUsers.length})</span>
                </label>
              </div>
            </div>

            {/* Seletor de usuário */}
            {messageTarget === 'single' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Selecione o usuário:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione...</option>
                  {filteredUsers.map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.email} {u.role === 'admin' && '(Admin)'} {u.role === 'superadmin' && '(Super Admin)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Título */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                Título:
              </label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Ex: Novidades do sistema"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Mensagem */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                Mensagem:
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMessageModal(false)}
                disabled={sendingMessage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: sendingMessage ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: sendingMessage ? 0.5 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={sendMessage}
                disabled={sendingMessage}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: sendingMessage ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: sendingMessage ? 0.5 : 1
                }}
              >
                {sendingMessage ? 'Enviando...' : '📧 Enviar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
