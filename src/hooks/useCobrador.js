import { useState, useEffect } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export function useCobrador(formData, preloadedSocios = [], preloadedCobranzas = [], isPreloading = false) {
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [despertando, setDespertando] = useState(false);
  const [registroExistente, setRegistroExistente] = useState(null);
  const [socioValido, setSocioValido] = useState(true);
  const [pagoActivo, setPagoActivo] = useState(false);
  const [tipoPago, setTipoPago] = useState("mensual");
  const [socioActual, setSocioActual] = useState(null);

  // Solo mostramos loading inicial si no hay datos y la app está pre-cargando
  const loadingInicial = isPreloading && preloadedSocios.length === 0;

  useEffect(() => {
    const verificar = () => {
      // 1. Reset de estados por defecto
      setRegistroExistente(null);
      setSocioValido(true);
      setSocioActual(null);

      if (!formData.nro_socio) return;

      // 2. Buscar socio en los datos globales
      const socio = preloadedSocios.find(
        s => s.nro_socio === parseInt(formData.nro_socio, 10)
      );

      if (!socio) {
        setSocioValido(false);
        return;
      }

      setTipoPago(socio.tipo_pago || "mensual");
      setSocioActual(socio);

      // 3. Si no hay período seleccionado y no es anual, no buscamos cobranza
      if (!formData.mes && socio.tipo_pago !== "anual") return;

      // 4. Buscar registro de cobranza en los datos globales (Lógica de Verdad Única)
      const nro = parseInt(formData.nro_socio, 10);
      const anio = parseInt(formData.anio, 10);
      let encontrado = null;

      if (socio.tipo_pago === "mensual") {
        const mesNum = parseInt(formData.mes, 10);
        encontrado = preloadedCobranzas.find(c =>
          c.nro_socio === nro && c.anio === anio && c.mes === mesNum
        );
      } 
      else if (socio.tipo_pago === "semestral") {
        const mesInicio = formData.mes === "S1" ? 1 : 7;
        const mesFin = formData.mes === "S1" ? 6 : 12;
        encontrado = preloadedCobranzas.find(c =>
          c.nro_socio === nro && c.anio === anio && c.mes >= mesInicio && c.mes <= mesFin
        );
      } 
      else if (socio.tipo_pago === "anual") {
        encontrado = preloadedCobranzas.find(c =>
          c.nro_socio === nro && c.anio === anio
        );
      }

      // 5. Aplicar resultado al estado local
      if (encontrado) {
        setRegistroExistente(encontrado);
        setPagoActivo(encontrado.pago);
      } else {
        // Por defecto, si es nuevo, sugerimos que se va a pagar (pago: true)
        setPagoActivo(true);
      }
    };

    verificar();
  }, [formData.nro_socio, formData.mes, formData.anio, preloadedSocios, preloadedCobranzas]);

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