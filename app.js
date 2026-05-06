// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyCVFsqfrSQ2h8AwZ2kTYgC5zSB0_ZQJA1Y",  // 请替换为真实的 Firebase API 密钥
  authDomain: "iron-auto-market.firebaseapp.com",
  projectId: "iron-auto-market",
  storageBucket: "iron-auto-market.firebasestorage.app",
  messagingSenderId: "465737975946",
  appId: "1:465737975946:web:ac129a778372222d42c573"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Firebase Storage
const storage = firebase.storage();

console.log('Firebase initialized successfully');
console.log('Firestore available:', db ? 'Yes' : 'No');
console.log('Storage available:', storage ? 'Yes' : 'No');

// Export for use in other scripts
window.db = db;
window.storage = storage;

// Initialize the app when Firebase is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof loadCarsFromDatabase === 'function') {
        loadCarsFromDatabase();
    }
});