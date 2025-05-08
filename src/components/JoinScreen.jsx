import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import "../styles/pixel-art.css";
import chokito1 from "../assets/chokito1.png";
import chokito2 from "../assets/chokito2.png";
import chokito3 from "../assets/chokito3.png";
import chokito4 from "../assets/chokito4.png";

export default function JoinScreen() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [roomKey, setRoomKey] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isRoomNew, setIsRoomNew] = useState(false);
  const navigate = useNavigate();

  const images = [chokito1, chokito4, chokito2, chokito3];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async () => {
    if (!username.trim()) return alert("¡Necesitas un nombre!");
    if (!roomId.trim()) return alert("¡Necesitas un ID de sala!");

    const roomRef = ref(db, `rooms/${roomId}`);

    try {
      const snapshot = await get(roomRef);

      if (snapshot.exists()) {
        setIsRoomNew(false);
        setModalMessage("Ingresar clave de la sala");
      } else {
        setIsRoomNew(true);
        setModalMessage("Elegir clave para sala");
      }

      setShowModal(true);
    } catch (error) {
      console.error("Error al verificar la sala:", error);
    }
  };

  const handleModalConfirm = async () => {
    const roomRef = ref(db, `rooms/${roomId}`);

    try {
      if (isRoomNew) {
        if (!roomKey.trim()) {
          alert("Debes ingresar una clave para la sala.");
          return;
        }

        await set(roomRef, { key: roomKey });
        navigate(`/${roomId}`, { state: { username } });

      } else {
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const storedKey = data.key;

          if (storedKey === roomKey) {
            navigate(`/${roomId}`, { state: { username } });
          } else {
            alert("Clave incorrecta.");
          }
        }
      }
    } catch (error) {
      console.error("Error en la operación:", error);
    }

    setShowModal(false);
    setRoomKey("");
  };

  const handleModalClose = () => {
    setShowModal(false);
    setRoomKey("");
  };

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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{modalMessage}</h2>
            <input
              type="password"
              placeholder="Password"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value)}
              maxLength={4}
              className="pixel-input"
            />
            <div className="modal-buttons">
              <button onClick={handleModalConfirm} className="modal-button">
                ✔️
              </button>
              <button onClick={handleModalClose} className="modal-button">
                ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
