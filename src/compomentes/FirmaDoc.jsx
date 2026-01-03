/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { globalApi } from "../../services/globalApi";
import { PDFDocument } from "pdf-lib";

export default function FirmaDoc({ referencia, ubicacion, onCerrar }) {
  const sigCanvas = useRef({});
  const [loading, setLoading] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [urlRedireccion, setUrlRedireccion] = useState("");

  // ✅ ESTADOS EDITABLES: Valores por defecto estáticos si vienen vacíos del backend
  const [nombre, setNombre] = useState("Cliente Ejemplo");
  const [correo, setCorreo] = useState("cliente@ejemplo.com");
  const [coordenadas, setCoordenadas] = useState([1, 110, 220, 200, 60]);

  // ✅ MANEJAR BOTÓN ATRÁS DEL NAVEGADOR
  useEffect(() => {
    // Agregar entrada al historial
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event) => {
      // Prevenir navegación hacia atrás
      window.history.pushState(null, "", window.location.href);

      // Redirigir al inicio
      if (window.confirm("¿Deseas salir? Serás redirigido al inicio.")) {
        window.location.href = "/";
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ✅ PASO 0: Cargar datos desde el backend al montar el componente
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        console.log("📥 === OBTENIENDO DATOS DEL GET ===");
        console.log("🔍 Referencia:", referencia);

        const infoContrato = await globalApi.obtenerDocumentoContrato(
          referencia
        );

        console.log(
          "📦 Respuesta completa del GET:",
          JSON.stringify(infoContrato, null, 2)
        );

        const data = infoContrato.metadata?.data;

        if (data) {
          console.log("✅ Data encontrada:", data);

          // CASO 1: Datos en pagare.firmas
          if (data.pagare?.firmas) {
            const f = data.pagare.firmas;
            console.log("📋 Firmas encontradas en pagare:", f);

            // ✅ EXTRAER NOMBRE
            const nombreDB = f.socioNombre || f.clienteNombre || "";
            if (nombreDB && nombreDB.trim() !== "" && !nombreDB.includes("{")) {
              console.log("✅ Nombre desde DB:", nombreDB);
              setNombre(nombreDB);
            } else {
              console.log(
                "⚠️ Nombre vacío o placeholder en DB, usando estático:",
                nombre
              );
            }

            // ✅ EXTRAER CORREO
            const correoDB = f.socioCorreo || f.clienteCorreo || "";
            if (
              correoDB &&
              correoDB.trim() !== "" &&
              !correoDB.includes("demo@")
            ) {
              console.log("✅ Correo desde DB:", correoDB);
              setCorreo(correoDB);
            } else {
              console.log(
                "⚠️ Correo vacío o demo en DB, usando estático:",
                correo
              );
            }

            // ✅ EXTRAER COORDENADAS
            const coordenadasDB =
              f.socioCoordenadas || f.clienteCoordenadas || f.aval1Coordenadas;
            if (coordenadasDB) {
              try {
                const coords =
                  typeof coordenadasDB === "string"
                    ? JSON.parse(coordenadasDB)
                    : coordenadasDB;
                console.log("✅ Coordenadas desde DB:", coords);
                setCoordenadas(coords);
              } catch (e) {
                console.warn(
                  "⚠️ Error parseando coordenadas, usando default:",
                  e
                );
              }
            } else {
              console.log(
                "⚠️ No se encontraron coordenadas en DB, usando default"
              );
            }
          }
          // CASO 2: Datos en poliza
          else if (data.poliza) {
            console.log("📋 Datos encontrados en poliza:", data.poliza);

            if (
              data.poliza.nombre &&
              data.poliza.nombre.trim() !== "" &&
              !data.poliza.nombre.includes("{")
            ) {
              console.log("✅ Nombre desde poliza:", data.poliza.nombre);
              setNombre(data.poliza.nombre);
            }

            if (data.poliza.correo && data.poliza.correo.trim() !== "") {
              console.log("✅ Correo desde poliza:", data.poliza.correo);
              setCorreo(data.poliza.correo);
            }

            if (data.poliza.coordenadas) {
              try {
                const coords =
                  typeof data.poliza.coordenadas === "string"
                    ? JSON.parse(data.poliza.coordenadas)
                    : data.poliza.coordenadas;
                console.log("✅ Coordenadas desde poliza:", coords);
                setCoordenadas(coords);
              } catch (e) {
                console.warn("⚠️ Error parseando coordenadas de poliza:", e);
              }
            }
          }

          console.log("📊 VALORES FINALES CARGADOS:");
          console.log("- Nombre:", nombre);
          console.log("- Correo:", correo);
          console.log("- Coordenadas:", coordenadas);
        } else {
          console.log("⚠️ No se encontró 'data' en la respuesta");
        }

        console.log("✅ === FIN CARGA DE DATOS ===\n");
      } catch (error) {
        console.error("❌ Error cargando metadatos iniciales:", error);
        console.log("ℹ️ Usando valores estáticos por defecto");
      }
    };
    fetchMetadata();
  }, [referencia]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const comprimirFirma = (dataUrl, maxWidth = 300, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    });
  };

  const ejecutarFirma = async () => {
    // ✅ VALIDACIÓN: Campos obligatorios
    if (!nombre || nombre.trim() === "" || !correo || correo.trim() === "") {
      alert("Por favor, introduce un nombre y correo válido antes de firmar.");
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      alert("Por favor, dibuja tu firma.");
      return;
    }

    // ✅ VALIDACIÓN: Ubicación requerida
    if (!ubicacion || !ubicacion.latitud || !ubicacion.longitud) {
      alert("No se pudo obtener tu ubicación. Por favor, intenta nuevamente.");
      return;
    }

    setLoading(true);
    try {
      console.log("\n📤 === INICIANDO PROCESO DE FIRMA ===");

      const respuestaPdf = await fetch("/CONTRATO-11.pdf");
      const pdfBlob = await respuestaPdf.blob();
      const pdfBase64 = await blobToBase64(pdfBlob);

      const firmaOriginal = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");
      const firmaComprimida = await comprimirFirma(firmaOriginal, 300, 0.7);
      const firmaImgBase64 = firmaComprimida.split(",")[1];

      // ✅ CONSTRUIR PAYLOAD PARA FIRMAR DOCUMENTO
      const datosParaFirmar = {
        referenciaId: referencia,
        pdfBase64: pdfBase64,
        nombre: nombre,
        correo: correo,
        firmaImagenBase64: firmaImgBase64,
        coordenadas: coordenadas,
      };

      console.log("📦 === PAYLOAD FIRMA DOCUMENTO ===");
      console.log(
        JSON.stringify(
          {
            referenciaId: datosParaFirmar.referenciaId,
            pdfBase64: `${datosParaFirmar.pdfBase64.substring(0, 50)}... (${
              datosParaFirmar.pdfBase64.length
            } chars)`,
            nombre: datosParaFirmar.nombre,
            correo: datosParaFirmar.correo,
            firmaImagenBase64: `${datosParaFirmar.firmaImagenBase64.substring(
              0,
              50
            )}... (${datosParaFirmar.firmaImagenBase64.length} chars)`,
            coordenadas: datosParaFirmar.coordenadas,
          },
          null,
          2
        )
      );

      console.log(
        "\n🚀 Enviando POST a /signDocument/firmarDocumentoNom151..."
      );

      // ✅ PASO 1: FIRMAR DOCUMENTO
      const resFirma = await globalApi.firmarDocumento(datosParaFirmar);

      console.log("✅ RESPUESTA FIRMA:", JSON.stringify(resFirma, null, 2));

      // ✅ VALIDAR RESPUESTA DE FIRMA
      if (
        resFirma.error !== 0 ||
        !resFirma.data ||
        resFirma.data.length === 0
      ) {
        throw new Error(
          resFirma.data?.[0]?.mensaje || "Error al firmar documento"
        );
      }

      const firmaData = resFirma.data[0];

      // ✅ VALIDAR QUE LA FIRMA FUE EXITOSA
      if (firmaData.estatus !== "OK") {
        throw new Error(
          firmaData.mensaje || "El documento no se firmó correctamente"
        );
      }

      console.log("\n📦 === CONSTRUYENDO PAYLOAD PARA REGISTRO FINAL ===");

      // ✅ PASO 2: CONSTRUIR PAYLOAD PARA REGISTRO DE CONTRATO
      const payloadRegistroFinal = {
        latitud: Number(ubicacion.latitud),
        logitud: Number(ubicacion.longitud),
        firma: firmaImgBase64,
        firmaPath: "firmaDvPagare",
        certificaDocumento: true,
        firmantesRestantes: 0,
        contratoFirma: {
          error: Number(resFirma.error),
          resultado: String(resFirma.resultado),
          data: [
            {
              claveMensaje: Number(firmaData.claveMensaje || 0),
              codigoValidacion: String(firmaData.codigoValidacion || ""),
              estatus: String(firmaData.estatus || ""),
              hash: String(firmaData.hash || ""),
              nom151: String(firmaData.nom151 || ""),
              pdfFirmado: String(firmaData.pdfFirmado || ""),
              representacionVisual: String(
                firmaData.representacionVisual || ""
              ),
            },
          ],
        },
      };

      console.log("\n📤 === PAYLOAD COMPLETO REGISTRO FINAL ===");
      console.log(JSON.stringify(payloadRegistroFinal, null, 2));

      console.log("\n🚀 Enviando POST a /Cliente/contrato/registro...");

      // ✅ PASO 3: REGISTRAR CONTRATO FINAL
      const resRegistro = await globalApi.obtenerUrlContratoFinal(
        referencia,
        payloadRegistroFinal
      );

      console.log(
        "✅ RESPUESTA REGISTRO FINAL:",
        JSON.stringify(resRegistro, null, 2)
      );
      console.log("✅ === PROCESO COMPLETADO EXITOSAMENTE ===\n");

      // ✅ MOSTRAR MODAL DE ÉXITO
      const textoMostrar =
        resRegistro.data?.textoMostrar ||
        "¡Documento firmado y registrado correctamente!";
      const url = resRegistro.data?.url || "";

      setMensajeExito(textoMostrar);
      setUrlRedireccion(url);
      setMostrarExito(true);
    } catch (error) {
      console.error("❌ Error en el proceso de firma:", error);
      console.error(
        "❌ Detalles del error:",
        error.response?.data || error.message
      );
      alert(`Ocurrió un error: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA CERRAR Y REDIRIGIR
  const handleCerrarExito = () => {
    if (urlRedireccion) {
      window.location.href = urlRedireccion;
    } else {
      // Salir de la aplicación o ir al inicio
      window.location.href = "/";
    }
  };

  return (
    <>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ marginBottom: "10px" }}>Dibuja tu firma</h3>

        {/* ✅ Mostrar información de ubicación */}
        {ubicacion && (
          <div
            style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}
          >
            📍 Ubicación obtenida: Lat {ubicacion.latitud.toFixed(6)}, Lon{" "}
            {ubicacion.longitud.toFixed(6)}
          </div>
        )}

        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#f9f9f9",
            width: "440px",
            margin: "0 auto",
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
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={() => sigCanvas.current.clear()}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Limpiar
          </button>
          <button
            onClick={ejecutarFirma}
            disabled={loading || !ubicacion}
            style={{
              padding: "10px 20px",
              background: loading || !ubicacion ? "#ccc" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || !ubicacion ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Procesando..." : "Finalizar y Firmar"}
          </button>
        </div>
      </div>

      {/* ✅ MODAL DE ÉXITO */}
      {mostrarExito && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "40px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* ✅ ICONO DE ÉXITO */}
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#4CAF50",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0 auto 20px",
                fontSize: "40px",
                color: "white",
              }}
            >
              ✓
            </div>

            {/* ✅ TÍTULO */}
            <h2
              style={{
                color: "#4CAF50",
                marginBottom: "20px",
                fontSize: "24px",
              }}
            >
              ¡Felicidades!
            </h2>

            {/* ✅ MENSAJE DEL SERVIDOR */}
            <div
              style={{
                color: "#333",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "30px",
                textAlign: "left",
              }}
              dangerouslySetInnerHTML={{ __html: mensajeExito }}
            />

            {/* ✅ BOTÓN ACEPTAR */}
            <button
              onClick={handleCerrarExito}
              style={{
                background: "#282195",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#1a1570")}
              onMouseLeave={(e) => (e.target.style.background = "#282195")}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
