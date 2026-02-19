import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import CapturaINE from "./compomentes/CapturaINE";
import DetalleVale from "./compomentes/DetalleVale";
import ReconocimientoFacial from "./compomentes/ReconocimientoFacial";
import FormularioCompleto from "./compomentes/FormularioCompleto";
import Paso8VisualizarContrato from "./compomentes/Paso8VisualizarContrato";
import FirmaDoc from "./compomentes/FirmaDoc";
import { FlowProvider } from "./compomentes/FlowContext";
import { ProtectedRoute } from "./compomentes/ProtectedRoute";
import VerificarInformacion from "./compomentes/VerificarInformacion";

function App() {
  return (
    <BrowserRouter>
      <FlowProvider>
        <Routes>
          <Route path="/:id?" element={<DetalleVale />} />

          <Route path="/formulario/:id" element={
            <FormularioCompleto />
          } />

          <Route path="/verificar-informacion/:id" element={
            <VerificarInformacion />
          } />

          <Route path="/captura-ine/:id" element={
            <CapturaINE />
          } />

          <Route path="/reconocimiento/:id" element={
            <ProtectedRoute step="reconocimiento">
              <ReconocimientoFacial />
            </ProtectedRoute>
          } />

          <Route path="/vista/:id" element={
            <Paso8VisualizarContrato />
          } />
        </Routes>
      </FlowProvider>
    </BrowserRouter>
  );
}

export default App;