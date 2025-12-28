import * as admin from 'firebase-admin';

admin.initializeApp();

// Exportar funções de email
export { sendReportEmail, sendDailyReport, sendLowStockAlert } from './sendEmail';
