import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export default function LogsAdmin({ operador }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🔐 seguridad
    if (operador !== "Admin") {
        return (
            <div style={{ padding: "20px", color: "#fff" }}>
                ⛔ No tenés permisos para ver esta sección
            </div>
        );
    }

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`${API_URL}/logs/logs`);
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
                <p style={{ color: "#fff" }}>Cargando logs...</p>
            </div>
        );
    }

    return (
        <div className="logs-container">

            {/* BOTÓN VOLVER */}
            <button className="btn-volver" onClick={() => navigate("/")}>
                ⬅ Volver
            </button>

            {/* CONTENIDO CENTRADO */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

                <h2 style={{ color: "#fff" }}>📋 Historial de acciones</h2>

                {logs.length === 0 && (
                    <p style={{ color: "#fff" }}>No hay registros</p>
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
                                    {log.fecha ? new Date(log.fecha).toLocaleString() : "Sin fecha"}
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