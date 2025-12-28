import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./vistCobrador.css"; 

export default function Cobrador() {
  const navigate = useNavigate();
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
          console.error("Error al verificar:", err);
        }
      }
    };
    verificarEstado();
  }, [formData.nro_socio, formData.mes, formData.anio]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resSocio = await fetch(`https://socios-alasrojas-back.onrender.com/api/socios`);
      const socios = await resSocio.json();
      if (!socios.some(s => s.nro_socio === parseInt(formData.nro_socio))) {
        alert("❌ El socio no existe.");
        setLoading(false); return;
      }

      if (registroExistente?.pago) {
        alert("Este mes ya está pago.");
        setLoading(false); return;
      }

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
        alert("✅ Operación exitosa");
        setFormData({ ...formData, nro_socio: "", mes: "", pago: false });
        setRegistroExistente(null);
      }
    } catch (error) {
      alert("❌ Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vista-container">
      <button className="btn-volver" onClick={() => navigate("/")}>⬅ Volver al Inicio</button>
      <h1 className="titulo">Cobrar Mensualidad</h1>
      <form className="form-cobrador" onSubmit={handleSubmit}>
        <div className="anio-display">Año: {formData.anio}</div>
        <label>Mes a registrar
          <select name="mes" value={formData.mes} onChange={handleChange} required>
            <option value="">Seleccione mes</option>
            <option value="1">Enero</option><option value="2">Febrero</option>
            <option value="3">Marzo</option><option value="4">Abril</option>
            <option value="5">Mayo</option><option value="6">Junio</option>
            <option value="7">Julio</option><option value="8">Agosto</option>
            <option value="9">Septiembre</option><option value="10">Octubre</option>
            <option value="11">Noviembre</option><option value="12">Diciembre</option>
          </select>
        </label>
        <label>Nro de socio
          <input type="number" name="nro_socio" value={formData.nro_socio} onChange={handleChange} required />
        </label>
        {registroExistente && (
          <div className={`mensaje-estado ${registroExistente.pago ? 'pago' : 'pendiente'}`}>
            {registroExistente.pago ? "✅ Ya pagó." : "⚠️ Pendiente. Marque confirmar."}
          </div>
        )}
        <label className="checkbox">
          <input type="checkbox" name="pago" checked={formData.pago} onChange={handleChange} disabled={registroExistente?.pago} />
          ¿Confirmar pago ahora?
        </label>
        <button type="submit" disabled={loading || registroExistente?.pago}>
          {loading ? "Verificando..." : registroExistente ? "Confirmar Pago" : "Guardar Registro"}
        </button>
      </form>
    </div>
  );
}