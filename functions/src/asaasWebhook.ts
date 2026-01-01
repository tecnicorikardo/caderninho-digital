import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const handleAsaasWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Validar Token de Acesso (Segurança)
    const asaasToken = req.headers['asaas-access-token'];
    const expectedToken = 'ab123456-7890-abcd-ef12-34567890abcdef-bloquinho-secret';

    if (asaasToken !== expectedToken) {
        console.warn('⛔ Tentativa de acesso não autorizado ao Webhook Asaas.');
        res.status(401).send({ error: 'Unauthorized' });
        return;
    }

    try {
        const body = req.body;
        const event = body.event;
        const payment = body.payment;

        console.log(`🔔 Evento Webhook Asaas recebido: ${event}`, payment);

        if (!payment) {
            res.status(400).send({ error: 'Payload inválido' });
            return;
        }

        // 2. Extrair informações
        const saleId = payment.externalReference;
        const paymentId = payment.id;
        const customerId = payment.customer;

        if (!saleId) {
            console.log('⚠️ Pagamento sem externalReference (ID da venda). Ignorando atualização de venda.');
            res.status(200).send({ message: 'Ignorado: sem externalReference' });
            return;
        }

        // 3. Processar eventos relevantes
        if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
            console.log(`💸 Pagamento confirmado para venda ${saleId}`);

            const saleRef = db.collection('sales').doc(saleId);
            const saleSnapshot = await saleRef.get();

            if (!saleSnapshot.exists) {
                console.error(`❌ Venda ${saleId} não encontrada.`);
                res.status(404).send({ error: 'Venda não encontrada' });
                return;
            }

            const saleData = saleSnapshot.data();
            const amount = payment.value;
            
            // Mapear tipo de pagamento do Asaas
            let method = 'dinheiro';
            switch (payment.billingType) {
                case 'PIX':
                    method = 'pix';
                    break;
                case 'CREDIT_CARD':
                    method = 'cartao_credito';
                    break;
                case 'DEBIT_CARD':
                    method = 'cartao_debito';
                    break;
                case 'BOLETO':
                    method = 'boleto';
                    break;
                default:
                    method = 'dinheiro';
            }

            // 4. Salvar registro na coleção de pagamentos
            await db.collection('payments').add({
                saleId: saleId,
                amount: amount,
                method: method,
                date: admin.firestore.Timestamp.now(),
                notes: `Pagamento Asaas (ID: ${paymentId})`,
                externalId: paymentId,
                customerId: customerId,
                source: 'asaas',
                status: 'confirmed',
                billingType: payment.billingType,
                createdAt: admin.firestore.Timestamp.now()
            });

            // 5. Atualizar status da venda
            const currentPaid = saleData?.paidAmount || 0;
            const newPaidTotal = currentPaid + amount;
            const total = saleData?.total || 0;

            let newStatus = 'pendente';
            if (newPaidTotal >= total) {
                newStatus = 'pago';
            } else if (newPaidTotal > 0) {
                newStatus = 'parcial';
            }

            await saleRef.update({
                paidAmount: newPaidTotal,
                paymentStatus: newStatus,
                asaasPaymentId: paymentId,
                asaasCustomerId: customerId,
                lastPaymentDate: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            });

            console.log(`✅ Venda ${saleId} atualizada para ${newStatus}. Pago: R$ ${newPaidTotal.toFixed(2)}`);
            
            // 6. Log detalhado para auditoria
            await db.collection('asaas_webhook_logs').add({
                event: event,
                saleId: saleId,
                paymentId: paymentId,
                customerId: customerId,
                amount: amount,
                billingType: payment.billingType,
                status: newStatus,
                processedAt: admin.firestore.Timestamp.now(),
                success: true
            });

        } else if (event === 'PAYMENT_OVERDUE') {
            console.log(`⏰ Pagamento vencido para venda ${saleId}`);
            
            // Atualizar status para vencido se ainda não foi pago
            const saleRef = db.collection('sales').doc(saleId);
            const saleSnapshot = await saleRef.get();
            
            if (saleSnapshot.exists) {
                const saleData = saleSnapshot.data();
                if (saleData?.paymentStatus === 'pendente') {
                    await saleRef.update({
                        paymentStatus: 'vencido',
                        overdueDate: admin.firestore.Timestamp.now(),
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                    console.log(`⚠️ Venda ${saleId} marcada como vencida`);
                }
            }
        }

        res.status(200).send({ 
            status: 'success', 
            message: `Evento ${event} processado com sucesso`,
            saleId: saleId,
            paymentId: paymentId
        });

    } catch (error) {
        console.error('💥 Erro ao processar webhook Asaas:', error);
        
        // Log do erro para auditoria
        try {
            await db.collection('asaas_webhook_logs').add({
                event: req.body?.event || 'unknown',
                error: error instanceof Error ? error.message : String(error),
                body: req.body,
                processedAt: admin.firestore.Timestamp.now(),
                success: false
            });
        } catch (logError) {
            console.error('Erro ao salvar log de erro:', logError);
        }
        
        res.status(500).send({ error: 'Internal Server Error' });
    }
});
