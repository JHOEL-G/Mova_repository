/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { CheckCircle, Loader2, Camera, Upload } from "lucide-react";
import { globalApi } from "../../services/globalApi";
import { useNavigate, useParams } from "react-router";
import imageCompression from "browser-image-compression";

export default function CapturaINE() {
  const [step, setStep] = useState(1);
  const [fotoIneFrontal, setFotoIneFrontal] = useState(null);
  const [fotoIneReverso, setFotoIneReverso] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    stopStream();
    setError(null);
    setCameraReady(false);

    // CÁMARA TRASERA POR DEFECTO
    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 }, // Pedimos resolución alta para mejor nitidez
        height: { ideal: 1080 },
        aspectRatio: { ideal: 1.7777777778 }, // Forzamos 16:9 que es lo estándar
      },
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
        setStream(mediaStream);
      }
    } catch (err) {
      console.warn("Cámara trasera no disponible, intentando fallback:", err);
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = fallback;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
          };
          setStream(fallback);
        }
      } catch (fallbackErr) {
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
        console.error(fallbackErr);
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true); // Opcional: mostrar un loader mientras procesa la imagen
    try {
      const compressedDataUrl = await compressImage(file);

      if (step === 2) {
        setFotoIneFrontal(compressedDataUrl);
        setStep(3);
      } else if (step === 3) {
        setFotoIneReverso(compressedDataUrl);
        stopStream();
      }
    } catch (err) {
      setError("Error al procesar la imagen seleccionada.");
    } finally {
      setIsProcessing(false);
    }
  };

  const optimizeImageForOCR = (dataUrl, callback) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1200;
      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, width, height);

      const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      console.log("Original length:", dataUrl.length);
      console.log("Optimized length:", optimizedDataUrl.length);

      callback(optimizedDataUrl);
    };
  };

  const compressImage = async (fileOrDataUrl) => {
    let file;

    if (typeof fileOrDataUrl === "string") {
      const response = await fetch(fileOrDataUrl);
      const blob = await response.blob();
      file = new File([blob], "imagen.jpg", { type: "image/jpeg" });
    } else {
      file = fileOrDataUrl;
    }

    const options = {
      maxSizeMB: 1.5, // ⬆️ Aumentado de 1 a 1.5 MB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.9, // ⬆️ Aumentado de 0.8 a 0.9
      fileType: "image/jpeg",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
      console.error("Error comprimiendo:", error);
      return fileOrDataUrl;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL("image/jpeg");

    const compressedDataUrl = await compressImage(rawDataUrl);

    if (step === 2) {
      setFotoIneFrontal(compressedDataUrl);
      setStep(3);
    } else if (step === 3) {
      setFotoIneReverso(compressedDataUrl);
      stopStream();
    }
  };

  const procesarOCR = async () => {
    if (!fotoIneFrontal || !fotoIneReverso) return;

    setIsProcessing(true);
    setError(null);
    setStep(4);

    try {
      const resultado = await globalApi.validarIdentidad(
        fotoIneFrontal,
        fotoIneReverso,
        id || "temp_ref"
      );

      console.log("OCR exitoso:", resultado);
      localStorage.setItem(`ocrData_${id}`, JSON.stringify(resultado));
      setStep(5);
    } catch (err) {
      console.error("Error en OCR:", err);
      const msg =
        err.response?.data?.resultado ||
        err.message ||
        "No se pudo validar la INE. Verifica las fotos.";
      setError(msg);
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (fotoIneFrontal && fotoIneReverso && !isProcessing) {
      procesarOCR();
    }
  }, [fotoIneFrontal, fotoIneReverso]);

  useEffect(() => {
    if (step === 2 || step === 3) {
      startCamera();
    }
    return () => stopStream();
  }, [step]);

  const reintentarCaptura = () => {
    setError(null);
    if (step === 3 || step === 4) {
      setFotoIneReverso(null);
      setStep(3);
    } else {
      setFotoIneFrontal(null);
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F9FC] flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {step === 1 && (
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Validación de INE
            </h2>
            <p className="text-gray-600 mb-8">
              Prepara tu identificación oficial para capturar ambos lados.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-[#2D2296] text-white py-4 px-8 rounded-xl font-bold shadow-lg"
            >
              COMENZAR
            </button>
          </div>
        )}

        {(step === 2 || step === 3) && (
          <div className="w-full h-full flex flex-col p-4">
            <h2 className="text-lg font-bold text-[#2D2296] mb-2">
              {step === 2 ? "Captura el FRENTE" : "Captura el REVERSO"} de tu
              INE
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Coloca la INE en el centro, bien iluminada y sin reflejos.
            </p>

            {/* ✅ VIDEO COMPACTO SIN GUÍA */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg mb-4 h-[45vh]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="space-y-3 mt-auto">
              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-full bg-[#2D2296] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] transition-all"
              >
                <Camera className="w-5 h-5" />
                {cameraReady ? "CAPTURAR CON CÁMARA" : "Preparando cámara..."}
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full bg-white text-[#2D2296] border-2 border-[#2D2296] py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
              >
                <Upload className="w-5 h-5" />
                SUBIR FOTO DESDE DISPOSITIVO
              </button>
            </div>

            {step === 3 && fotoIneFrontal && (
              <button
                onClick={() => {
                  setFotoIneFrontal(null);
                  setStep(2);
                }}
                className="mt-3 text-blue-600 underline text-sm"
              >
                ← Cambiar foto del frente
              </button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <Loader2 className="animate-spin w-20 h-20 text-[#F29100] mx-auto mb-8" />
            <h2 className="text-2xl font-bold text-gray-800">
              Validando tu INE...
            </h2>
            <p className="text-gray-600 mt-4">Esto puede tomar unos segundos</p>
          </div>
        )}

        {step === 5 && (
          <div className="text-center max-w-md">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ¡INE Validada Correctamente!
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Frente</p>
                <img
                  src={fotoIneFrontal}
                  alt="Frente"
                  className="w-full rounded-lg border-4 border-green-500 shadow-md"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Reverso
                </p>
                <img
                  src={fotoIneReverso}
                  alt="Reverso"
                  className="w-full rounded-lg border-4 border-green-500 shadow-md"
                />
              </div>
            </div>
            <button
              onClick={() => {
                // ✅ Guardamos ambas fotos en localStorage antes de navegar
                if (fotoIneFrontal) {
                  localStorage.setItem(`fotoIne_${id}`, fotoIneFrontal);
                }
                if (fotoIneReverso) {
                  // ESTA ES LA CLAVE: Debe coincidir con el nombre que busca el otro componente
                  localStorage.setItem(`fotoIneReverso_${id}`, fotoIneReverso);
                }

                navigate(`/reconocimiento/${id}`, {
                  state: { fotoIneFrontal },
                });
              }}
              className="w-full bg-[#2D2296] text-white py-5 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all text-lg"
            >
              CONTINUAR PROCESO
            </button>
          </div>
        )}

        {error && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 text-center">
            <p className="font-medium">{error}</p>
            <button
              onClick={reintentarCaptura}
              className="mt-2 underline font-bold"
            >
              Reintentar captura
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
