import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onDisconnect, onValue, off, push, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Función para registrar a un usuario en una sala
function connectUserToRoom(roomId, username) {
  const userRef = ref(db, `rooms/${roomId}/users/${username}`);
  set(userRef, true); // Marca como conectado
  onDisconnect(userRef).remove(); // Se borra al desconectarse
}

// Escuchar los usuarios conectados en una sala
function listenToRoomUsers(roomId, callback) {
  const usersRef = ref(db, `rooms/${roomId}/users`);
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.keys(data));
  });
}

// Opcional: limpiar listeners si cambias de sala o desmontas
function stopListeningToRoomUsers(roomId) {
  const usersRef = ref(db, `rooms/${roomId}/users`);
  off(usersRef);
}

export {
  db,
  ref,
  set,
  push,
  off,
  onValue,
  serverTimestamp,
  connectUserToRoom,
  listenToRoomUsers,
  stopListeningToRoomUsers,
};