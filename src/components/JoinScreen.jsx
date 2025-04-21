import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/pixel-art.css'

export default function JoinScreen({ palettes, setColorPalette }) {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()

  const handleJoin = () => {
    if (!username.trim()) return alert('¡Necesitas un nombre!')
    navigate(`/${roomId.trim() || generateRandomId()}`, { 
      state: { username: username.trim() } 
    })
  }

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 8)
  }

  return (
    <div className="pixel-screen">
      <h1 className="chokito-title">CHOKITO CHAT</h1>
      <input
        type="text"
        placeholder="Tu nombre"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="pixel-input"
      />
      <button onClick={handleJoin} className="pixel-button">
        ENTRAR
      </button>
    </div>
  )
}
