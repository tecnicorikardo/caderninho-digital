importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAbYh9oAV4H5EPZJytRZq4HM4DG7q0iYIc",
    authDomain: "bloquinhodigital.firebaseapp.com",
    projectId: "bloquinhodigital",
    storageBucket: "bloquinhodigital.firebasestorage.app",
    messagingSenderId: "16911555826",
    appId: "1:16911555826:web:addd018a6120ee67ef846b",
    measurementId: "G-K6H8VS1F95"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.jpg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
