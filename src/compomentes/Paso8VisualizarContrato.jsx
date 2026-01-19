import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Document, Page, pdfjs } from "react-pdf";
import { globalApi } from "../../services/globalApi";
import FirmaDoc from "./FirmaDoc";

// Configuración del worker - VERSIÓN FIJA
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;
import { useFlow } from "./FlowContext";


const Paso8VisualizarContrato = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const { markStepComplete } = useFlow();

  const { id } = useParams();

  useEffect(() => {
    descargarContratoReal();
  }, [id]);

  const descargarContratoReal = async () => {
    try {
      setCargando(true);

      const respuesta = await globalApi.obtenerPdfContrato(id);

      // 1. Extraer el string específicamente de la propiedad .doc
      // Según tu consola, el base64 está en respuesta.doc
      let base64String = "";

      if (respuesta && respuesta.doc) {
        base64String = respuesta.doc;
      } else if (typeof respuesta === 'string') {
        base64String = respuesta;
      }

      if (!base64String) {
        throw new Error("No se encontró el contenido del PDF en la respuesta");
      }

      // 2. Limpieza del base64
      let base64Limpio = base64String.trim();

      // Eliminar prefijo si existe
      if (base64Limpio.startsWith("data:application/pdf;base64,")) {
        base64Limpio = base64Limpio.substring(28);
      }

      // Limpiar espacios y saltos de línea
      base64Limpio = base64Limpio.replace(/[\s\r\n]/g, "");

      setPdfBase64(base64Limpio);

      // 3. Conversión a blob (esto se mantiene igual)
      const byteCharacters = atob(base64Limpio);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

    } catch (error) {
      console.error("❌ Error al procesar PDF:", error);
      alert("Error al cargar el contrato: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleAbrirModal = async () => {
    markStepComplete(id, "vista");
    setIsModalOpen(true);
    try {
      const coords = await obtenerUbicacion();
      setUbicacion(coords);
    } catch (error) {
      console.error("No se pudo obtener la ubicación:", error);
    }
  };

  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  if (cargando) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>Cargando documento oficial...</h3>
        <p>Por favor espera un momento</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <h3 style={{ textAlign: "center", margin: "10px 0" }}>
        Contrato de Solicitud
      </h3>

      {/* TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          padding: "10px",
          backgroundColor: "#e5e7eb",
        }}
      >
        <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}>
          ➖ Alejar
        </button>
        <span style={{ fontWeight: "bold" }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(s + 0.25, 2))}>
          ➕ Acercar
        </button>
      </div>

      {/* VISUALIZADOR */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#525659",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
        }}
      >
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("Error en PDF:", error)}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        )}
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f4f4f4",
        }}
      >
        <button
          onClick={handleAbrirModal}
          style={{
            backgroundColor: "#282195",
            color: "white",
            padding: "14px 40px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          CONFIRMAR Y FIRMAR
        </button>
      </div>

      {/* MODAL DE FIRMA */}
      {isModalOpen && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "15px",
              width: "90%",
              maxWidth: "500px",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: "none",
                background: "none",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <FirmaDoc
              referencia={id}
              ubicacion={ubicacion}
              pdfBase64={pdfBase64}
              onCerrar={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Paso8VisualizarContrato;
