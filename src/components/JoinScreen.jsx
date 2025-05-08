import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pixel-art.css';
import chokito1 from '../assets/chokito1.png';
import chokito2 from '../assets/chokito2.png';
import chokito3 from '../assets/chokito3.png';
import chokito4 from '../assets/chokito4.png';

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

  const images = [chokito1, chokito4, chokito2, chokito3];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pixel-screen">
      <h1 className="chokito-title">CHOKITO CHAT</h1>

      <img
        src={images[currentImage]}
        alt="Chokito mascot"
        className="chokito-image"
      />

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
