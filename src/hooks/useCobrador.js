import { useState, useEffect } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export function useCobrador(formData, setFormData, preloadedSocios = [], preloadedCobranzas = [], onUpdate, nombreOperador) {
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [socioValido, setSocioValido] = useState(true);
  const [pagoActivo, setPagoActivo] = useState(false);
  const [tipoPago, setTipoPago] = useState("mensual");
  const [socioActual, setSocioActual] = useState(null);

  const loadingInicial = (preloadedSocios.length === 0 || preloadedCobranzas.length === 0);

  // --- LÓGICA DE VERIFICACIÓN PARA COBROS ---
  useEffect(() => {
    const verificar = () => {
      setRegistroExistente(null);
      setSocioValido(true);
      setSocioActual(null);

      if (!formData.nro_socio) return;

      const socio = preloadedSocios.find(s => s.nro_socio === parseInt(formData.nro_socio, 10));
      if (!socio) {
        setSocioValido(false);
        return;
      }

      setTipoPago(socio.tipo_pago || "mensual");
      setSocioActual(socio);

      if (!formData.mes && socio.tipo_pago !== "anual") return;

      const nro = parseInt(formData.nro_socio, 10);
      const anio = parseInt(formData.anio, 10);
      let encontrado = null;

      if (socio.tipo_pago === "mensual") {
        encontrado = preloadedCobranzas.find(c => c.nro_socio === nro && c.anio === anio && c.mes === parseInt(formData.mes));
      } else if (socio.tipo_pago === "semestral") {
        const mesInicio = formData.mes === "S1" ? 1 : 7;
        const mesFin = formData.mes === "S1" ? 6 : 12;
        encontrado = preloadedCobranzas.find(c => c.nro_socio === nro && c.anio === anio && c.mes >= mesInicio && c.mes <= mesFin);
      } else if (socio.tipo_pago === "anual") {
        encontrado = preloadedCobranzas.find(c => c.nro_socio === nro && c.anio === anio);
      }

      if (encontrado) {
        setRegistroExistente(encontrado);
        setPagoActivo(encontrado.pago);
      } else {
        setPagoActivo(true);
      }
    };
    verificar();
  }, [formData.nro_socio, formData.mes, formData.anio, preloadedSocios, preloadedCobranzas]);

  // --- 1. GESTIÓN DE PAGOS (SUBMIT ACTUAL) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingAccion) return;
    setLoadingAccion(true);

    try {
      const esUpdate = Boolean(registroExistente);
      const url = esUpdate ? `${API_URL}/cobranzas/${registroExistente.id}` : `${API_URL}/cobranzas`;
      const montoFinal = pagoActivo ? 180 : 0;

      const payload = {
        nro_socio: parseInt(formData.nro_socio, 10),
        mes: tipoPago === "anual" ? null : (tipoPago === "semestral" ? (formData.mes === "S1" ? 1 : 7) : parseInt(formData.mes)),
        anio: parseInt(formData.anio, 10),
        pago: pagoActivo,
        monto: montoFinal,
        cobrador_id: nombreOperador || "Desconocido",
        fecha_registro: pagoActivo ? new Date().toLocaleDateString("sv-SE") : null
      };

      const res = await fetch(url, {
        method: esUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error en la base de datos");

      alert("✅ ¡Operación exitosa!");
      setFormData(prev => ({ ...prev, nro_socio: "", mes: "" }));
      if (onUpdate) await onUpdate();

    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoadingAccion(false);
    }
  };

  // --- 2. GESTIÓN DE ALTA DE SOCIO ---
  const handleAlta = async (datosSocio) => {
    setLoadingAccion(true);
    try {
      const res = await fetch(`${API_URL}/socios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosSocio)
      });

      if (!res.ok) throw new Error("No se pudo registrar al socio");

      alert("✅ Socio registrado con éxito");
      if (onUpdate) await onUpdate();
      return true; // Para limpiar el form en el componente
    } catch (error) {
      alert("❌ Error: " + error.message);
      return false;
    } finally {
      setLoadingAccion(false);
    }
  };

  // --- 3. GESTIÓN DE BAJA DE SOCIO ---
  const handleBaja = async (nroSocio) => {
    if (!window.confirm(`¿Estás seguro de dar de baja al socio Nº ${nroSocio}?`)) return;
    
    setLoadingAccion(true);
    try {
      const res = await fetch(`${API_URL}/socios/${nroSocio}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al procesar la baja");

      alert("✅ Socio dado de baja correctamente");
      if (onUpdate) await onUpdate();
      return true;
    } catch (error) {
      alert("❌ Error: " + error.message);
      return false;
    } finally {
      setLoadingAccion(false);
    }
  };

  return {
    loadingInicial, loadingAccion, registroExistente, 
    socioValido, pagoActivo, setPagoActivo, socioActual, tipoPago, 
    handleSubmit, handleAlta, handleBaja 
  };
}