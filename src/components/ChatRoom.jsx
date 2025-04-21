import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ref, push, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import '../styles/pixel-art.css';
import ColorSelector from './ColorSelector';

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const username = state?.username || 'Anónimo';
  const messageSound = new Audio('/message-sound.mp3');

  const defaultPalette = {
    primary: '#ff6f61',   // Color del texto o bordes
    secondary: '#f5f5f5', // Color del fondo de la sala
  };

  const [currentPalette, setCurrentPalette] = useState(palette || defaultPalette);
  const [bgColor, setBgColor] = useState('rgb(199, 206, 234)');

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
    return () => {
      document.body.style.backgroundColor = ''; // limpia cuando sales
    };
  }, [bgColor]);

  const handleColorChange = (_, colorValue) => {
    setBgColor(colorValue);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    push(ref(db, `rooms/${roomId}/messages`), {
      user: username,
      text: message.trim(),
      timestamp: serverTimestamp(),
      color: currentPalette.primary,
    });
    setMessage('');
  };

  useEffect(() => {
    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    const usersRef = ref(db, `rooms/${roomId}/users`);
    let previousCount = 0;

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length > previousCount) {
        const lastMsg = sorted[sorted.length - 1];
        if (lastMsg.user !== username) messageSound.play();
      }

      previousCount = sorted.length;
      setMessages(sorted);
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsers(Object.values(data));
    });

    return () => {
      off(messagesRef);
      off(usersRef);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para actualizar los colores
  const handlePaletteChange = (colorType, colorValue) => {
    setCurrentPalette((prevPalette) => ({
      ...prevPalette,
      [colorType]: colorValue,
    }));
  };

  const renderMessages = () => {
    let lastUser = null;

    return messages.map((msg, i) => {
      const showUsername = msg.user !== lastUser;
      lastUser = msg.user;

      return (
        <div key={i} className="pixel-message" style={{ borderColor: msg.color }}>
          {showUsername && (
            <div style={{ color: msg.color }}>
              {msg.user}
            </div>
          )}
          <div>{msg.text}</div>
        </div>
      );
    });
  };

  return (
    <div className="pixel-room" style={{ backgroundColor: currentPalette.secondary }}>
      <div className="room-header">
        <h2 className="pixel-text">SALA: {roomId}</h2>
        <div className="online-count">
          {users.filter(u => u.online).length} ONLINE
        </div>
      </div>

      {/* Selector de colores */}
      <div className="color-selector-container">
        <ColorSelector 
          onChange={handlePaletteChange} 
          currentPalette={currentPalette} 
        />
      </div>

      <div className="chat-container">
        <div className="messages-box">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="pixel-input"
            placeholder="Escribe tu mensaje..."
          />
          <button type="submit" className="pixel-button">Enviar</button>
        </form>
      </div>
    </div>
  );
}
