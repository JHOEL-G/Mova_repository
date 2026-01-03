/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import FirmaDoc from "./FirmaDoc";

// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Paso8VisualizarContrato = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const cargarDocumento = async () => {
      try {
        setCargando(true);

        const primerCaracter = id?.charAt(0);
        const idsEspeciales = ["2", "3", "4"];

        let rutaFinal = "/CONTRATO-22.pdf";

        if (idsEspeciales.includes(primerCaracter)) {
          console.log("ID detectado para Contrato 22");
          rutaFinal = "/CONTRATO-22.pdf";
        } else {
          console.log("Cargando contrato estándar 11");
          rutaFinal = "/CONTRATO-11.pdf";
        }

        setPdfUrl(rutaFinal);
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDocumento();
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada por este navegador"));
        return;
      }

      console.log("📍 Solicitando permisos de ubicación...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            precision: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          console.log("✅ Ubicación obtenida:", coords);
          resolve(coords);
        },
        (error) => {
          console.error("❌ Error obteniendo ubicación:", error);
          let mensajeError = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensajeError =
                "Permiso de ubicación denegado. Por favor, activa los permisos en tu navegador.";
              break;
            case error.POSITION_UNAVAILABLE:
              mensajeError = "Información de ubicación no disponible.";
              break;
            case error.TIMEOUT:
              mensajeError =
                "Tiempo de espera agotado al obtener la ubicación.";
              break;
            default:
              mensajeError = "Error desconocido al obtener la ubicación.";
          }
          reject(new Error(mensajeError));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleAbrirModal = async () => {
    setIsModalOpen(true);
    setErrorUbicacion(null);

    try {
      const coords = await obtenerUbicacion();
      setUbicacion(coords);
    } catch (error) {
      setErrorUbicacion(error.message);
      console.error("No se pudo obtener la ubicación:", error);
    }
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setUbicacion(null);
    setErrorUbicacion(null);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

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
        <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}>
          ➖ Alejar
        </button>
        <span style={{ fontWeight: "bold" }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(s + 0.25, 2))}>
          ➕ Acercar
        </button>
      </div>

      {/* VISUALIZADOR */}
      <div style={viewerContainerStyle}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div
              style={{ color: "white", textAlign: "center", padding: "20px" }}
            >
              Cargando PDF...
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          ))}
        </Document>
      </div>

      <div style={footerStyle}>
        <button onClick={handleAbrirModal} style={btnConfirmarStyle}>
          CONFIRMAR Y FIRMAR
        </button>
      </div>

      {/* MODAL DE FIRMA */}
      {isModalOpen && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <button onClick={handleCerrarModal} style={closeBtnStyle}>
              ✕
            </button>
            <FirmaDoc
              referencia={id}
              ubicacion={ubicacion}
              onCerrar={handleCerrarModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const toolbarStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  padding: "10px",
  backgroundColor: "#e5e7eb",
};

const viewerContainerStyle = {
  flex: 1,
  backgroundColor: "#525659",
  overflow: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px 0",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "15px",
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
  maxHeight: "90vh",
  overflowY: "auto",
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
