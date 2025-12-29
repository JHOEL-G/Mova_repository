import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { globalApi } from "../../services/globalApi";
import { PDFDocument } from "pdf-lib"; // 1. Importar la librería

export default function FirmaDoc({ referencia, correoUsuario, nombreUsuario }) {
  const sigCanvas = useRef({});
  const [loading, setLoading] = useState(false);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const extraerPrimeraPagina = async (base64Completo) => {
    try {
      // Cargar el PDF completo (el que viene del back o local)
      const pdfDoc = await PDFDocument.load(base64Completo);

      // Crear un nuevo documento PDF
      const nuevoPdf = await PDFDocument.create();

      // Copiar solo la primera página (índice 0)
      const [primeraPagina] = await nuevoPdf.copyPages(pdfDoc, [0]);
      nuevoPdf.addPage(primeraPagina);

      // Guardar el nuevo PDF y convertirlo a Base64
      const pdfBytes = await nuevoPdf.saveAsBase64();
      return pdfBytes;
    } catch (error) {
      console.error("Error al recortar el PDF:", error);
      return base64Completo; // Si falla, enviamos el original por seguridad
    }
  };

  const ejecutarFirma = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert("Por favor, dibuja tu firma.");
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener el PDF actual (Completo)
      const resDoc = await globalApi.obtenerDocumentoContrato(referencia);
      const pdfBase64Completo = await blobToBase64(resDoc.data);

      // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
      // 2. Recortar para enviar SOLO la primera página
      console.log("Recortando documento: extrayendo solo la primera página...");
      const pdfSoloPrimeraPagina = await extraerPrimeraPagina(
        pdfBase64Completo
      );
      // ---------------------------------

      // 3. Preparar la imagen de la firma
      const firmaImagenBase64 = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png")
        .split(",")[1];

      const dataFirma = {
        referenciaId: referencia,
        pdfBase64: pdfSoloPrimeraPagina, // <--- Enviamos el PDF recortado
        nombre: nombreUsuario,
        correo: correoUsuario,
        firmaImagenBase64: firmaImagenBase64,
        coordenadas: [0],
      };

      // 4. POST: Firmar (Enviando solo 1 hoja)
      await globalApi.firmarDocumento(dataFirma);

      // 5. Espera de seguridad para que el Back procese
      console.log("Firma enviada. Esperando procesamiento del servidor...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 6. GET: Obtener URL Final para redirección
      const respuestaFinal = await globalApi.obtenerUrlContratoFinal(
        referencia
      );

      if (respuestaFinal.error === 0 && respuestaFinal.data?.url) {
        alert(
          "✅ ¡Contrato firmado con éxito! Al dar aceptar serás redirigido al documento."
        );
        window.location.href = respuestaFinal.data.url;
      } else {
        alert("El servidor no devolvió la URL: " + respuestaFinal.resultado);
      }
    } catch (error) {
      console.error("Error en el proceso:", error);
      alert("Error en la comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2
        style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" }}
      >
        Dibuja tu firma
      </h2>
      <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
        Firmando como: <b>{nombreUsuario}</b>
      </p>

      <div
        style={{
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          background: "#f9fafb",
          overflow: "hidden",
        }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: 440,
            height: 200,
            className: "signature-canvas",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => sigCanvas.current.clear()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Limpiar
        </button>
        <button
          onClick={ejecutarFirma}
          disabled={loading}
          style={{
            padding: "10px 25px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#93c5fd" : "#2563eb",
            color: "white",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Firmando..." : "Finalizar y Firmar"}
        </button>
      </div>
    </div>
  );
}
