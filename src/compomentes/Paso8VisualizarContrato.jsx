/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { globalApi } from "../../services/globalApi";
import { useParams } from "react-router";
import FirmaDoc from "./FirmaDoc";

const Paso8VisualizarContrato = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const cargarDocumento = async () => {
      try {
        setCargando(true);

        // LÓGICA DE SELECCIÓN DE CONTRATO
        // Verificamos si el ID empieza con 2, 3 o 4
        const primerCaracter = id?.charAt(0);
        const idsEspeciales = ["2", "3", "4"];

        let rutaFinal = "/CONTRATO-22.pdf"; // PDF por defecto

        if (idsEspeciales.includes(primerCaracter)) {
          console.log("ID detectado para Contrato 11");
          rutaFinal = "/CONTRATO-11.pdf";
        } else {
          console.log("Cargando contrato estándar 22");
        }

        // Simulación de carga (o puedes usar la API si ya está lista)
        setPdfUrl(rutaFinal);
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDocumento();
  }, [id]);

  if (cargando)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Cargando contrato...
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <h3 style={{ textAlign: "center", margin: "10px 0" }}>
        Revisión de Contrato Estático
      </h3>

      {/* TOOLBAR */}
      <div style={toolbarStyle}>
        <button onClick={() => setZoom((z) => Math.max(z - 25, 50))}>
          ➖ Alejar
        </button>
        <span style={{ fontWeight: "bold" }}>{zoom}%</span>
        <button onClick={() => setZoom((z) => Math.min(z + 25, 200))}>
          ➕ Acercar
        </button>
      </div>

      {/* VISUALIZADOR REFORZADO */}
      <div style={{ flex: 1, backgroundColor: "#525659", overflow: "hidden" }}>
        {pdfUrl && (
          <object
            key={zoom}
            data={`${pdfUrl}#toolbar=0&navpanes=0&zoom=${zoom}`}
            type="application/pdf"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Si el object falla, mostramos un link de respaldo */}
            <div
              style={{ color: "white", textAlign: "center", marginTop: "20%" }}
            >
              <p>No se pudo previsualizar el PDF.</p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#818cf8" }}
              >
                Click aquí para abrir el archivo directamente
              </a>
            </div>
          </object>
        )}
      </div>

      <div style={footerStyle}>
        <button onClick={() => setIsModalOpen(true)} style={btnConfirmarStyle}>
          CONFIRMAR Y FIRMAR
        </button>
      </div>

      {/* MODAL DE FIRMA */}
      {isModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}>
              ✕
            </button>
            <FirmaDoc
              referencia={id}
              nombreUsuario="Usuario de Prueba"
              correoUsuario="prueba@dominio.com"
              onCerrar={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos necesarios para que el modal no falle
const toolbarStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  padding: "10px",
  backgroundColor: "#e5e7eb",
};
const footerStyle = {
  padding: "20px",
  textAlign: "center",
  backgroundColor: "#f4f4f4",
};
const btnConfirmarStyle = {
  backgroundColor: "#282195",
  color: "white",
  padding: "14px 40px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
  maxWidth: "300px",
};
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const modalContentStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "15px",
  width: "90%",
  maxWidth: "500px",
  position: "relative",
};
const closeBtnStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "18px",
};

export default Paso8VisualizarContrato;
