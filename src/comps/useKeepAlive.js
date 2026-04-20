/*Para mantener despierto el back*/
import { useEffect } from "react";

export function useKeepAlive(url) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetch(url).catch(() => {});
        console.log("Keep-alive: Servidor activo");
        console.log("Keep-alive ping:", new Date().toLocaleTimeString());
      }
    }, 13 * 60 * 1000); // 13 minutos

    return () => clearInterval(interval);
  }, [url]);
}