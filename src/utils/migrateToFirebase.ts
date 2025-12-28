import { transactionService } from '../services/transactionService';
import { stockMovementService } from '../services/stockMovementService';
import { fiadoPaymentService } from '../services/fiadoPaymentService';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';

export interface MigrationResult {
  transactions: number;
  stockMovements: number;
  fiadoPayments: number;
  products: number;
  total: number;
  success: boolean;
  errors: string[];
}

/**
 * Migra todos os dados do localStorage para o Firebase
 * @param userId - ID do usuário autenticado
 * @returns Resultado da migração com contadores
 */
export async function migrateAllDataToFirebase(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    transactions: 0,
    stockMovements: 0,
    fiadoPayments: 0,
    products: 0,
    total: 0,
    success: false,
    errors: []
  };

  try {
    console.log('🚀 Iniciando migração de dados para Firebase...');
    toast.loading('Migrando dados para Firebase...', { id: 'migration' });

    // 1. Migrar Transações Financeiras
    try {
      console.log('📊 Migrando transações financeiras...');
      result.transactions = await transactionService.migrateFromLocalStorage(userId);
      console.log(`✅ ${result.transactions} transações migradas`);
    } catch (error: any) {
      console.error('❌ Erro ao migrar transações:', error);
      result.errors.push(`Transações: ${error.message}`);
    }

    // 2. Migrar Movimentações de Estoque
    try {
      console.log('📦 Migrando movimentações de estoque...');
      result.stockMovements = await stockMovementService.migrateFromLocalStorage(userId);
      console.log(`✅ ${result.stockMovements} movimentações migradas`);
    } catch (error: any) {
      console.error('❌ Erro ao migrar movimentações:', error);
      result.errors.push(`Movimentações: ${error.message}`);
    }

    // 3. Migrar Pagamentos de Fiados
    try {
      console.log('💰 Migrando pagamentos de fiados...');
      result.fiadoPayments = await fiadoPaymentService.migrateFromLocalStorage(userId);
      console.log(`✅ ${result.fiadoPayments} pagamentos migrados`);
    } catch (error: any) {
      console.error('❌ Erro ao migrar pagamentos:', error);
      result.errors.push(`Pagamentos: ${error.message}`);
    }

    // 4. Migrar Produtos
    try {
      console.log('🛍️ Migrando produtos...');
      result.products = await productService.migrateFromLocalStorage(userId);
      console.log(`✅ ${result.products} produtos migrados`);
    } catch (error: any) {
      console.error('❌ Erro ao migrar produtos:', error);
      result.errors.push(`Produtos: ${error.message}`);
    }

    // Calcular total
    result.total = result.transactions + result.stockMovements + result.fiadoPayments + result.products;
    result.success = result.total > 0 || result.errors.length === 0;

    // Mostrar resultado
    if (result.success) {
      toast.success(
        `✅ Migração concluída! ${result.total} registros migrados para Firebase`,
        { id: 'migration', duration: 5000 }
      );
      
      console.log('🎉 Migração concluída com sucesso!');
      console.log('📊 Resumo:', {
        transações: result.transactions,
        movimentações: result.stockMovements,
        pagamentos: result.fiadoPayments,
        produtos: result.products,
        total: result.total
      });
    } else {
      toast.error(
        `⚠️ Migração concluída com erros. ${result.total} registros migrados.`,
        { id: 'migration', duration: 5000 }
      );
    }

    return result;
  } catch (error: any) {
    console.error('💥 Erro fatal na migração:', error);
    result.errors.push(`Erro fatal: ${error.message}`);
    result.success = false;
    
    toast.error('❌ Erro ao migrar dados para Firebase', { id: 'migration' });
    
    return result;
  }
}

/**
 * Verifica se há dados no localStorage que precisam ser migrados
 * @param userId - ID do usuário autenticado
 * @returns true se houver dados para migrar
 */
export function hasDataToMigrate(userId: string): boolean {
  const hasTransactions = !!localStorage.getItem(`transactions_${userId}`);
  const hasMovements = !!localStorage.getItem(`stock_movements_${userId}`);
  const hasPayments = !!localStorage.getItem(`fiado_payments_${userId}`);
  const hasProducts = !!localStorage.getItem(`products_${userId}`);
  
  return hasTransactions || hasMovements || hasPayments || hasProducts;
}

/**
 * Limpa dados do localStorage após migração bem-sucedida
 * @param userId - ID do usuário autenticado
 * @param result - Resultado da migração
 */
export function cleanupLocalStorageAfterMigration(userId: string, result: MigrationResult): void {
  if (!result.success) {
    console.warn('⚠️ Migração não foi totalmente bem-sucedida. Mantendo dados no localStorage.');
    return;
  }

  try {
    // Fazer backup antes de limpar
    const backup = {
      transactions: localStorage.getItem(`transactions_${userId}`),
      stockMovements: localStorage.getItem(`stock_movements_${userId}`),
      fiadoPayments: localStorage.getItem(`fiado_payments_${userId}`),
      products: localStorage.getItem(`products_${userId}`),
      timestamp: new Date().toISOString()
    };

    // Salvar backup
    localStorage.setItem(`migration_backup_${userId}`, JSON.stringify(backup));

    // Limpar dados migrados
    if (result.transactions > 0) {
      localStorage.removeItem(`transactions_${userId}`);
      console.log('🗑️ Transações removidas do localStorage');
    }

    if (result.stockMovements > 0) {
      localStorage.removeItem(`stock_movements_${userId}`);
      console.log('🗑️ Movimentações removidas do localStorage');
    }

    if (result.fiadoPayments > 0) {
      localStorage.removeItem(`fiado_payments_${userId}`);
      console.log('🗑️ Pagamentos removidos do localStorage');
    }

    if (result.products > 0) {
      localStorage.removeItem(`products_${userId}`);
      console.log('🗑️ Produtos removidos do localStorage');
    }

    console.log('✅ Limpeza do localStorage concluída. Backup salvo.');
    toast.success('Dados locais limpos. Backup criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar localStorage:', error);
    toast.error('Erro ao limpar dados locais. Dados mantidos por segurança.');
  }
}

/**
 * Restaura dados do backup em caso de problemas
 * @param userId - ID do usuário autenticado
 */
export function restoreFromBackup(userId: string): boolean {
  try {
    const backupData = localStorage.getItem(`migration_backup_${userId}`);
    if (!backupData) {
      console.warn('⚠️ Nenhum backup encontrado');
      return false;
    }

    const backup = JSON.parse(backupData);

    if (backup.transactions) {
      localStorage.setItem(`transactions_${userId}`, backup.transactions);
    }

    if (backup.stockMovements) {
      localStorage.setItem(`stock_movements_${userId}`, backup.stockMovements);
    }

    if (backup.fiadoPayments) {
      localStorage.setItem(`fiado_payments_${userId}`, backup.fiadoPayments);
    }

    if (backup.products) {
      localStorage.setItem(`products_${userId}`, backup.products);
    }

    console.log('✅ Dados restaurados do backup');
    toast.success('Dados restaurados do backup com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    toast.error('Erro ao restaurar dados do backup');
    return false;
  }
}
