import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '../config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Ponto importante: Substitua isso pela sua VAPID Key do console do Firebase
// Project Settings > Cloud Messaging > Web Push Certificates > Generate Key Pair
const VAPID_KEY = "BKFp8h0gGkM9_y_2Hf4vj0p2b1n7_5r4_3q2_1z0_VAPID_CHECK_FIREBASE_CONSOLE";

export const notificationService = {
    // Pedir permissão ao usuário
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Permissão de notificação concedida.');
                return true;
            } else {
                console.log('❌ Permissão de notificação negada.');
                return false;
            }
        } catch (error) {
            console.error('Erro ao pedir permissão de notificação:', error);
            return false;
        }
    },

    // Gerar e salvar token
    async generateToken(userId: string) {
        try {
            // Temporariamente desabilitado devido a erro de encoding
            console.log('⚠️ Serviço de notificações temporariamente desabilitado');
            return null;
            
            /* 
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });

            if (currentToken) {
                console.log('🎟️ Token FCM Gerado:', currentToken);

                // Salvar token no perfil do usuário no Firestore
                await this.saveTokenToDatabase(userId, currentToken);

                return currentToken;
            } else {
                console.log('⚠️ Nenhum token de registro disponível. Peça permissão para gerar um.');
                return null;
            }
            */
        } catch (error) {
            console.error('❌ Erro ao recuperar token FCM:', error);
            return null;
        }
    },

    // Salvar token no Firestore
    async saveTokenToDatabase(userId: string, token: string) {
        if (!userId || !token) return;

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                lastTokenUpdate: new Date()
            });
            console.log('💾 Token salvo no Firestore para o usuário:', userId);
        } catch (error) {
            console.error('Erro ao salvar token no banco:', error);
        }
    },

    // Ouvir mensagens enquanto o app está aberto (foreground)
    onMessageListener() {
        return new Promise((resolve) => {
            onMessage(messaging, (payload) => {
                console.log('📩 Mensagem recebida em primeiro plano:', payload);
                resolve(payload);
            });
        });
    }
};
