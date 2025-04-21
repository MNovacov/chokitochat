import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ref, push, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import UserBadge from './UserBadge';
import '../styles/pixel-art.css';

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Enviar mensaje
  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    push(ref(db, `rooms/${roomId}/messages`), {
      user: state?.username || 'Anónimo',
      text: message.trim(),
      timestamp: serverTimestamp(),
      color: palette.primary
    });
    setMessage('');
  };

  // Efectos para datos en tiempo real
  useEffect(() => {
    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    const usersRef = ref(db, `rooms/${roomId}/users`);
    
    // Escuchar mensajes
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMessages(Object.values(data));
    });

    // Escuchar usuarios
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsers(Object.values(data));
    });

    return () => {
      off(messagesRef);
      off(usersRef);
    };
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="pixel-room" style={{ backgroundColor: palette.secondary }}>
      <div className="room-header">
        <h2 className="pixel-text">SALA: {roomId}</h2>
        <div className="online-count">
          {users.filter(u => u.online).length} ONLINE
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-box">
          {messages.map((msg, i) => (
            <div key={i} className="pixel-message" style={{ borderColor: msg.color }}>
              <UserBadge 
                name={msg.user} 
                isOnline={users.some(u => u.name === msg.user && u.online)}
              />
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="users-list pixel-border">
          <h3>JUGADORES:</h3>
          {users.map((user, i) => (
            <UserBadge 
              key={i} 
              name={user.name} 
              isOnline={user.online} 
              showStatus={true}
            />
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe algo..."
          className="pixel-input"
          maxLength={200}
        />
        <button type="submit" className="pixel-button" style={{ backgroundColor: palette.primary }}>
          ENVIAR
        </button>
      </form>
    </div>
  );
}
