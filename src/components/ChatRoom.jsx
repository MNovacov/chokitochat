import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ref,
  push,
  onValue,
  serverTimestamp,
  set,
  get,
  remove,
  onDisconnect
} from "firebase/database";
import { uploadFile } from "@uploadcare/upload-client";
import { db } from "../firebase";
import "../styles/pixel-art.css";
import ColorSelector from "./ColorSelector";

const uploadcarePublicKey = "dd2580a9c669d60b5d49";

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const username = state?.username || "Anónimo";
  const [roomKey, setRoomKey] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isRoomNew, setIsRoomNew] = useState(false);
  const [boxColor, setBoxColor] = useState("rgba(0, 0, 0, 0.35)");
  const userRef = useRef(null);
  const messageSound = new Audio("/message-sound.mp3");
  const prevLengthRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const originalTitle = useRef(document.title);
  const blinkInterval = useRef(null);

  
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeout = useRef(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearInterval(blinkInterval.current);
        document.title = originalTitle.current;
        setNewMessageAlert(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(blinkInterval.current);
    };
  }, []);

  useEffect(() => {
    if (newMessageAlert && document.hidden) {
      blinkInterval.current = setInterval(() => {
        document.title =
          document.title === "💬 Nuevo mensaje"
            ? originalTitle.current
            : "💬 Nuevo mensaje";
      }, 1000);
    }
  }, [newMessageAlert]);

  useEffect(() => {
    if (!username) navigate("/");
    const verifyRoom = async () => {
      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setIsRoomNew(true);
        setModalMessage("La sala no existe. Elige una clave para crearla:");
        setShowModal(true);
      } else {
        const data = snapshot.val();
        if (data.key) {
          setModalMessage("Ingrese la clave de la sala:");
          setShowModal(true);
        } else {
          listenForMessages();
          updateUserCount();
        }
      }
    };
    verifyRoom();
  }, [roomId, username, navigate]);

  const handleModalConfirm = async () => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (isRoomNew) {
      if (!roomKey.trim())
        return alert("Debes ingresar una clave para crear la sala.");
      await set(roomRef, { key: roomKey });
      setShowModal(false);
      listenForMessages();
      updateUserCount();
    } else if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.key === roomKey) {
        setShowModal(false);
        listenForMessages();
        updateUserCount();
      } else {
        alert("Clave incorrecta.");
        setRoomKey("");
      }
    }
  };

  const handleModalClose = () => setShowModal(false) || navigate("/");

  const updateUserCount = () => {
    const usersRef = ref(db, `rooms/${roomId}/users`);
    userRef.current = push(usersRef);
    set(userRef.current, {
      name: username,
      online: true,
      joinedAt: serverTimestamp()
    });
    onDisconnect(userRef.current).remove();
    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      setUsers(Object.values(usersData).filter((user) => user.online));
    });
  };

  useEffect(() => () => userRef.current && remove(userRef.current), []);

  const listenForMessages = () => {
    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sorted = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      const prevLength = prevLengthRef.current;
      const latest = sorted.at(-1);
      prevLengthRef.current = sorted.length;
      if (prevLength && sorted.length > prevLength && latest?.user !== username) {
        messageSound.play().catch(console.warn);
        if (document.hidden) setNewMessageAlert(true);
      }
      setMessages(sorted);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    });
  };

  
  useEffect(() => {
    const tRef = ref(db, `rooms/${roomId}/typing`);
    const unsub = onValue(tRef, (snap) => {
      setTypingUsers(snap.val() || {});
    });
    return () => unsub();
  }, [roomId]);

  const sendImageMessage = async (file) => {
    try {
      const result = await uploadFile(file, {
        publicKey: uploadcarePublicKey,
        store: "auto"
      });
      const url = result.cdnUrl;
      const msgRef = push(ref(db, `rooms/${roomId}/messages`));
      await set(msgRef, {
        user: username,
        image: url,
        timestamp: Date.now(),
        color: "rgb(181, 234, 215)"
      });
      setTimeout(() => remove(msgRef), 60000);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("No se pudo subir la imagen.");
    }
  };

  const handlePaste = (e) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        if (file) sendImageMessage(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) sendImageMessage(file);
  };

  const handleDragOver = () => setDragOver(true);
  const handleDragLeave = () => setDragOver(false);
  const handleUploadClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file?.type.startsWith("image/")) sendImageMessage(file);
  };

  const handleColorChange = (type, val) =>
    type === "secondary" && setBoxColor(val);

  const handleTextMessage = (text) => {
    push(ref(db, `rooms/${roomId}/messages`), {
      user: username,
      text: text.trim(),
      timestamp: Date.now(),
      color: "rgb(181, 234, 215)"
    });
  };

  const deleteMessage = (msgId) =>
    remove(ref(db, `rooms/${roomId}/messages/${msgId}`));

  
  const startTyping = () => {
    set(ref(db, `rooms/${roomId}/typing/${username}`), true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      remove(ref(db, `rooms/${roomId}/typing/${username}`));
    }, 2000);
  };

  const stopTyping = () => {
    clearTimeout(typingTimeout.current);
    remove(ref(db, `rooms/${roomId}/typing/${username}`));
  };

  const renderMessages = () => {
    let lastUser = null;
    let grouped = [];
    messages.forEach((msg) => {
      if (msg.user === lastUser) {
        grouped.at(-1).messages.push(msg);
      } else {
        grouped.push({ user: msg.user, messages: [msg] });
      }
      lastUser = msg.user;
    });
    return grouped.map((group, i) => (
      <div
        key={i}
        className="pixel-message message-group"
        style={{ borderColor: "rgb(181, 234, 215)", position: "relative" }}
      >
        <div
          style={{
            color: "rgb(181, 234, 215)",
            fontWeight: "bold",
            marginBottom: "4px"
          }}
        >
          {group.user}
        </div>
        {group.messages.map((msg, j) => (
          <div
            key={j}
            className="message-item"
            style={{ marginBottom: "4px", position: "relative" }}
          >
            {msg.user === username && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="delete-button"
                title="Eliminar"
              >
                ✖
              </button>
            )}
            {msg.text && <div>{msg.text}</div>}
            {msg.image && (
              <img
                src={msg.image}
                alt="imagen"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "4px",
                  marginTop: "4px"
                }}
              />
            )}
            {j === group.messages.length - 1 && msg.timestamp && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.6rem",
                  opacity: 0.6,
                  textAlign: "right",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {(() => {
                  const d = new Date(msg.timestamp);
                  const now = new Date();
                  const isToday = d.toDateString() === now.toDateString();
                  const time = d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const date = `${String(d.getDate()).padStart(2, "0")}/${String(
                    d.getMonth() + 1
                  ).padStart(2, "0")}`;
                  return isToday ? time : `${date} ${time}`;
                })()}
                {newMessageAlert && document.hidden && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: "red",
                      borderRadius: "50%"
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div
      className="app"
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault();
        handleDragOver();
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        transform: `scale(${zoomLevel})`,
        width: `${100 / zoomLevel}%`,
        height: `${100 / zoomLevel}%`,
        transformOrigin: "top left"
      }}
    >
      
      <div
        className="pixel-room modern-ui"
        style={{ backgroundColor: boxColor, position: "relative" }}
      >
        {dragOver && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              fontSize: "0.75rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
              pointerEvents: "none",
              fontFamily: "'Press Start 2P', cursive"
            }}
          >
            Suelta para enviar imagen
          </div>
        )}
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

         
          {Object.keys(typingUsers).filter((u) => u !== username).length > 0 && (
            <div className="typing-indicator">
              <div>
                {(() => {
                  const others = Object.keys(typingUsers).filter(
                    (u) => u !== username
                  );
                  if (others.length === 1)
                    return `${others[0]} está escribiendo`;
                  if (others.length === 2)
                    return `${others[0]} y ${others[1]} están escribiendo`;
                  return `Varios están escribiendo`;
                })()}
              </div>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <form
            className="message-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleTextMessage(e.target.elements.msg.value);
              e.target.reset();
              stopTyping(); 
            }}
          >
            <input
              name="msg"
              type="text"
              className="pixel-input"
              placeholder="Escribe tu mensaje..."
              autoComplete="off"
              onChange={startTyping} 
              onBlur={stopTyping}    
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="pixel-button"
              onClick={handleUploadClick}
              style={{ borderRadius: "50%", padding: "10px", width: "40px", height: "40px" }}
              title="Adjuntar imagen"
            >
              +
            </button>
            <button type="submit" className="pixel-button">Enviar</button>
          </form>
        </div>
      </div>
      {showModal && (
  <div className="modal modern-ui">   
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
        <button
          className="zoom-button"
          onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
        >
          -
        </button>
        <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
        <button
          className="zoom-button"
          onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2))}
        >
          +
        </button>
      </div>
    </div>
  );
}
