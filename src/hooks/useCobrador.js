import { useState, useEffect } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export function useCobrador(formData) {
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [despertando, setDespertando] = useState(false);
  const [listaSocios, setListaSocios] = useState([]);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [socioValido, setSocioValido] = useState(true);
  const [pagoActivo, setPagoActivo] = useState(false); // <--- Recuperado

  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await fetch(`${API_URL}/socios`);
        setListaSocios(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoadingInicial(false); }
    };
    fetchSocios();
  }, []);

  useEffect(() => {
    const verificar = async () => {
      setRegistroExistente(null);
      setSocioValido(true);
      if (!formData.nro_socio) return;

      const socio = listaSocios.find(s => s.nro_socio === parseInt(formData.nro_socio));
      if (!socio) { setSocioValido(false); return; }

      if (formData.mes) {
        setDespertando(true);
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
            setPagoActivo(encontrado.pago); // Sincroniza el switch con la DB
          } else {
            setPagoActivo(false);
          }
        } catch (err) { console.error(err); }
        finally { setDespertando(false); }
      }
    };
    verificar();
  }, [formData.nro_socio, formData.mes, listaSocios, formData.anio]);

  return {
    loadingInicial,
    loadingAccion,
    setLoadingAccion,
    despertando,
    registroExistente,
    socioValido,
    pagoActivo,    // Devuelto para el Switch
    setPagoActivo, // Devuelto para el Switch
    API_URL
  };
}