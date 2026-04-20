import { useState, useEffect, useCallback } from "react";

const API_URL = "https://socios-alasrojas-back.onrender.com/api";

export function useApp() {
  const [globalData, setGlobalData] = useState({ socios: [], cobranzas: [] });
  const [isPreloading, setIsPreloading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      // Iniciamos la carga en 2do plano
      const [resS, resC] = await Promise.all([
        fetch(`${API_URL}/socios`),
        fetch(`${API_URL}/cobranzas`)
      ]);
      
      const socios = await resS.json();
      const cobranzas = await resC.json();
      const data = { socios, cobranzas };

      setGlobalData(data);
      // Guardamos para la próxima vez que abra la app
      localStorage.setItem("cache_app_data", JSON.stringify(data));
    } catch (error) {
      console.error("Error en precarga silenciosa:", error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Intentamos cargar caché para que Admin/Cobrador no nazcan vacíos
    const cache = localStorage.getItem("cache_app_data");
    if (cache) {
      setGlobalData(JSON.parse(cache));
      // Si hay caché, ya no bloqueamos visualmente con loaders pesados
      setIsPreloading(false); 
    }
    
    // 2. Sincronizamos con el servidor SIEMPRE al inicio (2do plano)
    refreshData();
  }, [refreshData]);

  return {
    socios: globalData.socios,
    cobranzas: globalData.cobranzas,
    isPreloading,
    refreshData
  };
}