import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import JoinScreen from "./components/JoinScreen";
import ChatRoom from "./components/ChatRoom";
import "./App.css";
import "./styles/pixel-art.css";

function StarsBackground() {
  return (
    <>
      <div className="stars" id="stars1"></div>
      <div className="stars" id="stars2"></div>
      <div className="stars" id="stars3"></div>
    </>
  );
}

export default function App() {
  const [paletteName, setPaletteName] = useState("green");
  const palettes = {
    green: { primary: "#b5ead7", secondary: "#c7ceea", text: "#2d3436" },
    dark: { primary: "#2d3436", secondary: "#636e72", text: "#dfe6e9" },
    blue: { primary: "#a2d2ff", secondary: "#bde0fe", text: "#1d3557" },
    orange: { primary: "#ffdac1", secondary: "#e2f0cb", text: "#6d6875" },
  };

  return (
    <div className="app-wrapper">
      <StarsBackground />
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <JoinScreen
                palettes={palettes}
                setColorPalette={setPaletteName}
              />
            }
          />
          <Route
            path="/:roomId"
            element={<ChatRoom palette={palettes[paletteName]} />}
          />
        </Routes>
      </HashRouter>
    </div>
  );
}
