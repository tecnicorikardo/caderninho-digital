import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AppRoutes } from './routes';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
