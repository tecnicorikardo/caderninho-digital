# 👨‍💼 GUIA: PAINEL DE ADMINISTRAÇÃO

**Data:** 08/11/2025  
**Objetivo:** Criar sistema de administração para gerenciar usuários e assinaturas

---

## 🎯 VISÃO GERAL

### O que você quer:
Um **usuário administrador** que pode:
- ✅ Ver lista de todos os usuários cadastrados
- ✅ Ver status de assinatura de cada usuário
- ✅ Ativar/Desativar premium manualmente
- ✅ Estender período de assinatura
- ✅ Ver estatísticas de uso
- ✅ Gerenciar pagamentos

---

## 🏗️ ARQUITETURA RECOMENDADA

### 1. **Níveis de Usuário**

```typescript
interface User {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: Date;
}
```

**Roles:**
- `user` - Usuário normal (padrão)
- `admin` - Administrador (pode gerenciar usuários)
- `superadmin` - Super admin (pode criar outros admins)

---

### 2. **Estrutura do Firebase**

```
Firestore:
├── users/
│   ├── {userId}/
│   │   ├── email: string
│   │   ├── role: 'user' | 'admin' | 'superadmin'
│   │   ├── createdAt: timestamp
│   │   └── lastLogin: timestamp
│
├── subscriptions/
│   ├── {userId}/
│   │   ├── plan: 'free' | 'premium'
│   │   ├── status: 'active' | 'expired'
│   │   ├── startDate: timestamp
│   │   ├── endDate: timestamp
│   │   ├── amountPaid: number
│   │   └── managedBy: string (userId do admin que alterou)
│
└── admin_logs/
    ├── {logId}/
    │   ├── adminId: string
    │   ├── action: string
    │   ├── targetUserId: string
    │   ├── details: object
    │   └── timestamp: timestamp
```

---

## 📋 PASSO A PASSO DE IMPLEMENTAÇÃO

### FASE 1: Criar Sistema de Roles

#### 1.1 Adicionar campo `role` aos usuários

**Firestore Rules:**
```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    // Função para verificar se é superadmin
    function isSuperAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    // Usuários
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isSuperAdmin();
    }
    
    // Assinaturas
    match /subscriptions/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Logs de admin (apenas admins podem ler/escrever)
    match /admin_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
    }
    
    // Suas outras regras existentes...
  }
}
```

---

#### 1.2 Criar primeiro Super Admin

**Opção A: Manualmente no Firebase Console**
```
1. Ir no Firebase Console
2. Firestore Database
3. Criar coleção "users"
4. Adicionar documento com seu UID:
   {
     email: "seu@email.com",
     role: "superadmin",
     createdAt: [timestamp atual]
   }
```

**Opção B: Via código (executar uma vez)**
```typescript
// src/utils/createSuperAdmin.ts
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function createSuperAdmin(userId: string, email: string) {
  await setDoc(doc(db, 'users', userId), {
    email: email,
    role: 'superadmin',
    createdAt: new Date(),
    lastLogin: new Date()
  });
  
  console.log('✅ Super Admin criado!');
}

// Executar uma vez no console do navegador:
// createSuperAdmin('SEU_USER_ID', 'seu@email.com');
```

---

### FASE 2: Criar Painel de Admin

#### 2.1 Criar página Admin

**Estrutura:**
```
src/pages/Admin/
├── index.tsx          (Dashboard principal)
├── UserList.tsx       (Lista de usuários)
├── UserDetail.tsx     (Detalhes de um usuário)
└── AdminLogs.tsx      (Logs de ações)
```

---

#### 2.2 Dashboard Admin (exemplo)

```typescript
// src/pages/Admin/index.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  email: string;
  role: string;
  subscription?: {
    plan: string;
    status: string;
    endDate: Date;
  };
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (userData?.role === 'admin' || userData?.role === 'superadmin') {
      setIsAdmin(true);
      loadUsers();
    } else {
      toast.error('Acesso negado! Apenas administradores.');
      window.location.href = '/';
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Carregar todos os usuários
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Carregar assinatura do usuário
        const subDoc = await getDoc(doc(db, 'subscriptions', userDoc.id));
        const subData = subDoc.data();
        
        usersData.push({
          uid: userDoc.id,
          email: userData.email,
          role: userData.role || 'user',
          subscription: subData ? {
            plan: subData.plan,
            status: subData.status,
            endDate: subData.endDate?.toDate()
          } : undefined
        });
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const activatePremium = async (userId: string, months: number) => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (months * 30));
      
      await updateDoc(doc(db, 'subscriptions', userId), {
        plan: 'premium',
        status: 'active',
        endDate: endDate,
        managedBy: user?.uid
      });
      
      // Log da ação
      await logAdminAction('activate_premium', userId, { months });
      
      toast.success(`Premium ativado por ${months} meses!`);
      loadUsers();
    } catch (error) {
      toast.error('Erro ao ativar premium');
    }
  };

  const deactivatePremium = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'subscriptions', userId), {
        plan: 'free',
        status: 'expired',
        managedBy: user?.uid
      });
      
      // Log da ação
      await logAdminAction('deactivate_premium', userId, {});
      
      toast.success('Premium desativado!');
      loadUsers();
    } catch (error) {
      toast.error('Erro ao desativar premium');
    }
  };

  const logAdminAction = async (action: string, targetUserId: string, details: any) => {
    await addDoc(collection(db, 'admin_logs'), {
      adminId: user?.uid,
      adminEmail: user?.email,
      action: action,
      targetUserId: targetUserId,
      details: details,
      timestamp: new Date()
    });
  };

  if (!isAdmin) {
    return <div>Verificando permissões...</div>;
  }

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👨‍💼 Painel de Administração</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>📊 Estatísticas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <div>Total de Usuários</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{users.length}</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
            <div>Usuários Premium</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {users.filter(u => u.subscription?.plan === 'premium').length}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
            <div>Usuários Free</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {users.filter(u => !u.subscription || u.subscription?.plan === 'free').length}
            </div>
          </div>
        </div>
      </div>

      <h3>👥 Lista de Usuários</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Plano</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Vencimento</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(userData => (
            <tr key={userData.uid} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '1rem' }}>{userData.email}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: userData.subscription?.plan === 'premium' ? '#28a745' : '#6c757d',
                  color: 'white'
                }}>
                  {userData.subscription?.plan || 'free'}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                {userData.subscription?.status || 'N/A'}
              </td>
              <td style={{ padding: '1rem' }}>
                {userData.subscription?.endDate?.toLocaleDateString('pt-BR') || 'N/A'}
              </td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => activatePremium(userData.uid, 1)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    +1 mês
                  </button>
                  <button
                    onClick={() => activatePremium(userData.uid, 12)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    +1 ano
                  </button>
                  <button
                    onClick={() => deactivatePremium(userData.uid)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Desativar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### FASE 3: Adicionar Rota Admin

```typescript
// src/routes/index.tsx
import { AdminDashboard } from '../pages/Admin';

