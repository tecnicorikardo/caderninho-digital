// Utilitário para Backup e Restauração de Dados do localStorage

export const backupLocalStorage = (userId: string) => {
  const backup = {
    timestamp: new Date().toISOString(),
    userId: userId,
    products: localStorage.getItem(`products_${userId}`),
    movements: localStorage.getItem(`stock_movements_${userId}`),
    clients: localStorage.getItem(`clients_${userId}`),
    transactions: localStorage.getItem(`transactions_${userId}`)
  };

  // Baixar como arquivo JSON
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-caderninho-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return backup;
};

export const restoreLocalStorage = (backupData: any, userId: string) => {
  if (backupData.products) {
    localStorage.setItem(`products_${userId}`, backupData.products);
  }
  if (backupData.movements) {
    localStorage.setItem(`stock_movements_${userId}`, backupData.movements);
  }
  if (backupData.clients) {
    localStorage.setItem(`clients_${userId}`, backupData.clients);
  }
  if (backupData.transactions) {
    localStorage.setItem(`transactions_${userId}`, backupData.transactions);
  }
};

export const getLocalStorageStats = (userId: string) => {
  const stats = {
    products: 0,
    movements: 0,
    clients: 0,
    transactions: 0
  };

  try {
    const products = localStorage.getItem(`products_${userId}`);
    if (products) stats.products = JSON.parse(products).length;

    const movements = localStorage.getItem(`stock_movements_${userId}`);
    if (movements) stats.movements = JSON.parse(movements).length;

    const clients = localStorage.getItem(`clients_${userId}`);
    if (clients) stats.clients = JSON.parse(clients).length;

    const transactions = localStorage.getItem(`transactions_${userId}`);
    if (transactions) stats.transactions = JSON.parse(transactions).length;
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
  }

  return stats;
};
