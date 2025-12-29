import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import CapturaINE from "./compomentes/CapturaINE";
import ContratoFirma from "./compomentes/ContratoFirma";
import DetalleVale from "./compomentes/DetalleVale";
import ReconocimientoFacial from "./compomentes/ReconocimientoFacial";
import FormularioCompleto from "./compomentes/FormularioCompleto";
import Paso8VisualizarContrato from "./compomentes/Paso8VisualizarContrato";
import FirmaDoc from "./compomentes/FirmaDoc";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:id?" element={<DetalleVale />} />
        <Route path="/formulario/:id" element={<FormularioCompleto />} />
        <Route path="/captura-ine/:id" element={<CapturaINE />} />
        <Route path="/reconocimiento/:id" element={<ReconocimientoFacial />} />
        <Route path="/vista/:id" element={<Paso8VisualizarContrato />} />
        <Route path="confirmar-contrato/:id" element={<ContratoFirma />} />
        <Route
          path="firma-doc/:referencia/:correoUsuario/:nombreUsuario"
          element={<FirmaDoc />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
