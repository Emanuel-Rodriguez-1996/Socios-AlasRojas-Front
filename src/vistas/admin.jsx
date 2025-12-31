import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./vistAdmin.css";

const API_URL = "https://socios-alasrojas-back.onrender.com/api/cobranzas";

export default function Admin() {
  const navigate = useNavigate();
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ socio: "", mes: "", estado: "todos" });

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const mapped = data.reduce((acc, curr) => {
          if (!acc[curr.nro_socio]) acc[curr.nro_socio] = { ...curr, cobranzas: [] };
          acc[curr.nro_socio].cobranzas.push(curr);
          return acc;
        }, {});
        setSocios(Object.values(mapped));
      })
      .finally(() => setLoading(false));
  }, []);

  const sociosFiltrados = socios.map(s => ({
    ...s,
    filtradas: s.cobranzas.filter(c => {
      const m = filtros.mes === "" || c.mes === parseInt(filtros.mes);
      const e = filtros.estado === "todos" || (filtros.estado === "pagados" ? c.pago : !c.pago);
      return m && e;
    })
  })).filter(s => s.nro_socio.toString().includes(filtros.socio) && s.filtradas.length > 0);

  if (loading) return (
    <div className="vista-container loader-container">
      <div className="spinner"></div>
      <p className="status-text">Cargando registros...</p>
    </div>
  );

  return (
    <div className="admin">
      <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
      <h2 className="titulo">📋 Panel de Control</h2>
      
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Socio</label>
          <input type="text" placeholder="Nº..." onChange={e => setFiltros({...filtros, socio: e.target.value})} />
        </div>
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Mes</label>
          <select onChange={e => setFiltros({...filtros, mes: e.target.value})}>
            <option value="">Todos</option>
            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
              <option key={i} value={i+1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Estado</label>
          <select onChange={e => setFiltros({...filtros, estado: e.target.value})}>
            <option value="todos">Todos</option>
            <option value="pagados">Pagados ✅</option>
            <option value="pendientes">Pendientes ❌</option>
          </select>
        </div>
      </div>

      {sociosFiltrados.map(s => (
        <details key={s.nro_socio} className="accordion">
          <summary>Socio {s.nro_socio} - {s.nombre} <span>({s.filtradas.length})</span></summary>
          <ul>
            {s.filtradas.map(c => (
              <li key={c.id} className={c.pago ? "pago-si" : "pago-no"}>
                <strong>Mes {c.mes}/{c.anio}</strong> — {c.pago ? "✅ Pagado" : "❌ Pendiente"}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}