import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { onMessage } from 'firebase/messaging';
import { messaging, db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export function NotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [tokenGenerated, setTokenGenerated] = useState(false);

  useEffect(() => {
    // 1. Verificar permissão atual e tentar gerar token se já permitido
    if (permission === 'granted' && user && !tokenGenerated) {
      notificationService.generateToken(user.uid)
        .then(token => {
          if (token) setTokenGenerated(true);
        });
    }

    // 2. Configurar listener para mensagens em primeiro plano (Push/FCM)
    const unsubscribeFCM = onMessage(messaging, (payload) => {
      console.log('🔔 Notificação recebida (FCM):', payload);
      const { title, body } = payload.notification || {};
      notify(title || 'Nova Notificação', body || '');
    });

    // 3. Configurar listener para mensagens do Firestore (Admin Panel)
    let unsubscribeFirestore = () => {};
    if (user) {
      // Simplificar query para evitar erro de índice composto
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        limit(20) // Aumentar limite para garantir que pegamos as recentes
      );

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Apenas notificar se não foi lida e é recente (< 1 min)
            if (!data.read) {
              const created = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
              const now = new Date();
              if ((now.getTime() - created.getTime()) < 60000) { // Menos de 1 minuto
                 notify(data.title, data.message);
              }
            }
          }
        });
      });
    }

    return () => {
      unsubscribeFCM();
      unsubscribeFirestore();
    };
  }, [user, permission, tokenGenerated]);

  const notify = (title: string, body: string) => {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ fontSize: '20px' }}>🔔</div>
        <div>
          <div style={{ fontWeight: 'bold' }}>{title}</div>
          <div style={{ fontSize: '14px' }}>{body}</div>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
      style: {
        border: '1px solid #007bff',
        padding: '16px',
        color: '#333',
      },
    });
  };

  const handleEnableNotifications = async () => {
    if (Notification.permission === 'denied') {
      toast.error('As notificações estão bloqueadas! Clique no cadeado 🔒 na barra de endereço e selecione "Permitir".', {
        duration: 8000,
        icon: '🔒'
      });
      return;
    }

    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission('granted');
      if (user) {
        // Tentar gerar token, mas não bloquear se falhar (pode ser problema de VAPID)
        notificationService.generateToken(user.uid).catch(console.error);
        setTokenGenerated(true);
        toast.success('Notificações ativadas com sucesso!');
      }
    } else {
      setPermission('denied');
      toast.error('Permissão negada ou fechada. Tente novamente.');
    }
  };

  const handleDismiss = () => {
    setPermission('denied'); // Esconde visualmente
    localStorage.setItem('notification_dismissed', 'true');
  };

  // Se a permissão for 'default' e não tiver dispensado, mostrar prompt
  const isDismissed = localStorage.getItem('notification_dismissed') === 'true';
  if (permission === 'default' && user && !isDismissed) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '300px',
        border: '1px solid #e1e5e9',
        animation: 'slideUp 0.5s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Ativar Notificações?</span>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Receba avisos sobre vendas, fiados vencendo e atualizações importantes.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Agora não
          </button>
          <button
            onClick={handleEnableNotifications}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#007bff',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Ativar
          </button>
        </div>
      </div>
    );
  }

  return null; // Não renderiza nada visual se já estiver configurado ou negado
}
