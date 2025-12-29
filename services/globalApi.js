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
        console.log("📦 Payload preview:", preview);
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

    console.log("Payload Biometría enviado:", payload);

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
    // Importante: Si la referencia es "2-44CF...", el charAt(0) es "2"
    const tipoId = cleanRef.charAt(0);

    console.log("🚀 Petición limpia a /Solicitud/contrato/documento");
    console.log("🚀 Headers:", {
      referencia: cleanRef,
      validacionTipoId: tipoId,
    });

    return apiNegocio.get("/Solicitud/contrato/documento", {
      // <-- SIN el /api/ inicial
      responseType: "blob",
      headers: {
        // Asegúrate de usar minúsculas si el servidor es sensible,
        // tu proxy en vite.config ya está buscando 'referencia' en minúsculas.
        referencia: cleanRef,
        validacionTipoId: tipoId,
        Accept: "application/pdf",
      },
    });
  },

  obtenerInfoContrato: async (referencia) => {
    return apiNegocio.get(`/Solicitud/contrato/${referencia}`);
  },

  firmarDocumento: async ({
    referenciaId,
    pdfBase64,
    nombre,
    correo,
    firmaImagenBase64,
    coordenadas = [0],
  }) => {
    const payload = {
      referenciaId: referenciaId,
      pdfDocBase64: pdfBase64,
      firmantes: [
        {
          nombreCompleto: nombre,
          correoElectronico: correo,
          firma: {
            imagen: firmaImagenBase64,
            ubicacion: coordenadas, // El swagger indica un array de números
          },
        },
      ],
    };

    console.log("✍️ Enviando documento a firmar:", {
      referenciaId,
      nombre,
      ubicacion: coordenadas,
    });

    try {
      // Usamos apiServicios que apunta a /api-servicios
      const response = await apiServicios.post(
        "/signDocument/firmarDocumentoNom151",
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error en firmarDocumento:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  obtenerUrlContratoFinal: async (referencia) => {
    const cleanRef = referencia.trim();
    // PRUEBA CAMBIANDO ESTA RUTA SEGÚN TU DOCUMENTACIÓN DE API
    // Si antes usaste /Solicitud/contrato/documento para el PDF,
    // quizás el resultado es otra ruta parecida.
    const response = await apiNegocio.get(`/Solicitud/contrato/${cleanRef}`);
    return response.data;
  },
};
