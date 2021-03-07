importScripts('https://www.gstatic.com/firebasejs/8.2.10/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.10/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
var firebaseConfig = {
    apiKey: "AIzaSyD9njoN659jBaO-Ov6sQI33Q5xi9kRl3jw",
    authDomain: "clue-51aa1.firebaseapp.com",
    databaseURL: "https://clue-51aa1-default-rtdb.firebaseio.com",
    projectId: "clue-51aa1",
    storageBucket: "clue-51aa1.appspot.com",
    messagingSenderId: "314308110149",
    appId: "1:314308110149:web:73d763dd4c6d554714802c",
    measurementId: "G-092MCPQDB9"
};

firebase.initializeApp(firebaseConfig);

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});