/* eslint-disable no-unused-vars */
import axios from "axios";

const apiNegocio = axios.create({
  baseURL: "/api-negocio/api",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "99A7F0FCE91CECE2D52429D1243F2950",
  },
});

const apiServicios = axios.create({
  baseURL: "/api-servicios",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": "96c9b926a6d3207d0bd1dda8d3e468bd1111111",
  },
});

[apiNegocio, apiServicios].forEach((api) => {
  api.interceptors.request.use(
    (config) => {
      console.log(
        "📤 REQUEST:",
        config.method.toUpperCase(),
        config.baseURL + config.url
      );
      if (config.data) {
        const preview = JSON.stringify(config.data, null, 2).substring(0);
      }
      return config;
    },
    (error) => {
      console.error("❌ REQUEST ERROR:", error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log("✅ RESPONSE:", response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error("❌ RESPONSE ERROR:", {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
      return Promise.reject(error);
    }
  );
});

export const globalApi = {
  obtenerDetalleVale: async (referencia) => {
    const cleanRef = referencia.trim();
    console.log("🔍 Obteniendo vale:", cleanRef);
    const response = await apiNegocio.get(`/Vale/${cleanRef}`);
    return response;
  },

  registrarFormulario: (data) => {
    console.log("🔍 Payload completo:", JSON.stringify(data, null, 2));
    console.log("🔍 Referencia:", data.referencia);

    return apiNegocio.post("/Cliente/registro", data, {
      headers: {
        referencia: data.referencia,
      },
    });
  },

  subirFotoINE: async (base64Image, imageType) => {
    const payload = {
      image: base64Image,
    };

    const response = await apiServicios.post("/OCR/FotoCaptura", payload, {
      headers: {
        imageType: imageType,
      },
    });

    return response.data;
  },

  procesarOCRFinal: async () => {
    const response = await apiServicios.post("/OCR/ocrValidacion");
    return response.data;
  },

  validarIdentidad: async (
    base64ImgFrontal,
    base64ImgReverso,
    referencia = "temp_ref"
  ) => {
    const payload = {
      proveedorId: 1,
      base64Img: base64ImgFrontal,
      base64ImgReverso: base64ImgReverso,
      referencia: String(referencia),
      cara: 1,
      validate: true,
    };
    console.log("ver datos ", payload);
    const response = await apiServicios.post("/OCR/INE", payload);
    return response.data;
  },

  validarIneSelfie: async (
    base64IneFrontal,
    base64Selfie,
    referenciaId = "temp_ref"
  ) => {
    const payload = {
      credencial: base64IneFrontal,
      captura: base64Selfie,
      referenciaId: String(referenciaId),
    };

    console.log("Payload Biometría enviado:", {
      credencial: payload.credencial.substring(0, 50) + "...",
      captura: payload.captura.substring(0, 50) + "...",
      referenciaId: payload.referenciaId,
      credencialStartsWith: payload.credencial.substring(0, 30),
      capturaStartsWith: payload.captura.substring(0, 30),
    });

    try {
      const response = await apiServicios.post(
        "/Biometricos/validarIneSelfie",
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error en biometría:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  consultarCP: (cp) => {
    return apiNegocio.get(`/Catalogos/asentamientos`, {
      params: { cp: cp },
    });
  },

  consultarParentescos: () => {
    return apiNegocio.get(`/Catalogos/parentescos`);
  },

  consultarBancos: () => {
    return apiNegocio.get(`/Catalogos/bancos`);
  },

  procesarOCR: (formData) => {
    return apiServicios.post(`/OCR/INE`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  obtenerDocumentoContrato: async (referencia) => {
    const cleanRef = referencia.trim();
    const tipoId = cleanRef.charAt(0);

    try {
      const response = await apiNegocio.get("/Solicitud/contrato/documento", {
        headers: {
          referencia: cleanRef,
          validacionTipoId: tipoId,
        },
      });

      // Retornamos los datos directamente
      // 'data' será null porque NO hay un archivo binario en la respuesta
      return {
        data: null,
        metadata: response.data,
        soloDatos: true,
      };
    } catch (error) {
      console.error("❌ Error en GET contrato:", error.message);
      throw error;
    }
  },

  firmarDocumento: async (datos) => {
    // 1. Validar presencia de datos críticos para evitar el 400
    const nombreValido = datos.nombre || "Nombre no proporcionado";
    const correoValido = datos.correo || "correo@ejemplo.com";

    console.log("\n🔍 === VALIDACIÓN PRE-ENVÍO ===");
    console.log("- Nombre enviado:", nombreValido);
    console.log("- Correo enviado:", correoValido);

    // 2. Construir el payload respetando el esquema de la imagen
    const payload = {
      referenciaId: String(datos.referenciaId),
      pdfDocBase64: datos.pdfBase64, // Asegúrate que este nombre coincida con tu Swagger
      firmantes: [
        {
          nombreCompleto: nombreValido,
          correoElectronico: correoValido,
          firma: {
            imagen: datos.firmaImagenBase64,
            ubicacion: datos.coordenadas, // Debe ser el Array [1, 110, 220, 200, 60]
          },
        },
      ],
    };

    try {
      const response = await apiServicios.post(
        "/signDocument/firmarDocumentoNom151",
        payload
      );
      return response.data;
    } catch (error) {
      // Log detallado para depurar la validación del servidor
      console.error(
        "❌ Error 400 - Detalles de validación:",
        error.response?.data
      );
      throw error;
    }
  },

  registrarBiometricos: async (datos, referencia) => {
    try {
      const response = await apiNegocio.post(
        "/Cliente/biometricos/registro",
        datos,
        {
          headers: {
            "Content-Type": "application/json",
            usuarioId: "1",
            validacionTipoId: "1",
            referencia: String(referencia),
            referenciaId: String(referencia),
          },
        }
      );
      console.log("✅ Registro exitoso:", response.data);
      return response.data;
    } catch (error) {
      return error;
    }
  },

  obtenerUrlContratoFinal: async (referencia, payloadRegistro) => {
    try {
      console.log("📤 === INICIO DEBUG PAYLOAD REGISTRO ===");
      console.log("🔍 Referencia:", referencia);
      console.log("🔍 Tipo de referencia:", typeof referencia);
      console.log(
        "🔍 Primer carácter (validacionTipoId):",
        referencia.charAt(0)
      );

      console.log("\n📦 PAYLOAD COMPLETO:");
      console.log(JSON.stringify(payloadRegistro, null, 2));

      console.log("\n📊 TAMAÑOS:");
      console.log("- latitud:", payloadRegistro.latitud);
      console.log("- logitud:", payloadRegistro.logitud);
      console.log("- firma length:", payloadRegistro.firma?.length || 0);
      console.log(
        "- firmaPath length:",
        payloadRegistro.firmaPath?.length || 0
      );
      console.log("- certificaDocumento:", payloadRegistro.certificaDocumento);
      console.log("- firmantesRestantes:", payloadRegistro.firmantesRestantes);

      console.log("\n🔍 CONTRATO FIRMA:");
      console.log("- error:", payloadRegistro.contratoFirma?.error);
      console.log("- resultado:", payloadRegistro.contratoFirma?.resultado);
      console.log(
        "- data array length:",
        payloadRegistro.contratoFirma?.data?.length || 0
      );

      if (payloadRegistro.contratoFirma?.data?.[0]) {
        const data0 = payloadRegistro.contratoFirma.data[0];
        console.log("\n📋 DATA[0]:");
        console.log("- claveMensaje:", data0.claveMensaje);
        console.log("- codigoValidacion:", data0.codigoValidacion);
        console.log("- estatus:", data0.estatus);
        console.log("- hash:", data0.hash);
        console.log("- nom151:", data0.nom151);
        console.log("- pdfFirmado length:", data0.pdfFirmado?.length || 0);
        console.log(
          "- representacionVisual length:",
          data0.representacionVisual?.length || 0
        );
      }

      console.log("\n📤 === FIN DEBUG PAYLOAD ===\n");

      // ✅ HEADERS COMPLETOS (revisa qué headers usas en Postman)
      const headers = {
        "Content-Type": "application/json",
        referencia: "1-3C5F9EBC-4FE3-F011-B513-000C29AC7C09",
        usuarioId: "1", // ⚠️ Verifica si este valor es correcto
        validacionTipoId: String(referencia.charAt(0)),
        // ✅ Agrega cualquier otro header que uses en Postman
        // Por ejemplo, si tienes un token de autenticación:
        // "Authorization": "Bearer YOUR_TOKEN",
      };

      console.log("\n📤 HEADERS ENVIADOS:", headers);

      const response = await apiNegocio.post(
        "/Cliente/contrato/registro",
        payloadRegistro,
        { headers }
      );

      console.log("✅ Registro de contrato exitoso:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error en registro de contrato:", error.response?.data);

      if (error.response?.data) {
        console.error("\n🔴 DETALLES DEL ERROR 500:");
        console.error("- Status:", error.response.status);
        console.error("- Error code:", error.response.data.error);
        console.error("- Resultado:", error.response.data.resultado);
        console.error("- Data:", error.response.data.data);
      }

      throw error;
    }
  },
};