// Adicionar rota protegida
<Route path="/admin" element={<AdminDashboard />} />
```

---

### FASE 4: Criar Link de Acesso

```typescript
// No Dashboard ou Menu, adicionar link apenas para admins
{userRole === 'admin' || userRole === 'superadmin' ? (
  <button onClick={() => navigate('/admin')}>
    👨‍💼 Painel Admin
  </button>
) : null}
```

---

## 🔒 SEGURANÇA

### Regras Importantes:

1. **Verificar role no frontend E backend**
   - Frontend: Para mostrar/ocultar UI
   - Firestore Rules: Para proteger dados

2. **Nunca confiar apenas no frontend**
   - Sempre validar no Firestore Rules
   - Usuário pode manipular código do navegador

3. **Logs de auditoria**
   - Registrar TODAS as ações de admin
   - Quem fez, quando, o quê

4. **Limitar poderes**
   - Admin não pode se promover a superadmin
   - Apenas superadmin cria outros admins

---

## 📊 FUNCIONALIDADES RECOMENDADAS

### Básicas (Implementar primeiro)
- ✅ Ver lista de usuários
- ✅ Ver status de assinatura
- ✅ Ativar/Desativar premium
- ✅ Estender período

### Intermediárias
- ✅ Buscar usuário por email
- ✅ Filtrar por plano/status
- ✅ Ver histórico de pagamentos
- ✅ Exportar lista de usuários

### Avançadas
- ✅ Dashboard com gráficos
- ✅ Estatísticas de receita
- ✅ Enviar notificações
- ✅ Gerenciar permissões
- ✅ Logs de auditoria detalhados

---

## 💡 DICAS PRÁTICAS

### 1. Começar Simples
```
Fase 1: Criar role system (1 dia)
Fase 2: Página admin básica (2 dias)
Fase 3: Funcionalidades avançadas (1 semana)
```

### 2. Testar Bem
```
- Criar usuário teste
- Tentar acessar /admin sem ser admin
- Verificar se Firestore Rules bloqueiam
- Testar ativar/desativar premium
```

### 3. Documentar
```
- Quem são os admins
- Como criar novo admin
- Como usar o painel
- Logs de ações importantes
```

---

## 🚀 IMPLEMENTAÇÃO RÁPIDA

### Opção 1: Implementação Completa (Recomendado)
**Tempo:** 3-5 dias  
**Inclui:** Tudo acima + segurança + logs

### Opção 2: Implementação Básica (Rápido)
**Tempo:** 1 dia  
**Inclui:** Apenas lista de usuários + ativar/desativar

### Opção 3: Usar Ferramenta Pronta
**Opções:**
- Firebase Admin SDK (backend)
- Retool (low-code admin panel)
- Forest Admin (admin panel as a service)

---

## 📞 PRÓXIMOS PASSOS

### Se quiser que eu implemente:

1. **Diga qual opção:**
   - Implementação completa
   - Implementação básica
   - Apenas orientação

2. **Defina prioridades:**
   - O que é mais importante?
   - Quais funcionalidades primeiro?

3. **Confirme segurança:**
   - Quem será o primeiro admin?
   - Quantos admins terá?

---

## ✅ RESUMO

**SIM, é totalmente possível!**

**Estrutura:**
```
1. Sistema de Roles (user/admin/superadmin)
2. Firestore Rules para proteger
3. Página /admin com lista de usuários
4. Botões para ativar/desativar premium
5. Logs de auditoria
```

**Complexidade:** Média  
**Tempo:** 1-5 dias (dependendo do escopo)  
**Benefício:** ALTO (controle total sobre usuários)

---

**Quer que eu implemente isso agora?** 🚀

Posso criar:
- ✅ Sistema de roles
- ✅ Firestore Rules
- ✅ Página admin básica
- ✅ Funcionalidades de gerenciamento

**Me confirma e eu começo!** 😊
