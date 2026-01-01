import * as admin from 'firebase-admin';

admin.initializeApp();


// Exportar funções de email
export { sendReportEmail, sendDailyReport, sendLowStockAlert } from './sendEmail';


// Exportar Webhook do Asaas
export { handleAsaasWebhook } from './asaasWebhook';

// Exportar Função de Criação de Cobrança
export { createAsaasCharge } from './createAsaasCharge';

// Exportar Função PagarMe
export { createPagarMeCharge } from './createPagarMeCharge';
