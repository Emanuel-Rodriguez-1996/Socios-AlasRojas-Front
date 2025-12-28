import { useState, useEffect } from "react";
import "./vistCobrador.css"; 

export default function Cobrador() {
  const [formData, setFormData] = useState({
    nro_socio: "",
    mes: "",
    pago: false,
    anio: new Date().getFullYear(),
  });

  const [loading, setLoading] = useState(false);
  const [registroExistente, setRegistroExistente] = useState(null);

  useEffect(() => {
    const verificarEstado = async () => {
      if (formData.nro_socio && formData.mes) {
        try {
          const res = await fetch(`https://socios-alasrojas-back.onrender.com/api/cobranzas`);
          const data = await res.json();
          
          const encontrado = data.find(c => 
            c.nro_socio === parseInt(formData.nro_socio) && 
            c.mes === parseInt(formData.mes) && 
            c.anio === formData.anio
          );

          setRegistroExistente(encontrado || null);
          
          if (encontrado) {
            setFormData(prev => ({ ...prev, pago: encontrado.pago }));
          }
        } catch (err) {
          console.error("Error al verificar cobranza:", err);
        }
      }
    };
    verificarEstado();
  }, [formData.nro_socio, formData.mes, formData.anio]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- 1. VALIDACIÓN: ¿EL SOCIO EXISTE? ---
      const resSocio = await fetch(`https://socios-alasrojas-back.onrender.com/api/socios`);
      const socios = await resSocio.json();
      const existeSocio = socios.some(s => s.nro_socio === parseInt(formData.nro_socio));

      if (!existeSocio) {
        alert(`❌ Error: El número de socio ${formData.nro_socio} no existe en el sistema.`);
        setLoading(false);
        return;
      }

      // --- 2. VALIDACIONES DE NEGOCIO (COBRANZAS) ---
      if (registroExistente) {
        // Bloqueo si ya está pago
        if (registroExistente.pago) {
          alert("Este socio ya tiene este mes pago.");
          setLoading(false);
          return;
        }
        
        // RESTRICCIÓN CLAVE: Si existe pendiente, OBLIGATORIO marcar pago para actualizar
        if (!registroExistente.pago && !formData.pago) {
          alert(`Ya existe un registro pendiente para el socio ${formData.nro_socio} en el mes Nro ${formData.mes}. Para actualizarlo, debe confirmar el pago.`);
          setLoading(false);
          return;
        }
      }

      // --- 3. PROCESO DE ENVÍO ---
      const datosAEnviar = {
        nro_socio: parseInt(formData.nro_socio),
        mes: parseInt(formData.mes),
        anio: formData.anio,
        pago: formData.pago,
        fecha_pago: formData.pago ? new Date().toISOString().split('T')[0] : null
      };

      const metodo = registroExistente ? "PUT" : "POST";
      const url = registroExistente 
        ? `https://socios-alasrojas-back.onrender.com/api/cobranzas/${registroExistente.id}`
        : "https://socios-alasrojas-back.onrender.com/api/cobranzas";

      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosAEnviar),
      });

      if (response.ok) {
        alert(registroExistente ? "✅ Pago confirmado exitosamente" : "✅ Nuevo registro creado");
        setFormData({ ...formData, nro_socio: "", mes: "", pago: false });
        setRegistroExistente(null);
      } else {
        alert("❌ Error en el servidor: No se pudo procesar la solicitud.");
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vista-container">
      <h1 className="titulo">Cobrar Mensualidad</h1>

      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">Año: {formData.anio}</div>

        <label>
          Mes a registrar
          <select name="mes" value={formData.mes} onChange={handleChange} required>
            <option value="">Seleccione mes</option>
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
        </label>

        <label>
          Nro de socio
          <input type="number" name="nro_socio" value={formData.nro_socio} onChange={handleChange} required />
        </label>

        {registroExistente && (
          <div className={`mensaje-estado ${registroExistente.pago ? 'pago' : 'pendiente'}`}>
            {registroExistente.pago 
              ? "✅ El socio ya pagó este mes." 
              : "⚠️ Pago pendiente encontrado. Marque 'Confirmar' para actualizar."}
          </div>
        )}

        <label className="checkbox">
          <input
            type="checkbox"
            name="pago"
            checked={formData.pago}
            onChange={handleChange}
            disabled={registroExistente?.pago}
          />
          ¿Confirmar pago ahora?
        </label>

        <button type="submit" disabled={loading || registroExistente?.pago}>
          {loading ? "Verificando..." : registroExistente ? "Confirmar Pago" : "Guardar Nuevo Registro"}
        </button>
      </form>
    </div>
  );
}