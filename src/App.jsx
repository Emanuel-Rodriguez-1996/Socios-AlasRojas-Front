import { Routes, Route, useNavigate } from "react-router-dom";
import Cobrador from "./vistas/cobrador";
import Admin from "./vistas/admin";
import "./App.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="imgTit"></div>
      <br />
      <div className="cards-container">
        <div
          className="card card-cobrador"
          onClick={() => navigate("/cobrador")}
        >
          🧾Cobrador
        </div>
        <div
          className="card card-admin"
          onClick={() => navigate("/admin")}
        >
          🛠Administrador
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cobrador" element={<Cobrador />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}