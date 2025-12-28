import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';

export const initializeCapacitorPlugins = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configurar status bar
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Esconder splash screen após carregamento
    await SplashScreen.hide();
  }
};

export const shareContent = async (title: string, text: string, url?: string) => {
  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title,
      text,
      url,
    });
  } else {
    // Fallback para web
    if (navigator.share) {
      await navigator.share({ title, text, url });
    } else {
      // Copiar para clipboard como fallback
      await navigator.clipboard.writeText(`${title}\n${text}${url ? `\n${url}` : ''}`);
      showToast('Conteúdo copiado para área de transferência!');
    }
  }
};

export const showToast = async (message: string) => {
  if (Capacitor.isNativePlatform()) {
    await Toast.show({
      text: message,
      duration: 'short',
      position: 'bottom'
    });
  } else {
    // Usar o toast existente do react-hot-toast
    console.log('Toast:', message);
  }
};

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();