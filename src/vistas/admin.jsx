import { useNavigate } from "react-router-dom";
import Loading from "../comps/loading";
import { useAdmin } from "../hooks/useAdmin";
import "./vistAdmin.css";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function Admin({ preloadedCobranzas, isPreloading }) {
  const navigate = useNavigate();
  
  // Toda la lógica de filtrado y procesamiento reside en useAdmin
  const { loading, filtros, setFiltros, sociosFiltrados } = useAdmin(preloadedCobranzas, isPreloading);

  // Cálculo de recaudación basado en lo que el hook devuelve ya filtrado
  const granTotal = sociosFiltrados.reduce((acc, socio) => {
    const pagadoSocio = socio.filtradas
      .filter(c => c.pago)
      .reduce((sum, c) => sum + (c.monto || 0), 0);
    return acc + pagadoSocio;
  }, 0);

  if (loading && sociosFiltrados.length === 0) {
    return <Loading mensaje="Sincronizando Datos..." />;
  }

  return (
    <>
    <img src="public/Titulo.png" alt="" className="imgTitulo"/>
    <div className="admin">
      
      {sociosFiltrados.length > 0 && (
        <h3 className="titulo-seccion">
          Recaudación total por filtros: 
          <span> ${granTotal.toLocaleString('es-AR')}</span>
        </h3>
      )}

      <div className="filtros-container">
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Nº Socio</label>
          <input 
            type="text" 
            placeholder="Nº..." 
            value={filtros.socio}
            onChange={e => setFiltros({...filtros, socio: e.target.value})} 
          />
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Nombre</label>
          <input 
            type="text" 
            placeholder="Nombre..." 
            value={filtros.nombre}
            onChange={e => setFiltros({...filtros, nombre: e.target.value})} 
          />
        </div>
        
        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Mes</label>
          <select value={filtros.mes} onChange={e => setFiltros({...filtros, mes: e.target.value})}>
            <option value="">Todos</option>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Filtrar por Estado</label>
          <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}>
            <option value="todos">Todos</option>
            <option value="pagados">Pagados ✅</option>
            <option value="pendientes">Pendientes ❌</option>
          </select>
        </div>
      </div>

      <div className="listado-socios">
        {sociosFiltrados.length > 0 ? (
          sociosFiltrados.map(s => {
            const totalSocio = s.filtradas.filter(c => c.pago).reduce((sum, c) => sum + (c.monto || 0), 0);
            return (
              <details key={s.nro_socio} className="accordion">
                <summary>
                  <div className="summary-content">
                    <span>Socio Nº{s.nro_socio} - {s.nombre} {s.apellido}</span>
                    <div className="summary-badges">
                      <span className="badge">({s.filtradas.length})</span>
                      {totalSocio > 0 && <span className="total-socio-tag">${totalSocio.toLocaleString('es-AR')}</span>}
                    </div>
                  </div>
                </summary>
                <ul>
                  {s.filtradas.map(c => (
                    <li key={c.id} className={c.pago ? "pago-si" : "pago-no"}>
                      <strong>Mes {c.mes}/{c.anio}</strong> — {c.pago ? `✅ Pagado ($${c.monto})` : "❌ Pendiente"}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })
        ) : (
          <p className="no-results">No se encontraron registros.</p>
        )}
      </div>
    </div>
    </>
  );
}