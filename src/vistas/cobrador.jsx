import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../comps/loading";
import { useCobrador } from "../hooks/useCobrador";
import "./vistCobrador.css";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SEMESTRES = [{ label: "1er Semestre", value: "S1" }, { label: "2do Semestre", value: "S2" }];

const KEYS = {
  "Tano123": "Tesorero",
  "0000": "Admin"
};

export default function Cobrador({ globalSocios, globalCobranzas, isPreloading, onUpdate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pago");
  
  // Estados para Login
  const [pass, setPass] = useState("");
  const [operador, setOperador] = useState(""); 
  const [error, setError] = useState(false);

  // Estado para Formulario de Cobro
  const [formData, setFormData] = useState({ nro_socio: "", mes: "", anio: new Date().getFullYear() });

  // Estado para Formulario de Alta
  const [datosAlta, setDatosAlta] = useState({
    nro_socio: "",
    nombre: "",
    apellido: "",
    tel: "",
    tipo_pago: "mensual"
  });

  // Estado para Formulario de Baja
  const [nroBaja, setNroBaja] = useState("");
  const {
    loadingInicial, loadingAccion, registroExistente, 
    socioValido, pagoActivo, setPagoActivo, socioActual, tipoPago, 
    handleSubmit, handleAlta, handleBaja 
  } = useCobrador(formData, setFormData, globalSocios, globalCobranzas, onUpdate, operador);

  // Lógica para mostrar quién se va a borrar (Seguridad)
  const socioABorrar = useMemo(() => {
    if (!nroBaja) return null;
    return globalSocios.find(s => s.nro_socio === parseInt(nroBaja, 10));
  }, [nroBaja, globalSocios]);

  const verificarClave = (e) => {
    e.preventDefault();
    if (KEYS[pass]) {
      setOperador(KEYS[pass]);
      setError(false);
    } else {
      setError(true);
      setPass("");
    }
  };

  const ejecutarAlta = async (e) => {
    e.preventDefault();
    const exito = await handleAlta(datosAlta);
    if (exito) {
      setDatosAlta({ nro_socio: "", nombre: "", apellido: "", tel: "", tipo_pago: "" });
      setActiveTab("pago");
    }
  };

  const ejecutarBaja = async (e) => {
    e.preventDefault();
    const exito = await handleBaja(nroBaja);
    if (exito) {
      setNroBaja("");
      setActiveTab("pago");
    }
  };

  if (loadingInicial) return <Loading mensaje="Cargando sistema..." />;

  if (!operador) {
    return (
      <div className="vista-cobrador">
        <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
        <div className="login-box">
          <h2>🔐Panel Administrador</h2><br />
          <form onSubmit={verificarClave}>
            <input 
              type="password" 
              placeholder="Ingrese clave..." 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoFocus
            />
            {error && <p className="error-text">Clave incorrecta</p>}
            <br />
            <button type="submit" className="btn-entrar">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  const etiquetaSocio = socioActual ? `${socioActual.nombre} ${socioActual.apellido}` : "—";
  const etiquetaMes = tipoPago === "semestral"
    ? (formData.mes === "S1" ? "1er Semestre" : "2do Semestre")
    : formData.mes ? MESES[parseInt(formData.mes, 10) - 1] : "Sin mes";

  return (
    <div className="vista-cobrador">
      <div className="header-simple">
        <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
        <span className="user-badge">Cobrador: <strong>{operador}</strong></span>
      </div>

      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'pago' ? 'active' : ''}`} onClick={() => setActiveTab('pago')}>Registrar Cobro</button>
        <button className={`tab-button ${activeTab === 'alta' ? 'active' : ''}`} onClick={() => setActiveTab('alta')}>Alta Socio</button>
        <button className={`tab-button ${activeTab === 'baja' ? 'active' : ''}`} onClick={() => setActiveTab('baja')}>Dar de Baja</button>
      </div>

      <div className="form-cobrador">
        
        {/* PESTAÑA: PAGO */}
        {activeTab === 'pago' && (
          <form onSubmit={handleSubmit}>
            <div className="anio-display">Registrar Pago</div>
            <label>Período
              <select value={formData.mes} onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
               required={tipoPago !== "anual"} disabled={tipoPago === "anual"}>
                <option value="">{tipoPago === "anual" ? "Pago anual" : "Seleccione..."}</option>
                {tipoPago === "semestral" && SEMESTRES.map((s, i) => <option key={i} value={s.value}>{s.label}</option>)}
                {(!tipoPago || tipoPago === "mensual") && MESES.map((m, i) => <option key={i} value={(i + 1).toString()}>{m}</option>)}
              </select>
            </label>

            <label>Nº de Socio
              <input type="number" value={formData.nro_socio} className={!socioValido ? "input-error" : ""} onChange={(e) => setFormData({ ...formData, nro_socio: e.target.value })} placeholder="Nro..." required />
              {!socioValido && <span className="error-text">🚫 No existe</span>}
            </label>

            {socioValido && formData.nro_socio && (formData.mes || tipoPago === "anual") ? (
              registroExistente ? (
                <div className="control-pago">
                  <div className={`status-card ${pagoActivo ? "status-pagado" : "status-pendiente"}`}>
                    <span className="status-label">{formData.nro_socio} - {etiquetaSocio} ({etiquetaMes})</span>
                    <div className="status-badge">{pagoActivo ? "PAGADO" : "PENDIENTE"}</div>
                  </div>
                  <div className={`switch ${pagoActivo ? "on" : "off"}`} onClick={() => setPagoActivo(!pagoActivo)}>
                    <span className="label-off">ANULAR</span><div className="handle"></div><span className="label-on">PAGO</span>
                  </div>
                  <button type="submit" className="btn-update-status" disabled={loadingAccion || pagoActivo === registroExistente.pago}>
                    {loadingAccion ? <Loading tipo="mini" /> : "Confirmar Cambio"}
                  </button>
                </div>
              ) : (
                <div className="status-card">
                  <span className="status-label">Nº{formData.nro_socio} - {etiquetaSocio} ({etiquetaMes})</span>
                  <p className="status-pregunta">¿Registrar como <strong className="status-pagado">PAGADO</strong>?</p> <br />
                  <button type="submit" className="btn-update-status" disabled={loadingAccion}>
                    {loadingAccion ? <Loading tipo="mini" /> : "Registrar"}
                  </button>
                </div>
              )
            ) : (!formData.nro_socio && !formData.mes)}
          </form>
        )}

        {/* PESTAÑA: ALTA */}
        {activeTab === 'alta' && (
          <form onSubmit={ejecutarAlta}>
            <div className="anio-display">Nuevo Socio</div>
            <label>Nº Socio
              <input type="number" value={datosAlta.nro_socio} onChange={(e)=>setDatosAlta({...datosAlta, nro_socio: e.target.value})} placeholder="Ej: 101" required />
            </label>
            <label>Nombre
              <input type="text" value={datosAlta.nombre} onChange={(e)=>setDatosAlta({...datosAlta, nombre: e.target.value})} placeholder="Nombre..." required />
            </label>
            <label>Apellido
              <input type="text" value={datosAlta.apellido} onChange={(e)=>setDatosAlta({...datosAlta, apellido: e.target.value})} placeholder="Apellido..." required />
            </label>
            <label>Teléfono
              <input type="text" value={datosAlta.tel} onChange={(e)=>setDatosAlta({...datosAlta, tel: e.target.value})} placeholder="Tel/Cel..." />
            </label>
            <label>Categoria
              <select value={datosAlta.tipo_pago} onChange={(e)=>setDatosAlta({...datosAlta, tipo_pago: e.target.value})}>
                <option value="mensual">Mensual</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </label>
            <button type="submit" className="btn-save" disabled={loadingAccion} style={{marginTop: '10px'}}>
              {loadingAccion ? <Loading tipo="mini" /> : "Guardar Socio"}
            </button>
          </form>
        )}

        {/* PESTAÑA: BAJA */}
        {activeTab === 'baja' && (
          <form onSubmit={ejecutarBaja}>
            <div className="anio-display">Dar de Baja</div>
            <label>Nº de Socio
              <input type="number" value={nroBaja} onChange={(e) => setNroBaja(e.target.value)} placeholder="Nro a eliminar..." required />
            </label>
            
            {socioABorrar && (
              <div className="status-card status-pendiente">
                <span className="status-label">Se eliminará a:</span>
                <div className="status-badge">{socioABorrar.nombre} {socioABorrar.apellido}</div>
              </div>
            )}

            <div className="aviso-baja">
              <p>⚠️ Atención: Se borrará el socio y todas sus cobranzas registradas.</p>
            </div>
            <button type="submit" className="btn-update-status" disabled={loadingAccion || !socioABorrar} style={{backgroundColor: '#e74c3c', marginTop: '10px'}}>
              {loadingAccion ? <Loading tipo="mini" /> : "Confirmar Baja Definitiva"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}