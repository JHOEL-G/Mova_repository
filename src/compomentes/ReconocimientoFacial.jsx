/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle, RotateCcw } from "lucide-react";
import { globalApi } from "../../services/globalApi";
import { data, useLocation, useNavigate, useParams } from "react-router";

export default function ReconocimientoFacial() {
  const [step, setStep] = useState(1);
  const [stream, setStream] = useState(null);
  const [capturedFace, setCapturedFace] = useState(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionScore, setRecognitionScore] = useState(null);
  const [recognitionMessage, setRecognitionMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputSelfieRef = useRef(null);
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [fotoIneFrontal] = useState(() => {
    return (
      location.state?.fotoIneFrontal || localStorage.getItem(`fotoIne_${id}`)
    );
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Validación de datos iniciales
  useEffect(() => {
    if (!fotoIneFrontal) {
      alert("La sesión expiró. Por favor, captura tu INE de nuevo.");
      navigate(-1);
    }
  }, [fotoIneFrontal, navigate]);

  // Manejo de la cámara y asignación al elemento video
  useEffect(() => {
    if (step === 3 && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;

      const playVideo = async () => {
        try {
          await video.play();
          setCameraActive(true);
        } catch (err) {
          console.error("Error al reproducir video:", err);
        }
      };
      playVideo();
    }
  }, [step, stream]);

  // Limpieza del stream al desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const requestCameraAccess = async () => {
    setIsLoadingCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      setIsLoadingCamera(false);
      setStep(3); // Saltamos directamente al paso 3 (Cámara)
    } catch (error) {
      setIsLoadingCamera(false);
      alert("Error al acceder a la cámara frontal. Asegúrate de dar permisos.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // ⬆️ Aumentar calidad de 0.4 a 0.8
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedFace(imageData);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCameraActive(false);
      processValidation(imageData);
    }
  };

  const redimensionarYConvertirAPNG = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Bajamos a 600px, suficiente para reconocimiento facial
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Usamos JPEG internamente con calidad 0.6 para bajar el peso drásticamente,
        // pero devolvemos el string base64.
        // Si el servidor EXIGE que el header diga png, lo cambiamos después.
        const comprimida = canvas.toDataURL("image/jpeg", 0.6);
        const base64Final = comprimida.replace("image/jpeg", "image/png");

        resolve(base64Final);
      };
    });
  };

  const handleGallerySelfie = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedFace(dataUrl);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      processValidation(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processValidation = async (selfieData) => {
    setStep(4);
    setIsProcessing(true);

    try {
      // 1. Validar con biometría
      const resultado = await globalApi.validarIneSelfie(
        fotoIneFrontal,
        selfieData,
        id
      );

      // Verificamos si la validación biométrica fue exitosa
      if (resultado.error !== 0) {
        alert(
          `Error en biometría: ${resultado.resultado || "No se pudo validar"}`
        );
        setStep(1);
        return;
      }

      const validacionData = resultado.data?.[0] || {};
      const reversoBase64 = localStorage.getItem(`fotoIneReverso_${id}`);

      // --- IMPORTANTE: Recuperar el OCR completo del paso anterior ---
      // Asegúrate de que en el componente de la INE Frontal guardaste el JSON de Adriana así:
      // localStorage.setItem(`ocrData_${id}`, JSON.stringify(respuestaDelServicioOCR));

      console.log("Compimiendo imágenes...");
      const anversoPng = await redimensionarYConvertirAPNG(fotoIneFrontal);
      const reversoPng = reversoBase64
        ? await redimensionarYConvertirAPNG(reversoBase64)
        : "";
      const selfiePng = await redimensionarYConvertirAPNG(selfieData);
      const ocrAlmacenado = localStorage.getItem(`ocrData_${id}`);

      // 2. Construir el Body con los JSON completos como strings
      const datosRegistro = {
        // Enviamos el JSON de Adriana completo que recuperamos del storage
        ocrResponse: ocrAlmacenado,

        // Enviamos el objeto 'resultado' completo de biometría serializado
        biometricoResponse: JSON.stringify(resultado),

        ineAnversoPath: anversoPng,
        ineReversoPath: reversoPng,
        clientePath: selfiePng,
      };

      // LOG PARA VERIFICAR ANTES DE ENVIAR
      console.log("🚀 BODY FINAL A ENVIAR:", datosRegistro);

      console.log("📤 Payload optimizado:", {
        anversoSize: datosRegistro.ineAnversoPath.length,
        selfieSize: datosRegistro.clientePath.length,
        ocrLength: datosRegistro.ocrResponse?.length || 0,
      });

      // 3. Enviar al registro final
      const registroResponse = await globalApi.registrarBiometricos(
        datosRegistro,
        id
      );

      setRecognitionScore(validacionData.similitud?.toFixed(2) || 0);
      setRecognitionMessage(validacionData.mensaje || "Validación completada");
      setStep(5);
    } catch (error) {
      console.error("❌ Error en el proceso:", error);
      // Log detallado de la respuesta del servidor en caso de 400
      if (error.response) {
        console.log("Detalle 400 del servidor:", error.response.data);
      }
      const errorServidor = error.response?.data?.resultado || error.message;
      alert(`Error de Registro:\n${errorServidor}`);
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      {/* Header - Z-index alto pero no bloqueante */}
      <header className="absolute top-0 inset-x-0 bg-white/10 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="text-orange-500 text-2xl font-bold italic">m~</div>
          <span className="text-white font-semibold text-xl tracking-tight">
            mova
          </span>
        </div>
        <span className="text-gray-300 text-xs font-mono">v 1.24.23.0</span>
      </header>

      <main className="flex-1 relative flex items-center justify-center">
        {/* VIDEO SIEMPRE EN Z-0 */}
        {step === 3 && (
          <div className="absolute inset-0 bg-black z-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover mirror"
              autoPlay
              playsInline
              muted
            />

            {/* --- ESCÁNER PANTALLA COMPLETA --- */}
            {/* Se eliminó el recuadro w-72 h-80 y las esquinas blancas */}
            <div className="absolute inset-0 flex flex-col justify-start pointer-events-none overflow-hidden">
              {/* Esta línea ahora recorre todo el ancho y alto del viewport */}
              <div className="w-full h-[3px] bg-indigo-400 shadow-[0_0_20px_#818cf8] animate-[scan_3.5s_ease-in-out_infinite] opacity-70" />

              {/* Overlay sutil para mejorar la estética del escaneo */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-indigo-500/10" />
            </div>

            {/* Controles de Cámara */}
            <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-6 z-10">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => fileInputSelfieRef.current?.click()}
                  className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraActive}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                >
                  <div className="w-16 h-16 bg-indigo-900 rounded-full" />
                </button>
                <div className="w-12" />
              </div>
              <p className="text-white text-[10px] font-black tracking-widest uppercase bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
                Posiciona tu rostro en el centro
              </p>
            </div>
          </div>
        )}

        {/* MODALES EN Z-50 (Mismo comportamiento) */}
        {(step === 1 || step === 4 || step === 5) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full text-center">
              {step === 1 && (
                <>
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="text-indigo-900 w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-2">
                    Verificación Facial
                  </h2>
                  <p className="text-gray-500 mb-8 text-sm">
                    Necesitamos una selfie para validar tu identidad.
                  </p>
                  <button
                    onClick={requestCameraAccess}
                    className="w-full bg-indigo-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    {isLoadingCamera ? "Iniciando..." : "Comenzar ahora"}
                  </button>
                </>
              )}

              {step === 4 && (
                <div className="py-6">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-900 mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-gray-800">
                    Procesando biometría
                  </h2>
                  <p className="text-gray-400 text-xs mt-2">
                    Comparando rasgos faciales...
                  </p>
                </div>
              )}

              {step === 5 && (
                <>
                  <div className="relative inline-block mb-6">
                    <img
                      src={capturedFace}
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-indigo-50 shadow-xl"
                      alt="Selfie"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">
                    {recognitionMessage}
                  </h2>
                  <p className="text-indigo-600 font-bold text-lg mb-8">
                    {recognitionScore}% de similitud
                  </p>
                  <button
                    onClick={() => navigate(`/vista/${id}`)}
                    className="w-full bg-indigo-900 text-white font-bold py-4 rounded-2xl shadow-lg"
                  >
                    Finalizar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <input
        type="file"
        accept="image/*"
        ref={fileInputSelfieRef}
        onChange={handleGallerySelfie}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        .mirror { transform: scaleX(-1); }
        @keyframes scan {
          0% { transform: translateY(-5vh); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(105vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
