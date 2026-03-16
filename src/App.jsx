import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Cobrador from "./vistas/cobrador";
import Admin from "./vistas/admin";
import "./App.css";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <div className="imgTit"></div>
      <br />
      <div className="cards-container">
        <div className="card card-cobrador" onClick={() => navigate("/cobrador")}>🧾Cobrador</div>
        <div className="card card-admin" onClick={() => navigate("/admin")}>🛠Administrador</div>
      </div>
    </div>
  );
}

export default function App() {
  const [globalData, setGlobalData] = useState({ socios: [], cobranzas: [] });
  const [isPreloading, setIsPreloading] = useState(true);

  const refreshData = async () => {
    try {
      const [resSocios, resCobranzas] = await Promise.all([
        fetch(`${API_URL}/socios`),
        fetch(`${API_URL}/cobranzas`)
      ]);
      const socios = await resSocios.json();
      const cobranzas = await resCobranzas.json();

      setGlobalData({ socios, cobranzas });
      
      localStorage.setItem("cache_socios", JSON.stringify(socios));
      localStorage.setItem("cache_cobranzas", JSON.stringify(cobranzas));
    } catch (error) {
      console.error("Error de sincronización:", error);
    } finally {
      setIsPreloading(false);
    }
  };

  useEffect(() => {
    // Carga inmediata desde caché para evitar pantalla blanca
    const cSocios = localStorage.getItem("cache_socios");
    const cCobranzas = localStorage.getItem("cache_cobranzas");
    if (cSocios && cCobranzas) {
      setGlobalData({ socios: JSON.parse(cSocios), cobranzas: JSON.parse(cCobranzas) });
      setIsPreloading(false);
    }
    refreshData(); // Sincroniza con la DB en segundo plano
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/cobrador"
        element={
          <Cobrador
            globalSocios={globalData.socios}
            globalCobranzas={globalData.cobranzas}
            isPreloading={isPreloading}
            onUpdate={refreshData}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <Admin 
            preloadedCobranzas={globalData.cobranzas} 
            isPreloading={isPreloading}
          />
        }
      />
    </Routes>
  );
}