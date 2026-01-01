import * as functions from 'firebase-functions';
import cors from 'cors';
import axios from 'axios';
import * as admin from 'firebase-admin';

// Inicializar admin se ainda não foi (embora index.ts já faça isso)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const ASAAS_API_URL = 'https://sandbox.asaas.com/v3'; // Sempre sandbox por enquanto

// API Key configurada diretamente (mesma do serviço)
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmNhYzk1MWE1LTM2OGQtNGE4Zi1iNDU0LTI3ZmY2NjYzMjRiZDo6JGFhY2hfYmY3N2U5ZGQtZTc5My00ZDAxLTlmYmEtZGEzZDM1ZWExZjAz';

// Configurar CORS
const corsHandler = cors({
    origin: [
        'https://bloquinhodigital.web.app',
        'https://bloquinhodigital.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true
});

export const createAsaasCharge = functions
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
            
            const { amount, description, paymentMethod = 'PIX' } = req.body;
            if (!amount || amount <= 0) {
                res.status(400).json({ error: 'Valor inválido' });
                return;
            }

            // Verificar se API Key está configurada
            if (!ASAAS_API_KEY) {
                console.error('ASAAS_API_KEY não configurada.');
                res.status(500).json({ error: 'Erro de configuração do servidor de pagamento' });
                return;
            }

            // 1. Criar/Buscar Cliente no Asaas
            const userEmail = decodedToken.email || 'email@nao.informado.com';
            const userName = decodedToken.name || 'Usuário Bloquinho';
            const userUid = decodedToken.uid;

            console.log('👤 Dados do usuário:', { userEmail, userName, userUid });
            console.log('🔑 API Key (primeiros 30 chars):', ASAAS_API_KEY.substring(0, 30) + '...');
            console.log('🌐 URL Base:', ASAAS_API_URL);

            // Primeiro, vamos testar a autenticação com uma chamada simples
            try {
                console.log('🧪 Testando autenticação...');
                const testResponse = await axios.get(`${ASAAS_API_URL}/customers?limit=1`, {
                    headers: { 
                        'access_token': ASAAS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ Teste de autenticação OK:', testResponse.status);
            } catch (testErr: any) {
                console.error('❌ Falha no teste de autenticação:', {
                    status: testErr.response?.status,
                    statusText: testErr.response?.statusText,
                    headers: testErr.response?.headers,
                    data: typeof testErr.response?.data === 'string' ? 
                        testErr.response.data.substring(0, 200) + '...' : 
                        testErr.response?.data
                });
                res.status(500).json({ 
                    error: 'Falha na autenticação com Asaas',
                    details: 'API Key inválida ou conta inativa'
                });
                return;
            }

            // Buscar customer pelo email (filtro básico)
            let customerId = '';

            try {
                console.log('🔍 Buscando customer no Asaas...');
                console.log('🌐 URL:', `${ASAAS_API_URL}/customers?email=${userEmail}`);
                
                const customerResponse = await axios.get(`${ASAAS_API_URL}/customers?email=${userEmail}`, {
                    headers: { 
                        'access_token': ASAAS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📊 Status da resposta:', customerResponse.status);
                console.log('📊 Resposta busca customer:', customerResponse.data);

                if (customerResponse.data.data && customerResponse.data.data.length > 0) {
                    customerId = customerResponse.data.data[0].id;
                    console.log('✅ Customer encontrado:', customerId);
                } else {
                    console.log('➕ Criando novo customer...');
                    // Criar novo customer
                    const newCustomer = await axios.post(`${ASAAS_API_URL}/customers`, {
                        name: userName,
                        email: userEmail,
                        externalReference: userUid
                    }, {
                        headers: { 
                            'access_token': ASAAS_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('📊 Status criação customer:', newCustomer.status);
                    console.log('📊 Dados do novo customer:', newCustomer.data);
                    customerId = newCustomer.data.id;
                    console.log('✅ Customer criado:', customerId);
                }
            } catch (err: any) {
                console.error('❌ Erro ao gerenciar customer Asaas:', {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: typeof err.response?.data === 'string' ? 
                        err.response.data.substring(0, 200) + '...' : 
                        err.response?.data,
                    message: err.message
                });
                res.status(500).json({ error: 'Erro ao processar dados do cliente' });
                return;
            }

            // 2. Criar a Cobrança
            const chargeData = {
                customer: customerId,
                billingType: paymentMethod, // 'PIX' ou 'BOLETO'
                value: amount,
                dueDate: new Date().toISOString().split('T')[0], // Vence hoje
                description: description,
                externalReference: description.includes('venda') ? undefined : userUid // Se for venda, idealmente passar ID da venda
                // externalReference é crucial para o webhook saber o que atualizar
            };

            console.log('Criando cobrança Asaas:', chargeData);

            const chargeResponse = await axios.post(`${ASAAS_API_URL}/payments`, chargeData, {
                headers: { 
                    'access_token': ASAAS_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            const paymentId = chargeResponse.data.id;
            let qrCode = null;
            let copyPaste = null;

            // 3. Se for PIX, buscar o QR Code
            if (paymentMethod === 'PIX') {
                const qrResponse = await axios.get(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
                    headers: { 
                        'access_token': ASAAS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                qrCode = qrResponse.data.encodedImage;
                copyPaste = qrResponse.data.payload;
            }

            res.status(200).json({
                success: true,
                paymentId: paymentId,
                qrCode: qrCode,
                copyPaste: copyPaste,
                invoiceUrl: chargeResponse.data.invoiceUrl
            });

        } catch (error: any) {
            console.error('Erro ao criar cobrança Asaas:', error.response?.data || error.message);
            
            // Retornar erro detalhado para debug
            res.status(500).json({ 
                error: 'Falha ao comunicar com gateway de pagamento',
                debug: {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: typeof error.response?.data === 'string' ? 
                        error.response.data.substring(0, 300) + '...' : 
                        error.response?.data
                }
            });
        }
    });
});
