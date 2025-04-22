import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ref, push, onValue, off, serverTimestamp, set, onDisconnect, update } from 'firebase/database';
import { db } from '../firebase';
import '../styles/pixel-art.css';
import ColorSelector from './ColorSelector';

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const messagesEndRef = useRef(null);
  const username = state?.username || 'Anónimo';
  const messageSound = new Audio('/message-sound.mp3');

  const defaultPalette = {
    primary: '#edeff5',
    secondary: '#edeff5',
  };

  const [currentPalette, setCurrentPalette] = useState(palette || defaultPalette);
  const [bgColor, setBgColor] = useState('rgb(199, 206, 234)');

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
    return () => {
      document.body.style.backgroundColor = '';
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
    let previousCount = 0;

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sorted = Object.values(data).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (sorted.length > previousCount) {
        const lastMsg = sorted[sorted.length - 1];
        if (lastMsg.user !== username) messageSound.play();
      }

      previousCount = sorted.length;
      setMessages(sorted);
    });

    return () => {
      off(messagesRef);
    };
  }, [roomId, username]);

  useEffect(() => {
    const usersRef = ref(db, `rooms/${roomId}/users`);
    
    // Añade el usuario actual
    const userRef = push(usersRef);
    set(userRef, {
      name: username,
      online: true,
      joinedAt: serverTimestamp()
    });

   
    onDisconnect(userRef).update({
      online: false,
      leftAt: serverTimestamp()
    });

    
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userList = Object.entries(data).map(([id, user]) => ({ id, ...user }));
      setUsers(userList.filter(user => user.online));
    });

    return () => {
    
      update(userRef, { online: false });
      off(usersRef);
    };
  }, [roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePaletteChange = (colorType, colorValue) => {
    setCurrentPalette((prevPalette) => ({
      ...prevPalette,
      [colorType]: colorValue,
    }));
  };

  const increaseZoom = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const decreaseZoom = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const renderMessages = () => {
    let lastUser = null;
    let groupedMessages = [];
  
    messages.forEach((msg) => {
      if (msg.user === lastUser) {
        groupedMessages[groupedMessages.length - 1].messages.push(msg);
      } else {
        groupedMessages.push({ user: msg.user, messages: [msg] });
      }
      lastUser = msg.user;
    });
  
    return groupedMessages.map((group, i) => (
      <div key={i} className="pixel-message" style={{ borderColor: group.messages[0].color }}>
        <div style={{ color: group.messages[0].color }}>
          {group.user}
        </div>
        {group.messages.map((msg, j) => (
          <div key={j}>{msg.text}</div>
        ))}
      </div>
    ));
  };

  return (
    <div className="app" style={{ 
      transform: `scale(${zoomLevel})`,
      width: `${100/zoomLevel}%`,
      height: `${100/zoomLevel}%`,
      transformOrigin: 'top left'
    }}>
      <div className="pixel-room" style={{ backgroundColor: currentPalette.secondary }}>
        <div className="room-header">
          <h2 className="pixel-text">SALA: {roomId}</h2>
          <div className="online-count">
            {users.length} ONLINE
          </div>
        </div>

        <ColorSelector 
          onChange={handlePaletteChange} 
          currentPalette={currentPalette} 
        />

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

<div className="zoom-controls">
  <button className="zoom-button" onClick={decreaseZoom}>-</button>
  <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
  <button className="zoom-button" onClick={increaseZoom}>+</button>
</div>
    </div>
  );
}