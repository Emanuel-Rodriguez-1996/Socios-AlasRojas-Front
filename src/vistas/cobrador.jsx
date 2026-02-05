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

const SEMESTRES = [
  { label: "1er Semestre", value: "S1" },
  { label: "2do Semestre", value: "S2" }
];

export default function Cobrador() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nro_socio: "",
    mes: "",
    pago: true,
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
    socioActual,
    tipoPago,
    API_URL
  } = useCobrador(formData);

  // Mantiene despierto el backend
  useKeepAlive(`${API_URL}/socios`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingAccion || despertando) return;

    setLoadingAccion(true);

    try {
      const esUpdate = Boolean(registroExistente);
      const pagoFinal = esUpdate ? pagoActivo : true;

      const url = esUpdate
        ? `${API_URL}/cobranzas/${registroExistente.id}`
        : `${API_URL}/cobranzas`;

      // Fecha local Uruguay en formato YYYY-MM-DD
      const hoyUY = new Date().toLocaleDateString("sv-SE");

      const payload = {
        nro_socio: parseInt(formData.nro_socio, 10),
        mes: formData.mes || null, // "1".."12" | "S1" | "S2" | null (anual)
        anio: parseInt(formData.anio, 10),
        pago: pagoFinal,
        monto: pagoFinal ? 300 : 0,
        fecha_registro: pagoFinal ? hoyUY : null
      };

      const res = await fetch(url, {
        method: esUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar el registro");
      }

      alert("✅ Registro procesado con éxito");
      setFormData(prev => ({
        ...prev,
        nro_socio: "",
        mes: "",
        pago: true
      }));
    } catch (error) {
      alert(`❌ ${error.message || "Error de conexión con el servidor"}`);
    } finally {
      setLoadingAccion(false);
    }
  };

  if (loadingInicial) {
    return <Loading mensaje="Iniciando sistema y verificando servidor..." />;
  }

  // Texto superior dinámico
  const etiquetaSocio = socioActual
    ? `${socioActual.nombre} ${socioActual.apellido}`
    : "—";
  
  const etiquetaMes =
    tipoPago === "semestral"
      ? (formData.mes === "S1"
          ? "1er Semestre"
          : formData.mes === "S2"
            ? "2do Semestre"
            : "Sin período")
      : formData.mes
        ? MESES[parseInt(formData.mes, 10) - 1]
        : "Sin mes";

  const etiquetaTipo = (tipoPago || "mensual").toUpperCase();

  return (
    <div className="vista-container">
      <button
        className="btn-volver"
        onClick={() => navigate("/")}
        disabled={despertando}
      >
        ⬅ Volver
      </button>
      {despertando && (
        <div className="aviso-servidor">
          <Loading tipo="mini" mensaje="Sincronizando datos..." />
        </div>
      )}

      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">
          Gestión de Cobro {formData.anio}
        </div>

        {/* SELECT MES / PERÍODO */}
        <label>
          Período
          <select
            value={formData.mes}
            onChange={(e) =>
              setFormData({ ...formData, mes: e.target.value })
            }
            required={tipoPago !== "anual"}
            disabled={despertando || tipoPago === "anual"}
          >
            <option value="">
              {tipoPago === "anual"
                ? "Pago anual (no requiere período)"
                : "Seleccione el período..."}
            </option>

            {/* SEMESTRAL */}
            {tipoPago === "semestral" &&
              SEMESTRES.map((s, i) => (
                <option key={i} value={s.value}>
                  {s.label}
                </option>
              ))}

            {/* MENSUAL */}
            {(!tipoPago || tipoPago === "mensual") &&
              MESES.map((m, i) => (
                <option key={i} value={(i + 1).toString()}>
                  {m}
                </option>
              ))}
          </select>

          {formData.nro_socio && !formData.mes && tipoPago !== "anual" && (
            <span className="warning-text">
              ⚠️ Seleccione el período
            </span>
          )}
        </label>

        {/* INPUT SOCIO */}
        <label>
          Nº de Socio
          <input
            type="number"
            value={formData.nro_socio}
            className={!socioValido ? "input-error" : ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                nro_socio: e.target.value
              })
            }
            placeholder="Ej: 123"
            required
            disabled={despertando}
          />

          {!socioValido && (
            <span className="error-text">
              🚫 Socio inexistente
            </span>
          )}

          {formData.mes && !formData.nro_socio && (
            <span className="warning-text">
              ⚠️ Ingrese Nº de socio
            </span>
          )}
        </label>

        
          {socioValido &&
          formData.nro_socio &&
          (formData.mes || tipoPago === "anual") ? (

            // CASO A — REGISTRO EXISTENTE
            registroExistente ? (
              <div className="control-pago">
                <div
                  className={`status-card ${
                    pagoActivo
                      ? "status-pagado"
                      : "status-pendiente"
                  }`}
                >
                  <div className="status-info">
                    <span className="status-label">
                      Socio {formData.nro_socio} /{" "}
                      {etiquetaSocio} /{" "}
                      {etiquetaMes}
                    </span>

                    <div className="status-badge">
                      {pagoActivo
                        ? "✓ REGISTRO PAGADO"
                        : "⚠ PAGO PENDIENTE"}
                    </div>
                  </div>

                  <p className="status-pregunta">
                    ¿Desea modificar el estado actual?
                  </p>
                </div>

                <div
                  className={`switch ${pagoActivo ? "on" : "off"}`}
                  onClick={() =>
                    !despertando &&
                    setPagoActivo(prev => !prev)
                  }
                >
                  <span className="label-off">ANULAR</span>

                  <div className="handle"></div>

                  <span className="label-on">PAGO</span>
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
                  {loadingAccion
                    ? <Loading tipo="mini" />
                    : "Confirmar Cambio"}
                </button>
              </div>
            ) : (
              // CASO B — REGISTRO NUEVO
              <div className="status-card">
                <span className="status-label">
                  Socio {formData.nro_socio} /{" "}
                  {etiquetaSocio} /{" "}
                  {etiquetaMes}
                  <div className="status-badge">
                    Tipo {etiquetaTipo}
                  </div>
                </span>

                <p className="status-pregunta">
                  ¿Registrar cobro como{" "}
                  <strong className="status-pagado">
                    ✓ PAGADO
                  </strong>
                  ?
                </p>
                <br />
                <button
                  type="submit"
                  className="btn-update-status"
                  disabled={loadingAccion || despertando}
                >
                  Registrar Cobro
                </button>
              </div>
            )
          ) : (
            !formData.nro_socio &&
            !formData.mes && (
              <p className="warning-text">
                ⚠️ Complete los datos para operar
              </p>
            )
          )}
        
      </form>
    </div>
  );
}
