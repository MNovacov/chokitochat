import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ref, push, onValue, off, serverTimestamp, set, get } from "firebase/database";
import { db } from "../firebase";
import "../styles/pixel-art.css";
import ColorSelector from "./ColorSelector";

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const messagesEndRef = useRef(null);
  const username = state?.username || "";
  const [roomKey, setRoomKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [boxColor, setBoxColor] = useState("rgb(34, 34, 34)");
  const [modalMessage, setModalMessage] = useState("");
  const [isRoomNew, setIsRoomNew] = useState(false);
  const messageSound = new Audio('/message-sound.mp3');

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    const verifyRoom = async () => {
      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setIsRoomNew(true);
        setModalMessage("Elige una clave para la nueva sala:");
        setShowModal(true);
      } else {
        const data = snapshot.val();
        if (data.key) {
          setModalMessage("Ingrese la clave de la sala:");
          setShowModal(true);
        } else {
          listenForMessages();
        }
      }
    };

    verifyRoom();
  }, [roomId, username, navigate]);

  const handleModalConfirm = async () => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    try {
      if (isRoomNew) {
        if (!roomKey.trim()) {
          alert("Debes ingresar una clave para la sala.");
          return;
        }

        await set(roomRef, { key: roomKey });
        setShowModal(false);
        listenForMessages();

      } else if (snapshot.exists()) {
        const data = snapshot.val();
        const storedKey = data.key;

        if (storedKey === roomKey) {
          setShowModal(false);
          listenForMessages();
        } else {
          alert("Clave incorrecta.");
          setRoomKey("");
        }
      }
    } catch (error) {
      console.error("Error al manejar la clave:", error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/");
  };

  const listenForMessages = () => {
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
  };

  const handleColorChange = (colorType, colorValue) => {
    if (colorType === "secondary") {
      setBoxColor(colorValue);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    push(ref(db, `rooms/${roomId}/messages`), {
      user: username,
      text: message.trim(),
      timestamp: serverTimestamp(),
      color: '#edeff5',
    });

    setMessage("");
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
        <div style={{ color: group.messages[0].color }}>{group.user}</div>
        {group.messages.map((msg, j) => (
          <div key={j}>{msg.text}</div>
        ))}
      </div>
    ));
  };

  return (
    <div className="app" style={{
      transform: `scale(${zoomLevel})`,
      width: `${100 / zoomLevel}%`,
      height: `${100 / zoomLevel}%`,
      transformOrigin: "top left",
    }}>
      <div className="pixel-room" style={{ backgroundColor: boxColor }}>
        <div className="room-header">
          <h2 className="pixel-text">SALA: {roomId}</h2>
          <div className="online-count">{users.length} ONLINE</div>
        </div>

        <ColorSelector
          onChange={handleColorChange}
          currentPalette={{ secondary: boxColor }}
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{modalMessage}</h2>
            <input
              type="password"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value)}
              maxLength={4}
              className="pixel-input"
            />
            <div className="modal-buttons">
              <button className="modal-button" onClick={handleModalConfirm}>✔️</button>
              <button className="modal-button" onClick={handleModalClose}>❌</button>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-controls">
        <button className="zoom-button" onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}>-</button>
        <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
        <button className="zoom-button" onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))}>+</button>
      </div>
    </div>
  );
}
