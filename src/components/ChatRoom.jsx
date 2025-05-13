import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  set,
  get,
  remove,
  onDisconnect
} from "firebase/database";
import { db } from "../firebase";
import "../styles/pixel-art.css";
import ColorSelector from "./ColorSelector";

const imgbbAPIKey = "dfb9005a586dde94e04e1d305c1ca3b6";

export default function ChatRoom({ palette }) {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
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
      if (!roomKey.trim()) {
        alert("Debes ingresar una clave para crear la sala.");
        return;
      }

      await set(roomRef, { key: roomKey });
      setShowModal(false);
      listenForMessages();
      updateUserCount();
    } else if (snapshot.exists()) {
      const data = snapshot.val();
      const storedKey = data.key;

      if (storedKey === roomKey) {
        setShowModal(false);
        listenForMessages();
        updateUserCount();
      } else {
        alert("Clave incorrecta.");
        setRoomKey("");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/");
  };

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
      const onlineUsers = Object.values(usersData).filter((user) => user.online);
      setUsers(onlineUsers);
    });
  };

  useEffect(() => {
    return () => {
      if (userRef.current) {
        remove(userRef.current);
      }
    };
  }, []);

  const listenForMessages = () => {
    const messagesRef = ref(db, `rooms/${roomId}/messages`);

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const sorted = Object.entries(data)
        .map(([key, val]) => ({ id: key, ...val }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      const prevLength = prevLengthRef.current;
      const latest = sorted[sorted.length - 1];
      prevLengthRef.current = sorted.length;

      if (
        prevLength > 0 &&
        sorted.length > prevLength &&
        latest?.user !== username
      ) {
        messageSound.play().catch((err) =>
          console.warn("No se pudo reproducir el sonido:", err)
        );
      }

      setMessages(sorted);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    push(ref(db, `rooms/${roomId}/messages`), {
      user: username,
      text: message.trim(),
      timestamp: Date.now(),
      color: "rgb(181, 234, 215)"
    });

    setMessage("");
  };

  const sendImageMessage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("expiration", "180");
    formData.append("key", imgbbAPIKey);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    if (!result.success) return alert("No se pudo subir la imagen.");

    const url = result.data.url;
    const msgRef = push(ref(db, `rooms/${roomId}/messages`));
    await set(msgRef, {
      user: username,
      image: url,
      timestamp: Date.now(),
      color: "rgb(181, 234, 215)"
    });

    setTimeout(() => {
      remove(msgRef);
    }, 180000);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) sendImageMessage(file);
        }
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      sendImageMessage(file);
    }
  };

  const handleDragOver = () => setDragOver(true);
  const handleDragLeave = () => setDragOver(false);
  const handleUploadClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      sendImageMessage(file);
    }
  };

  const handleColorChange = (colorType, colorValue) => {
    if (colorType === "secondary") {
      setBoxColor(colorValue);
    }
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
      <div
        key={i}
        className="pixel-message"
        style={{ borderColor: "rgb(181, 234, 215)" }}
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
        {group.messages.map((msg, j) => {
          const isLast = j === group.messages.length - 1;
          return (
            <div key={j} style={{ position: "relative", marginBottom: "4px" }}>
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
              {isLast && msg.timestamp && (
                <div
                style={{
                  marginTop: "6px",
                  fontSize: "0.6rem",
                  opacity: 0.6,
                  textAlign: "right",
                }}
              >
                  {(() => {
                    const date = new Date(msg.timestamp);
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();
                    return isToday
                      ? date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : date.toLocaleDateString([], {
                          day: "2-digit",
                          month: "2-digit"
                        }) +
                          " " +
                          date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                  })()}
                </div>
              )}
            </div>
          );
        })}
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
      <div className="pixel-room" style={{ backgroundColor: boxColor, position: "relative" }}>
        {dragOver && (
          <div style={{
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
          }}>Suelta para enviar imagen</div>
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

          <form className="message-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pixel-input"
              placeholder="Escribe tu mensaje..."
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
            <button type="submit" className="pixel-button">
              Enviar
            </button>
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
              <button className="modal-button" onClick={handleModalConfirm}>
                ✔️
              </button>
              <button className="modal-button" onClick={handleModalClose}>
                ❌
              </button>
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