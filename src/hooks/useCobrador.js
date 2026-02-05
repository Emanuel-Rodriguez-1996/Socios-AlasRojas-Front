import { useState, useEffect } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export function useCobrador(formData) {
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [despertando, setDespertando] = useState(false);
  const [listaSocios, setListaSocios] = useState([]);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [socioValido, setSocioValido] = useState(true);
  const [pagoActivo, setPagoActivo] = useState(false);
  const [tipoPago, setTipoPago] = useState("mensual");
  const [socioActual, setSocioActual] = useState(null);

  // ==========================
  // Cargar socios
  // ==========================
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await fetch(`${API_URL}/socios`);
        setListaSocios(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInicial(false);
      }
    };
    fetchSocios();
  }, []);

  // ==========================
  // Verificar socio / cobranzas
  // ==========================
  useEffect(() => {
    const verificar = async () => {
      setRegistroExistente(null);
      setSocioValido(true);
      setSocioActual(null);

      if (!formData.nro_socio) return;

      const socio = listaSocios.find(
        s => s.nro_socio === parseInt(formData.nro_socio, 10)
      );

      if (!socio) {
        setSocioValido(false);
        return;
      }

      setTipoPago(socio.tipo_pago || "mensual");
      setSocioActual(socio);

      // Si no hay período seleccionado y no es anual → no buscamos nada todavía
      if (!formData.mes && socio.tipo_pago !== "anual") return;

      setDespertando(true);

      try {
        const res = await fetch(`${API_URL}/cobranzas`);
        const data = await res.json();

        const nro = parseInt(formData.nro_socio, 10);
        const anio = formData.anio;

        let encontrado = null;

        // ==========================
        // MENSUAL
        // ==========================
        if (socio.tipo_pago === "mensual") {
          const mesNum = parseInt(formData.mes, 10);

          encontrado = data.find(c =>
            c.nro_socio === nro &&
            c.anio === anio &&
            c.mes === mesNum
          );
        }

        // ==========================
        // SEMESTRAL
        // ==========================
        else if (socio.tipo_pago === "semestral") {
          let mesInicio = 0;
          let mesFin = 0;

          if (formData.mes === "S1") {
            mesInicio = 1;
            mesFin = 6;
          } else if (formData.mes === "S2") {
            mesInicio = 7;
            mesFin = 12;
          }

          encontrado = data.find(c =>
            c.nro_socio === nro &&
            c.anio === anio &&
            c.mes >= mesInicio &&
            c.mes <= mesFin
          );
        }

        // ==========================
        // ANUAL
        // ==========================
        else if (socio.tipo_pago === "anual") {
          encontrado = data.find(c =>
            c.nro_socio === nro &&
            c.anio === anio &&
            c.mes >= 1 &&
            c.mes <= 12
          );
        }

        // ==========================
        // RESULTADO
        // ==========================
        if (encontrado) {
          setRegistroExistente(encontrado);
          setPagoActivo(encontrado.pago);
        } else {
          // Nuevo registro → siempre pagado
          setPagoActivo(true);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setDespertando(false);
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
    pagoActivo,
    setPagoActivo,
    tipoPago,
    socioActual,
    API_URL
  };
}
