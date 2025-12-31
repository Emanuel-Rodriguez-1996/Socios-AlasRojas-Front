import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./vistCobrador.css";

// Configuración fuera del componente para evitar re-renderizados
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export default function Cobrador() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nro_socio: "", mes: "", pago: false, anio: new Date().getFullYear() });
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [listaSocios, setListaSocios] = useState([]);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [pagoActivo, setPagoActivo] = useState(false);
  const [socioValido, setSocioValido] = useState(true);

  useEffect(() => {
    const inicializar = async () => {
      try {
        const [resSocios] = await Promise.all([
          fetch(`${API_URL}/socios`),
          fetch(`${API_URL}/cobranzas`) // Despertar backend
        ]);
        setListaSocios(await resSocios.json());
      } catch (err) { console.error("Error:", err); }
      finally { setLoadingInicial(false); }
    };
    inicializar();
  }, []);

  useEffect(() => {
    const verificar = async () => {
      setRegistroExistente(null);
      setSocioValido(true);
      if (!formData.nro_socio) return;

      const socio = listaSocios.find(s => s.nro_socio === parseInt(formData.nro_socio));
      if (!socio) { setSocioValido(false); return; }

      if (formData.mes) {
        try {
          const res = await fetch(`${API_URL}/cobranzas`);
          const data = await res.json();
          const encontrado = data.find(c => 
            c.nro_socio === parseInt(formData.nro_socio) && 
            c.mes === parseInt(formData.mes) && 
            c.anio === formData.anio
          );
          if (encontrado) {
            setRegistroExistente(encontrado);
            setPagoActivo(encontrado.pago);
          } else { setPagoActivo(false); }
        } catch (err) { console.error(err); }
      }
    };
    verificar();
  }, [formData.nro_socio, formData.mes, listaSocios, formData.anio]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAccion(true);
    try {
      const pagoFinal = registroExistente ? pagoActivo : formData.pago;
      const datosAEnviar = {
        ...formData,
        nro_socio: parseInt(formData.nro_socio),
        mes: parseInt(formData.mes),
        pago: pagoFinal,
        monto: 300,
        fecha_pago: pagoFinal ? new Date().toISOString().split('T')[0] : null
      };

      const url = registroExistente ? `${API_URL}/cobranzas/${registroExistente.id}` : `${API_URL}/cobranzas`;
      const response = await fetch(url, {
        method: registroExistente ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosAEnviar),
      });

      if (response.ok) {
        alert("✅ Éxito");
        setFormData({ ...formData, nro_socio: "", mes: "", pago: false });
      }
    } catch (error) { alert("❌ Error"); }
    finally { setLoadingAccion(false); }
  };

  if (loadingInicial) return (
    <div className="vista-container loader-container">
      <div className="spinner"></div>
      <p className="status-text">Iniciando sistema...</p>
    </div>
  );

  return (
    <div className="vista-container">
      <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver</button>
      <h1 className="titulo">Registrar Cobros</h1>

      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">Gestión de Cobro {formData.anio}</div>

        <label>Mes
          <select value={formData.mes} onChange={(e) => setFormData({ ...formData, mes: e.target.value })} required>
            <option value="">Seleccione...</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          {formData.nro_socio && !formData.mes && <span className="warning-text">⚠️ Seleccione el mes</span>}
        </label>

        <label>Nº de Socio
          <input type="number" value={formData.nro_socio} className={!socioValido ? "input-error" : ""}
            onChange={(e) => setFormData({ ...formData, nro_socio: e.target.value })} required />
          {!socioValido && <span className="error-text">🚫 Socio inexistente</span>}
          {formData.mes && !formData.nro_socio && <span className="warning-text">⚠️ Ingrese Nº de socio</span>}
        </label>

        {socioValido && formData.nro_socio && formData.mes ? (
          registroExistente ? (
            <div className="control-pago">
              <p>Socio {formData.nro_socio} - {MESES[formData.mes - 1]}<br/><strong>{pagoActivo ? "PAGADO" : "PENDIENTE"}</strong></p>
              <p>¿Quieres modificar el estado?</p>
              <div className={`switch ${pagoActivo ? "on" : "off"}`} onClick={() => setPagoActivo(!pagoActivo)}>
                <div className="handle"></div>
                <span className="label-on">PAGO</span><span className="label-off">ANULAR</span>
              </div>
              <button type="submit" className="btn-update-status" disabled={loadingAccion || pagoActivo === registroExistente.pago}>
                {loadingAccion ? "..." : "Confirmar Cambio"}
              </button>
            </div>
          ) : (
            <div className="nuevo-registro">
              <label className="checkbox-moderno">
                <input type="checkbox" checked={formData.pago} onChange={(e) => setFormData({ ...formData, pago: e.target.checked })} />
                Confirmar pago de {MESES[formData.mes - 1]}
              </label>
              <button type="submit" className="btn-save" disabled={loadingAccion}>Registrar</button>
            </div>
          )
        ) : (!formData.nro_socio && !formData.mes && <p className="warning-text">⚠️ Complete los datos para operar</p>)}
      </form>
    </div>
  );
}