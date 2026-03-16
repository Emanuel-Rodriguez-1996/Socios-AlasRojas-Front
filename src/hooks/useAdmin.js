import { useState, useMemo } from "react";

export function useAdmin(preloadedCobranzas = [], isPreloading = false) {
  const [filtros, setFiltros] = useState({ 
    socio: "", 
    mes: "", 
    estado: "todos", 
    nombre: "" 
  });

  const API_URL = "https://socios-alasrojas-back.onrender.com/api/cobranzas";

  // El loading solo es true si está pre-cargando Y no tenemos nada de datos aún
  const loading = isPreloading && preloadedCobranzas.length === 0;

  // 1. Agrupamos los datos (Procesamiento de cobranzas -> Socios)
  const sociosAgrupados = useMemo(() => {
    if (!preloadedCobranzas.length) return [];

    const mapped = preloadedCobranzas.reduce((acc, curr) => {
      if (!acc[curr.nro_socio]) {
        acc[curr.nro_socio] = { 
          nro_socio: curr.nro_socio,
          nombre: curr.nombre,
          apellido: curr.apellido,
          cobranzas: [] 
        };
      }
      acc[curr.nro_socio].cobranzas.push({
        ...curr,
        monto: parseFloat(curr.monto || 0) 
      });
      return acc;
    }, {});

    return Object.values(mapped);
  }, [preloadedCobranzas]);

  // 2. Filtramos los datos procesados
  const sociosFiltrados = useMemo(() => {
    return sociosAgrupados
      .map(s => ({
        ...s,
        filtradas: s.cobranzas.filter(c => {
          const matchMes = filtros.mes === "" || c.mes === parseInt(filtros.mes);
          const matchEstado = filtros.estado === "todos" || 
                             (filtros.estado === "pagados" ? c.pago : !c.pago);
          return matchMes && matchEstado;
        })
      }))
      .filter(s => {
        const matchSocio = s.nro_socio.toString().includes(filtros.socio);
        const nombreCompleto = `${s.nombre} ${s.apellido || ""}`.toLowerCase();
        const matchNombre = nombreCompleto.includes(filtros.nombre.toLowerCase());
        
        // Solo mostramos al socio si coincide con los filtros y tiene cobranzas filtradas
        return matchSocio && matchNombre && s.filtradas.length > 0;
      });
  }, [sociosAgrupados, filtros]);

  return { 
    loading, 
    filtros, 
    setFiltros, 
    sociosFiltrados, 
    API_URL 
  };
}