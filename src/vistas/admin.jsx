import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./vistAdmin.css";

function Admin() {
  const navigate = useNavigate();
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullDataLoaded, setFullDataLoaded] = useState(false);

  const [filtroSocio, setFiltroSocio] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const procesarDatos = (data) => {
    const sociosMap = {};
    data.forEach((row) => {
      if (!sociosMap[row.nro_socio]) {
        sociosMap[row.nro_socio] = {
          nro_socio: row.nro_socio,
          nombre: row.nombre,
          cobranzas: [],
        };
      }
      sociosMap[row.nro_socio].cobranzas.push({
        id: row.id,
        mes: row.mes,
        anio: row.anio,
        pago: row.pago,
        fecha_pago: row.fecha_pago,
      });
    });
    return Object.values(sociosMap);
  };

  // 1. CARGA INICIAL (20 registros)
  useEffect(() => {
    fetch("https://socios-alasrojas-back.onrender.com/api/cobranzas?limit=20")
      .then((res) => res.json())
      .then((data) => {
        setSocios(procesarDatos(data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error en carga inicial:", err);
        setLoading(false);
      });
  }, []);

  // 2. CARGA COMPLETA AL FILTRAR
  useEffect(() => {
    const hayFiltrosActivos = filtroSocio !== "" || filtroMes !== "" || filtroEstado !== "todos";
    if (hayFiltrosActivos && !fullDataLoaded) {
      fetch("https://socios-alasrojas-back.onrender.com/api/cobranzas")
        .then((res) => res.json())
        .then((data) => {
          setSocios(procesarDatos(data));
          setFullDataLoaded(true);
        })
        .catch((err) => console.error("Error en carga completa:", err));
    }
  }, [filtroSocio, filtroMes, filtroEstado, fullDataLoaded]);

  const sociosFiltrados = socios.map(socio => {
    const cobranzasFiltradas = socio.cobranzas.filter(c => {
      const coincideMes = filtroMes === "" || c.mes === parseInt(filtroMes);
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pagados" && c.pago) ||
        (filtroEstado === "pendientes" && !c.pago);
      return coincideMes && coincideEstado;
    });
    return { ...socio, cobranzasFiltradas };
  }).filter(socio => {
    const coincideNro = filtroSocio === "" || socio.nro_socio.toString().includes(filtroSocio);
    return coincideNro && socio.cobranzasFiltradas.length > 0;
  });

  if (loading) {
    return (
      <div className="admin">
        <div className="loading">
          <span className="spinner-reloj">⌛</span>
          <p style={{ color: "white" }}>Cargando Registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <button className="btn-volver" onClick={() => navigate("/")}>
        ⬅ Volver al Inicio
      </button>

      <h2 className="titulo">📋 Registros de Socios</h2>

      {!fullDataLoaded && (
        <p style={{ color: "#aaa", fontSize: "0.8rem", textAlign: "center" }}>
          Mostrando vista previa (últimos 20 registros). Use los filtros para ver todo.
        </p>
      )}
      <br />
      <div className="filtros-container">
        {/* Grupo 1: Socio */}
        <div className="filtro-grupo">
          <label className="filtro-label">Buscar por Socio</label>
          <input
            type="text"
            placeholder="Buscar Nro Socio..."
            value={filtroSocio}
            onChange={(e) => setFiltroSocio(e.target.value)}
          />
        </div>

        {/* Grupo 2: Mes */}
        <div className="filtro-grupo">
          <label className="filtro-label">Buscar por mes</label>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="">Todos los Meses</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>

        {/* Grupo 3: Estado */}
        <div className="filtro-grupo">
          <label className="filtro-label">Buscar por pagos/pendientes</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los Registros</option>
            <option value="pagados">Solo Pagados ✅</option>
            <option value="pendientes">Solo Pendientes ❌</option>
          </select>
        </div>
      </div>

      {sociosFiltrados.length === 0 ? (
        <p style={{ color: "white", textAlign: "center", marginTop: "20px" }}>No se encontraron resultados.</p>
      ) : (
        sociosFiltrados.map((socio) => (
          <details key={socio.nro_socio} className="accordion">
            <summary>
              Socio {socio.nro_socio} - {socio.nombre}
              <span> ({socio.cobranzasFiltradas.length} registros)</span>
            </summary>
            <ul>
              {socio.cobranzasFiltradas.map((c) => (
                <li key={c.id} className={c.pago ? "pago-si" : "pago-no"}>
                  <strong>{c.mes}/{c.anio}</strong> — {c.pago ? "✅ Pagó" : "❌ Pendiente"}
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </div>
  );
}

export default Admin;