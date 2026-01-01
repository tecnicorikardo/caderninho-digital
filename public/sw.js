// Service Worker para PWA e Notificações Push
// Versão atualizada para PagarMe - 31/12/2025
const CACHE_NAME = 'caderninho-v3-pagarme-2025'; // Nova versão para PagarMe
const BASE_URL = self.registration.scope;

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.jpg',
  '/icon-512.jpg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  // Força o SW a ativar imediatamente
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativado');
  // Reivindica o controle dos clientes imediatamente
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Estratégia de Cache: Network First para HTML, Cache First para estáticos
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições não-GET e chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // ESTRATÉGIA 1: Network First para Navegação (HTML)
  // Isso garante que o usuário sempre receba a versão mais nova do index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          console.log('⚠️ Offline: Retornando cache para navegação');
          return caches.match(request) // Tenta URL exata
            .then(response => response || caches.match('/index.html')); // Fallback para index.html
        })
    );
    return;
  }

  // ESTRATÉGIA 2: Cache First para Assets (JS, CSS, Imagens)
  // Se estiver no cache, retorna rápido. Se não, busca na rede e cacheia.
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico)$/) ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          // Não cachear respostas inválidas ou não-sucesso
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network First com fallback simples
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// --- LÓGICA DE NOTIFICAÇÕES PUSH (Mantida Original) ---

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push recebido');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Nova Notificação',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Caderninho Digital';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'default'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notificação clicada');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não tem janela aberta, abrir uma nova
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Service Worker: Notificação fechada');
});

console.log('✅ Service Worker v2 (Network First) carregado');
