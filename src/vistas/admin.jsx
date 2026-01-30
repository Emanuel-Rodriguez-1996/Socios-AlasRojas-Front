import { useNavigate } from "react-router-dom";
import Loading from "../comps/loading";
import { useKeepAlive } from "../comps/useKeepAlive";
import { useAdmin } from "../hooks/useAdmin"; // Importamos el nuevo hook
import "./vistAdmin.css";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function Admin() {
  const navigate = useNavigate();
  const { loading, filtros, setFiltros, sociosFiltrados, API_URL } = useAdmin();

  // Mantenemos el backend activo
  useKeepAlive(API_URL);

  if (loading) return <Loading mensaje="Cargando registros de cobranza..." />;

  return (
    <div className="admin">
      <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
      <h2 className="titulo-seccion">Registros</h2>
      
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Socio</label>
          <input 
            type="text" 
            placeholder="Nº..." 
            value={filtros.socio}
            onChange={e => setFiltros({...filtros, socio: e.target.value})} 
          />
        </div>
        
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Mes</label>
          <select 
            value={filtros.mes}
            onChange={e => setFiltros({...filtros, mes: e.target.value})}
          >
            <option value="">Todos</option>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Estado</label>
          <select 
            value={filtros.estado}
            onChange={e => setFiltros({...filtros, estado: e.target.value})}
          >
            <option value="todos">Todos</option>
            <option value="pagados">Pagados ✅</option>
            <option value="pendientes">Pendientes ❌</option>
          </select>
        </div>
      </div>

      <div className="listado-socios">
        {sociosFiltrados.length > 0 ? (
          sociosFiltrados.map(s => (
            <details key={s.nro_socio} className="accordion">
              <summary>
                Socio {s.nro_socio} - {s.nombre} 
                <span className="badge">({s.filtradas.length})</span>
              </summary>
              <ul>
                {s.filtradas.map(c => (
                  <li key={c.id} className={c.pago ? "pago-si" : "pago-no"}>
                    <strong>Mes {c.mes}/{c.anio}</strong> — {c.pago ? "✅ Pagado" : "❌ Pendiente"}
                  </li>
                ))}
              </ul>
            </details>
          ))
        ) : (
          <p className="no-results">No se encontraron registros con esos filtros.</p>
        )}
      </div>
    </div>
  );
}