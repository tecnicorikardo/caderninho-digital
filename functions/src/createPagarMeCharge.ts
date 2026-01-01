import * as functions from 'firebase-functions';
import cors from 'cors';
import axios from 'axios';
import * as admin from 'firebase-admin';

// Inicializar admin se ainda não foi (embora index.ts já faça isso)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Credenciais PagarMe
const PAGARME_SECRET_KEY = 'sk_36b54e3839b3479a88db7378a3a9817d';

// Configurar CORS
const corsHandler = cors({
    origin: true, // Permitir todas as origens para simplificar, ou manter lista específica
    credentials: true
});

export const createPagarMeCharge = functions
    .region('us-central1')
    .https.onRequest(async (req, res) => {
        // Aplicar CORS
        return corsHandler(req, res, async () => {
            // Verificar método
            if (req.method !== 'POST') {
                res.status(405).json({ error: 'Método não permitido' });
                return;
            }

            // Verificar Authorization header (Firebase Auth token)
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Token de autorização necessário' });
                return;
            }

            try {
                // Verificar token Firebase
                const token = authHeader.split('Bearer ')[1];
                const decodedToken = await admin.auth().verifyIdToken(token);
                const uid = decodedToken.uid;

                const { amount, description, paymentMethod = 'PIX', interval = 'month' } = req.body;

                console.log('👤 Dados do usuário Auth:', {
                    email: decodedToken.email,
                    uid: uid
                });

                // 1. Buscar dados completos do usuário no Firestore (CPF e Telefone)
                const userDoc = await admin.firestore().collection('users').doc(uid).get();
                const userData = userDoc.data();

                const cpf = userData?.cpf?.replace(/\D/g, '');
                const phone = userData?.phone?.replace(/\D/g, '');

                console.log('🔍 Dados do perfil Firestore:', { hasCpf: !!cpf, hasPhone: !!phone });

                // Validação de CPF
                if (!cpf || cpf.length !== 11) {
                    console.warn('❌ CPF ausente ou inválido:', cpf);
                    res.status(400).json({
                        error: 'CPF obrigatório',
                        code: 'MISSING_CPF',
                        message: 'Por favor, preencha seu CPF na tela de Configurações > Meu Perfil para continuar.'
                    });
                    return;
                }

                // Construir payload do Customer com dados reais
                const customerData = {
                    name: userData?.name || decodedToken.name || 'Usuário Bloquinho',
                    email: decodedToken.email || 'email@nao.informado.com',
                    type: 'individual',
                    document: cpf, // CPF real do Firestore
                    document_type: 'cpf',
                    phones: {
                        mobile_phone: {
                            country_code: '55',
                            area_code: phone?.substring(0, 2) || '21',
                            number: phone?.substring(2) || '900000000'
                        }
                    }
                };

                console.log('💰 Criando ORDER (PIX) PagarMe:', { amount, description });

                // 2. Criar Order com PIX (Revertendo para /orders pois /subscriptions não aceitou PIX nesta conta/versão)
                const orderData = {
                    items: [
                        {
                            amount: Math.round(amount * 100), // Centavos
                            description: description,
                            quantity: 1,
                            code: 'premium_plan'
                        }
                    ],
                    customer: customerData,
                    payments: [
                        {
                            payment_method: 'pix',
                            pix: {
                                expires_in: 172800 // 48 horas
                            }
                        }
                    ],
                    metadata: {
                        firebaseUid: uid,
                        planType: interval || 'month'
                    }
                };

                console.log('🚀 Enviando payload para /orders...');

                const orderResponse = await axios.post(`${PAGARME_API_URL}/orders`, orderData, {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('✅ Order criada:', orderResponse.data.id);
                const order = orderResponse.data;

                // Verificar status
                if (order.status === 'failed') {
                    throw new Error('Order creation failed: ' + JSON.stringify(order));
                }

                const charge = order.charges?.[0];
                if (!charge) {
                    throw new Error('No charge created for order');
                }

                const transaction = charge.last_transaction;

                let qrCode = null;
                let qrCodeText = null;
                let paymentId = charge.id;

                if (transaction) {
                    // Tentar pegar QR Code de várias formas possíveis na resposta PagarMe
                    if (transaction.pix) {
                        qrCode = transaction.pix.qr_code_url;
                        qrCodeText = transaction.pix.qr_code;
                    }
                    if (!qrCode) {
                        qrCode = transaction.qr_code_url;
                    }
                    if (!qrCodeText) {
                        qrCodeText = transaction.qr_code;
                    }
                }

                console.log('✅ Retornando dados para frontend:', { paymentId, hasQr: !!qrCodeText });

                res.status(200).json({
                    success: true,
                    paymentId: paymentId,
                    qrCode: qrCode,
                    qrCodeImage: qrCode,
                    copyPaste: qrCodeText,
                    status: order.status,
                    debug: {
                        customerName: customerData.name,
                        cpfUsed: cpf,
                        orderId: order.id,
                        endpoint: '/orders'
                    }
                });

            } catch (error: any) {
                console.error('❌ Erro createPagarMeCharge:', {
                    message: error.message,
                    data: error.response?.data
                });

                // Repassar erro de validação do PagarMe
                const pagarmeErrors = error.response?.data?.errors;

                res.status(500).json({
                    error: 'Falha na criação da cobrança PIX',
                    debug: {
                        message: error.message,
                        pagarmeErrors: pagarmeErrors || error.response?.data
                    }
                });
            }
        });
    });
