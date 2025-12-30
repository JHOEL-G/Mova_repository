import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { globalApi } from "../../services/globalApi";
import { PDFDocument } from "pdf-lib";

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
      const pdfDoc = await PDFDocument.load(base64Completo);
      const nuevoPdf = await PDFDocument.create();
      const [primeraPagina] = await nuevoPdf.copyPages(pdfDoc, [0]);
      nuevoPdf.addPage(primeraPagina);
      const pdfBytes = await nuevoPdf.saveAsBase64();
      return pdfBytes;
    } catch (error) {
      console.error("Error al recortar el PDF:", error);
      return base64Completo;
    }
  };

  const ejecutarFirma = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert("Por favor, dibuja tu firma.");
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener PDF
      const resDoc = await globalApi.obtenerDocumentoContrato(referencia);
      const pdfBase64Completo = await blobToBase64(resDoc.data);

      // 2. Recortar
      const pdfSoloPrimeraPagina = await extraerPrimeraPagina(
        pdfBase64Completo
      );

      // 3. Imagen de la firma
      const firmaImagenBase64 = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png")
        .split(",")[1];

      const dataFirma = {
        referenciaId: referencia,
        pdfBase64: pdfSoloPrimeraPagina,
        nombre: nombreUsuario,
        correo: correoUsuario,
        firmaImagenBase64: firmaImagenBase64,
        coordenadas: [0],
      };

      // 4. POST: Firmar
      console.log("✍️ Firmando documento...");
      const resFirma = await globalApi.firmarDocumento(dataFirma);
      console.log("✅ Resultado Firma NOM151:", resFirma);

      if (!resFirma.data || resFirma.data.length === 0) {
        alert(
          "El servicio de firma no devolvió datos válidos (NOM151). No se puede registrar."
        );
        setLoading(false);
        return;
      }

      // --- MAPEADO CORREGIDO SEGÚN SCHEMA ---
      const infoNom151 =
        resFirma.data && resFirma.data[0] ? resFirma.data[0] : {};

      // 5. Preparar el payload con la estructura EXACTA del schema
      const payloadRegistro = {
        latitud: 0,
        logitud: 0,
        Firma: firmaImagenBase64, // ⚠️ Con F mayúscula según error 400
        firmaPath:
          infoNom151.representacionVisual || infoNom151.pdfFirmado || "",
        certificaDocumento: true,
        firmantesRestantes: 0,
        contratoFirma: {
          error: resFirma.error || 0,
          resultado: resFirma.resultado || "Exitoso",
          data: [
            {
              claveMensaje: infoNom151.claveMensaje || 0,
              codigoValidacion: infoNom151.codigoValidacion || "",
              estatus: infoNom151.estatus || "S",
              hash: infoNom151.hash || "",
              nom151: infoNom151.nom151 || "",
              pdfFirmado: infoNom151.pdfFirmado || "",
              representacionVisual: infoNom151.representacionVisual || "",
            },
          ],
        },
      };

      console.log("🔍 Verificando datos antes de registrar:");
      console.log("Referencia:", referencia);
      console.log("TipoId extraído:", referencia.charAt(0));
      console.log(
        "📦 Datos NOM151 recibidos:",
        JSON.stringify(infoNom151, null, 2)
      );
      console.log(
        "📦 Payload completo a enviar:",
        JSON.stringify(payloadRegistro, null, 2)
      );

      const respuestaFinal = await globalApi.obtenerUrlContratoFinal(
        referencia,
        payloadRegistro
      );

      // 6. Manejo de respuesta
      if (respuestaFinal.error === 0) {
        alert("✅ ¡Contrato firmado y registrado con éxito!");

        const urlFinal =
          respuestaFinal.data?.[0]?.representacionVisual ||
          respuestaFinal.data?.[0]?.pdfFirmado;

        if (urlFinal) {
          window.location.href = urlFinal;
        } else {
          console.warn(
            "No se encontró URL de redirección, pero el registro fue exitoso."
          );
        }
      } else {
        alert("Error al registrar: " + respuestaFinal.resultado);
      }
    } catch (error) {
      console.error("Error detallado en el proceso:", error);
      alert("Error en la comunicación con el servidor. Revisa la consola.");
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
