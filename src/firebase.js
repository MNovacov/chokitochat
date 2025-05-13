import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  off,
  push,
  serverTimestamp
} from 'firebase/database';

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

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
const storage = getStorage(app);

function connectUserToRoom(roomId, username) {
  const userRef = ref(db, `rooms/${roomId}/users/${username}`);
  set(userRef, true);
  onDisconnect(userRef).remove();
}

function listenToRoomUsers(roomId, callback) {
  const usersRef = ref(db, `rooms/${roomId}/users`);
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.keys(data));
  });
}

function stopListeningToRoomUsers(roomId) {
  const usersRef = ref(db, `rooms/${roomId}/users`);
  off(usersRef);
}

export {
  db,
  storage,
  ref,
  set,
  push,
  off,
  onValue,
  serverTimestamp,
  connectUserToRoom,
  listenToRoomUsers,
  stopListeningToRoomUsers,
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
};
