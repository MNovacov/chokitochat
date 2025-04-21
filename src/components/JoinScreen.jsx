import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pixel-art.css';

export default function JoinScreen({ palettes, setColorPalette }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!username.trim()) return alert('¡Necesitas un nombre!');
    if (!roomId.trim()) return alert('¡Necesitas un ID de sala!');
    
    navigate(`/${roomId.trim()}`, { 
      state: { username: username.trim() } 
    });
  };

  return (
    <div className="pixel-screen">
      <h1 className="chokito-title">CHOKITO CHAT</h1>

      <div className="input-group">
        <input
          type="text"
          placeholder="Tu nombre"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="pixel-input"
        />
        <input
          type="text"
          placeholder="ID de sala"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="pixel-input"
        />
      </div>

      <button onClick={handleJoin} className="pixel-button">
        ENTRAR
      </button>
    </div>
  );
}
