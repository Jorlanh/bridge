// Service Worker para Firebase Cloud Messaging
// Este arquivo é um template - as variáveis serão injetadas durante o build
// Este arquivo deve estar na pasta public para ser acessível

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase - variáveis injetadas durante o build
const firebaseConfig = {
  apiKey: "{{VITE_FIREBASE_API_KEY}}",
  authDomain: "{{VITE_FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{VITE_FIREBASE_PROJECT_ID}}",
  storageBucket: "{{VITE_FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{VITE_FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{VITE_FIREBASE_APP_ID}}",
  measurementId: "{{VITE_FIREBASE_MEASUREMENT_ID}}"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obter instância do Messaging
const messaging = firebase.messaging();

// Handler para mensagens em background
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.notificationId || 'notification',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Se houver um link na notificação, abrir
  if (event.notification.data?.link) {
    event.waitUntil(
      clients.openWindow(event.notification.data.link)
    );
  } else {
    // Caso contrário, focar na janela existente ou abrir nova
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});





