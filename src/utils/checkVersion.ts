// Sistema de verificação de versão
// Força reload quando há nova versão disponível

const APP_VERSION = '2.1.0'; // Incrementar quando fizer deploy
const VERSION_KEY = 'app_version';

export function checkAppVersion() {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  
  if (savedVersion !== APP_VERSION) {
    console.log('🔄 Nova versão detectada!');
    console.log(`   └─ Versão antiga: ${savedVersion || 'nenhuma'}`);
    console.log(`   └─ Versão nova: ${APP_VERSION}`);
    
    // Limpar cache do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Limpar cache do navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Salvar nova versão
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Recarregar página
    console.log('🔄 Recarregando página...');
    window.location.reload();
  } else {
    console.log(`✅ Versão atual: ${APP_VERSION}`);
  }
}

// Verificar versão a cada 5 minutos
export function startVersionCheck() {
  checkAppVersion();
  
  setInterval(() => {
    checkAppVersion();
  }, 5 * 60 * 1000); // 5 minutos
}
