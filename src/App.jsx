import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { useState } from "react"; // Para controlar el menú
import { useApp } from "./hooks/useApp";
import Cobrador from "./vistas/cobrador";
import Admin from "./vistas/admin";
import "./App.css";

export default function App() {
  const { socios, cobranzas, isPreloading, refreshData } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="main-layout">
      <div className={`hamburger-menu ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Menú Lateral (Overlay) */}
      <nav className={`side-nav ${menuOpen ? "active" : ""}`}>
       
        <div className="side-nav-logo-container">
          <img src="/fondo.jpg" alt="Logo App" className="side-nav-logo" />
        </div>

        <Link to="/cobrador" onClick={() => setMenuOpen(false)}>Administrador</Link>
      </nav>

      <div className="content">
        <Routes>
          <Route
            path="/"
            element={
              <Admin
                preloadedCobranzas={cobranzas}
                isPreloading={isPreloading}
              />
            }
          />

          <Route
            path="/cobrador"
            element={
              <Cobrador
                globalSocios={socios}
                globalCobranzas={cobranzas}
                isPreloading={isPreloading}
                onUpdate={refreshData}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}