
import "./vistLoading.css";
export default function Loading({ mensaje, tipo = "full" }) {
  if (tipo === "mini") {
    return (
      <div className="spinner-wrapper-mini">
        <div className="spinner mini"></div>
        {mensaje && <span className="mensaje-mini">{mensaje}</span>}
      </div>
    );
  }

  return (
    <div className="vista-container loader-container">
      <div className="spinner"></div>
      <p className="status-text">{mensaje || "Cargando..."}</p>
    </div>
  );
}