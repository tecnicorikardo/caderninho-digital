import { useEffect } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AppRoutes } from './routes';
import { MigrationPrompt } from './components/MigrationPrompt';
import { MobileNavigation } from './components/MobileNavigation';
import { startVersionCheck } from './utils/checkVersion';
import { initializeCapacitorPlugins } from './utils/capacitorPlugins';
import { Capacitor } from '@capacitor/core';

function AppContent() {
  // Verificar versão do app
  useEffect(() => {
    startVersionCheck();
    
    // Inicializar plugins do Capacitor
    initializeCapacitorPlugins();
    
    // Adicionar classes CSS baseadas na plataforma
    const platform = Capacitor.getPlatform();
    document.body.classList.add(platform);
    
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.add('web');
    }
  }, []);
  
  return (
    <>
      <AppRoutes />
      <HotToaster position="top-right" />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        duration={5000}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
