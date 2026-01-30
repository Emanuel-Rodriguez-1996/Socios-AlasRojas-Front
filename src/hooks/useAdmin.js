import { useState, useEffect, useMemo } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api/cobranzas";

export function useAdmin() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ socio: "", mes: "", estado: "todos" });

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // Agrupamos por nro_socio
        const mapped = data.reduce((acc, curr) => {
          if (!acc[curr.nro_socio]) acc[curr.nro_socio] = { ...curr, cobranzas: [] };
          acc[curr.nro_socio].cobranzas.push(curr);
          return acc;
        }, {});
        setSocios(Object.values(mapped));
      })
      .catch(err => console.error("Error al cargar cobranzas:", err))
      .finally(() => setLoading(false));
  }, []);

  // Usamos useMemo para que el filtrado solo ocurra cuando cambian los filtros o los socios
  const sociosFiltrados = useMemo(() => {
    return socios.map(s => ({
      ...s,
      filtradas: s.cobranzas.filter(c => {
        const matchMes = filtros.mes === "" || c.mes === parseInt(filtros.mes);
        const matchEstado = filtros.estado === "todos" || 
                           (filtros.estado === "pagados" ? c.pago : !c.pago);
        return matchMes && matchEstado;
      })
    })).filter(s => s.nro_socio.toString().includes(filtros.socio) && s.filtradas.length > 0);
  }, [socios, filtros]);

  return { loading, filtros, setFiltros, sociosFiltrados, API_URL };
}