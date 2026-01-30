/*CON EL CHECKBOX de confirmacion de pago

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../comps/loading"; 
import { useKeepAlive } from "../comps/useKeepAlive";
import { useCobrador } from "../hooks/useCobrador";
import "./vistCobrador.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Cobrador() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    nro_socio: "", 
    mes: "", 
    pago: false, 
    anio: new Date().getFullYear() 
  });

  // Extraemos toda la lógica del Custom Hook
  const { 
    loadingInicial, 
    loadingAccion, 
    setLoadingAccion, 
    despertando, 
    registroExistente, 
    socioValido, 
    pagoActivo, 
    setPagoActivo, 
    API_URL 
  } = useCobrador(formData);

  // Mantenemos el backend despierto (Render Free Tier)
  useKeepAlive(`${API_URL}/socios`);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Protección contra doble submit
    if (loadingAccion) return;

    setLoadingAccion(true);

    try {
      // Determinamos si es una actualización (PUT) o un registro nuevo (POST)
      const pagoFinal = registroExistente ? pagoActivo : formData.pago;
      const url = registroExistente 
        ? `${API_URL}/cobranzas/${registroExistente.id}` 
        : `${API_URL}/cobranzas`;

      // Fecha local Uruguay en formato YYYY-MM-DD
      const hoyUY = new Date().toLocaleDateString("sv-SE");

      const res = await fetch(url, {
        method: registroExistente ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nro_socio: parseInt(formData.nro_socio),
          mes: parseInt(formData.mes),
          pago: pagoFinal,
          monto: pagoFinal ? 300 : 0,
          fecha_pago: pagoFinal ? hoyUY : null
        }),
      });
      
      if (res.ok) {
        alert("✅ Registro procesado con éxito");
        // Limpiamos el formulario tras el éxito
        setFormData(prev => ({ 
          ...prev, 
          nro_socio: "", 
          mes: "", 
          pago: false 
        }));
      } else {
        alert("❌ Error al guardar el registro");
      }
    } catch (error) { 
      alert("❌ Error de conexión con el servidor"); 
    } finally { 
      setLoadingAccion(false); 
    }
  };

  // Pantalla de carga inicial (Solo se ve al abrir la app)
  if (loadingInicial) return <Loading mensaje="Iniciando sistema y despertando servidor..." />;

  return (
    <div className="vista-container">
      <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
      <h1 className="titulo-seccion">Registrar Cobros</h1>

      
      {despertando && (
        <div className="aviso-servidor">
          <Loading tipo="mini" mensaje="Sincronizando datos..." />
        </div>
      )}
      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">Gestión de Cobro {formData.anio}</div>

        <label>Mes
          <select 
            value={formData.mes} 
            onChange={(e) => setFormData({ ...formData, mes: e.target.value })} 
            required 
            disabled={despertando}
          >
            <option value="">Seleccione el mes...</option>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          {formData.nro_socio && !formData.mes && (
            <span className="warning-text">⚠️ Seleccione el mes</span>
          )}
        </label>

        <label>Nº de Socio
          <input 
            type="number" 
            value={formData.nro_socio} 
            className={!socioValido ? "input-error" : ""}
            onChange={(e) => setFormData({ ...formData, nro_socio: e.target.value })} 
            placeholder="Ej: 123"
            required 
            disabled={despertando} 
          />
          {!socioValido && (
            <span className="error-text">🚫 Socio inexistente</span>
          )}
          {formData.mes && !formData.nro_socio && (
            <span className="warning-text">⚠️ Ingrese Nº de socio</span>
          )}
        </label>

        <div className="seccion-operativa">
          {socioValido && formData.nro_socio && formData.mes ? (
            
            // CASO A: EL SOCIO YA TIENE UN REGISTRO EN ESE MES (MODIFICACIÓN)
            registroExistente ? (
              <div className="control-pago">
                <div className={`status-card ${pagoActivo ? "status-pagado" : "status-pendiente"}`}>
                  <div className="status-info">
                    <span className="status-label">
                      Socio {formData.nro_socio} • {MESES[formData.mes - 1]}
                    </span>
                    <div className="status-badge">
                      {pagoActivo ? "✓ REGISTRO PAGADO" : "⚠ PAGO PENDIENTE"}
                    </div>
                  </div>
                  <p className="status-pregunta">¿Desea modificar el estado actual?</p>
                </div>
                
                <div 
                  className={`switch ${pagoActivo ? "on" : "off"}`} 
                  onClick={() => !despertando && setPagoActivo(!pagoActivo)}
                >
                  <div className="handle"></div>
                  <span className="label-on">PAGO</span>
                  <span className="label-off">ANULAR</span>
                </div>
                
                <button 
                  type="submit" 
                  className="btn-update-status" 
                  disabled={
                    loadingAccion || 
                    pagoActivo === registroExistente.pago || 
                    despertando
                  }
                >
                  {loadingAccion ? <Loading tipo="mini" /> : "Confirmar Cambio"}
                </button>
              </div>
            ) : (
              
              // CASO B: REGISTRO NUEVO (POST)
              <div className="nuevo-registro">
                <label className="checkbox-moderno">
                  <input 
                    type="checkbox" 
                    checked={formData.pago} 
                    onChange={(e) => 
                      setFormData({ ...formData, pago: e.target.checked })
                    } 
                  />
                  Confirmar pago de {MESES[formData.mes - 1]}
                </label>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={loadingAccion || despertando}
                >
                  {loadingAccion ? <Loading tipo="mini" /> : "Registrar Cobro"}
                </button>
              </div>
            )
          ) : (
            // Mensaje inicial cuando los campos están vacíos
            !formData.nro_socio && !formData.mes && (
              <p className="warning-text">⚠️ Complete los datos para operar</p>
            )
          )}
        </div>
      </form>
    </div>
  );
}*/


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../comps/loading"; 
import { useKeepAlive } from "../comps/useKeepAlive";
import { useCobrador } from "../hooks/useCobrador";
import "./vistCobrador.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Cobrador() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    nro_socio: "", 
    mes: "", 
    pago: true,   // Siempre true para nuevos registros
    anio: new Date().getFullYear() 
  });

  const { 
    loadingInicial, 
    loadingAccion, 
    setLoadingAccion, 
    despertando, 
    registroExistente, 
    socioValido, 
    pagoActivo, 
    setPagoActivo, 
    API_URL 
  } = useCobrador(formData);

  useKeepAlive(`${API_URL}/socios`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingAccion) return;

    setLoadingAccion(true);

    try {
      const esUpdate = Boolean(registroExistente);
      const pagoFinal = esUpdate ? pagoActivo : true;

      const url = esUpdate
        ? `${API_URL}/cobranzas/${registroExistente.id}`
        : `${API_URL}/cobranzas`;

      // Fecha local Uruguay en formato YYYY-MM-DD
      const hoyUY = new Date().toLocaleDateString("sv-SE");

      const res = await fetch(url, {
        method: esUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nro_socio: parseInt(formData.nro_socio),
          mes: parseInt(formData.mes),
          pago: pagoFinal,
          monto: pagoFinal ? 300 : 0,
          fecha_pago: pagoFinal ? hoyUY : null
        }),
      });

      if (res.ok) {
        alert("✅ Registro procesado con éxito");
        setFormData(prev => ({ 
          ...prev, 
          nro_socio: "", 
          mes: "", 
          pago: true 
        }));
      } else {
        alert("❌ Error al guardar el registro");
      }
    } catch (error) { 
      alert("❌ Error de conexión con el servidor"); 
    } finally { 
      setLoadingAccion(false); 
    }
  };

  if (loadingInicial) {
    return <Loading mensaje="Iniciando sistema y despertando servidor..." />;
  }

  return (
    <div className="vista-container">
      <button className="btn-volver" onClick={() => navigate("/")}>
        ⬅ Volver
      </button>

      <h1 className="titulo-seccion">Registrar Cobros</h1>

      {despertando && (
        <div className="aviso-servidor">
          <Loading tipo="mini" mensaje="Sincronizando datos..." />
        </div>
      )}

      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">
          Gestión de Cobro {formData.anio}
        </div>

        <label>Mes
          <select 
            value={formData.mes} 
            onChange={(e) => 
              setFormData({ ...formData, mes: e.target.value })
            } 
            required 
            disabled={despertando}
          >
            <option value="">Seleccione el mes...</option>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          {formData.nro_socio && !formData.mes && (
            <span className="warning-text">⚠️ Seleccione el mes</span>
          )}
        </label>

        <label>Nº de Socio
          <input 
            type="number" 
            value={formData.nro_socio} 
            className={!socioValido ? "input-error" : ""}
            onChange={(e) => 
              setFormData({ ...formData, nro_socio: e.target.value })
            } 
            placeholder="Ej: 123"
            required 
            disabled={despertando} 
          />

          {!socioValido && (
            <span className="error-text">🚫 Socio inexistente</span>
          )}

          {formData.mes && !formData.nro_socio && (
            <span className="warning-text">⚠️ Ingrese Nº de socio</span>
          )}
        </label>

        <div className="seccion-operativa">
          {socioValido && formData.nro_socio && formData.mes ? (
            
            // CASO A — REGISTRO EXISTENTE (MODIFICACIÓN)
            registroExistente ? (
              <div className="control-pago">
                <div className={`status-card ${pagoActivo ? "status-pagado" : "status-pendiente"}`}>
                  <div className="status-info">
                    <span className="status-label">
                      Socio {formData.nro_socio} • {MESES[formData.mes - 1]}
                    </span>
                    <div className="status-badge">
                      {pagoActivo ? "✓ REGISTRO PAGADO" : "⚠ PAGO PENDIENTE"}
                    </div>
                  </div>
                  <p className="status-pregunta">
                    ¿Desea modificar el estado actual?
                  </p>
                </div>

                <div 
                  className={`switch ${pagoActivo ? "on" : "off"}`} 
                  onClick={() => !despertando && setPagoActivo(!pagoActivo)}
                >
                  <div className="handle"></div>
                  <span className="label-on">PAGO</span>
                  <span className="label-off">ANULAR</span>
                </div>

                <button 
                  type="submit" 
                  className="btn-update-status" 
                  disabled={
                    loadingAccion || 
                    pagoActivo === registroExistente.pago || 
                    despertando
                  }
                >
                  {loadingAccion ? <Loading tipo="mini" /> : "Confirmar Cambio"}
                </button>
              </div>
            ) : (
              // CASO B — REGISTRO NUEVO (SIEMPRE PAGADO)
              <div className="nuevo-registro">
                <p className="info-text">
                  Este cobro se registrará como <strong>PAGADO</strong> automáticamente
                </p>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={loadingAccion || despertando}
                >
                  {loadingAccion ? <Loading tipo="mini" /> : "Registrar Cobro"}
                </button>
              </div>
            )
          ) : (
            !formData.nro_socio && !formData.mes && (
              <p className="warning-text">⚠️ Complete los datos para operar</p>
            )
          )}
        </div>
      </form>
    </div>
  );
}

