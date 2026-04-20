import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./vistaLogs.css";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export default function LogsAdmin({ operador }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔐 seguridad (NO se toca)
  if (operador !== "Admin") {
    return (
      <div className="logs-no-access">
        ⛔ No tenés permisos para ver esta sección
      </div>
    );
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/logs`);
        const data = await res.json();
        setLogs(Array.isArray(data) ? data.reverse() : []);
      } catch (err) {
        console.error("Error cargando logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="logs-container">
        <p className="logs-text">Cargando logs...</p>
      </div>
    );
  }

  return (
    <div className="logs-container">

      <button className="btn-volver" onClick={() => navigate("/")}>
        ⬅ Volver
      </button>

      <button
        className="btn-delete"
        onClick={async () => {
          if (!window.confirm("¿Borrar todos los logs?")) return;
          await fetch(`${API_URL}/logs`, { method: "DELETE" });
          setLogs([]);
        }}
      >
        🗑 Borrar logs
      </button>

      <div className="logs-content">

        <h2 className="logs-title">📋 Historial de acciones</h2>

        {logs.length === 0 && (
          <p className="logs-text">No hay registros</p>
        )}

        <div className="logs-list">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`log-card log-${(log.accion || "default").toLowerCase()}`}
            >
              <div className="log-header">
                <span className="log-user">👤 {log.operador}</span>
                <span className="log-date">
                  {log.fecha
                    ? new Date(log.fecha).toLocaleString()
                    : "Sin fecha"}
                </span>
              </div>

              <div className="log-action">
                📌 {log.accion}
              </div>

              <pre className="log-detail">
                <code>
                  {JSON.stringify(log.detalle, null, 2)}
                </code>
              </pre>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}