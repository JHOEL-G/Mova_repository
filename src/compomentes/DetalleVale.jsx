import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { globalApi } from "../../services/globalApi";
import { useApiError } from "../hooks/useApiError";
import ErrorDisplay from "../hooks/ErrorDisplay ";
import { useFlow } from "./FlowContext";

export default function DetalleVale() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vale, setVale] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [apiError, setApiError] = useState(null); // ✅ NUEVO
  const { markStepComplete } = useFlow(); // ✅ QUITAMOS invalidateId
  const { error, handleApiError, clearError } = useApiError();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 8000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!id) return;

    globalApi
      .obtenerDetalleVale(id)
      .then((res) => {
        const respuestaApi = res.data;

        // ✅ CASO 1: Éxito total (error: 0)
        if (respuestaApi && respuestaApi.error === 0 && respuestaApi.data) {
          setVale(respuestaApi.data);
          setApiError(null);
          return;
        }

        // ⚠️ CASO 2: Error del backend PERO con datos parciales (error: 1)
        // Aquí cae tu referencia: 2-efc08f04-ecef-f011-b513-000c29ac7c09
        if (respuestaApi && respuestaApi.error === 1 && respuestaApi.data) {
          setVale(respuestaApi.data); // Guardamos los datos que SÍ vienen
          setApiError({
            tipo: 'api',
            mensaje: respuestaApi.resultado || 'Error al obtener información completa',
            codigo: respuestaApi.error
          });
          return;
        }

        // ❌ CASO 3: Error sin datos
        setVale(null);
        setApiError({
          tipo: 'sin_datos',
          mensaje: 'No se encontró información con esta referencia'
        });
      })
      .catch((err) => {
        console.error("❌ Error de red:", err);
        handleApiError(err);
        setApiError({
          tipo: 'red',
          mensaje: 'Error de conexión. Intenta de nuevo.'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, handleApiError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#282195]"></div>
      </div>
    );
  }

  // ⚠️ PANTALLA ESPECIAL: Error del API con datos parciales
  // Se muestra cuando error: 1 pero sí hay data
  if (apiError?.tipo === 'api') {
    return (
      <>
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden">
            {/* Header de advertencia */}
            <div className="bg-amber-500 p-6 text-white text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold">Proceso Incompleto</h1>
              <p className="text-amber-100 text-xs mt-2 break-all uppercase">
                REF: {id}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Mensaje de error del backend */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <p className="text-sm text-amber-800 font-semibold mb-2">
                  {apiError.mensaje}
                </p>
                <p className="text-xs text-amber-700">
                  Los datos de tu solicitud están incompletos en el sistema.
                </p>
              </div>

              {/* Mostrar la leyenda si existe */}
              {vale?.leyenda && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: vale.leyenda }}
                  />
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📞</span> ¿Qué hacer?
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>
                      Contacta a tu agente de servicios:{" "}
                      <strong className="text-[#282195]">LUCIA ARIZMENDI CARDIEL</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>
                      Proporciona tu referencia:{" "}
                      <code className="bg-gray-200 px-2 py-1 rounded text-xs break-all">
                        {id}
                      </code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Espera confirmación para continuar con el proceso</span>
                  </li>
                </ul>
              </div>

              {/* Botones */}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#282195] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                🔄 RECARGAR PÁGINA
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
              >
                ← VOLVER AL INICIO
              </button>
            </div>
          </div>
        </div>
        <ErrorDisplay error={error} onClose={clearError} />
      </>
    );
  }

  // ❌ PANTALLA: No hay datos en absoluto
  if (!vale || apiError?.tipo === 'sin_datos') {
    return (
      <>
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
          <div className="text-center p-10">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Referencia No Encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              {apiError?.mensaje || "No se obtuvo información con la referencia proporcionada."}
            </p>
            <p className="text-sm text-gray-500 mb-6 break-all">
              REF: {id}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#282195] text-white font-bold py-3 px-8 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              VOLVER AL INICIO
            </button>
          </div>
        </div>
        <ErrorDisplay error={error} onClose={clearError} />
      </>
    );
  }
  const esSoloLeyenda =
    id.startsWith("2") || id.startsWith("3") || id.startsWith("4");

  const manejarConfirmacion = () => {
    console.log("🔍 Marcando paso como completo:", id);

    // Marca el paso actual como completo
    markStepComplete(id, "detalleVale");

    if (esSoloLeyenda) {
      console.log("✅ Es solo leyenda, redirigiendo a captura-ine");
      // Para referencias que empiezan con 2, 3 o 4
      markStepComplete(id, "capturaINE");

      // Pequeño delay para asegurar que el contexto se actualice
      setTimeout(() => {
        navigate(`/captura-ine/${id}`);
      }, 100);
    } else {
      console.log("✅ Redirigiendo a formulario");
      // Pequeño delay para asegurar que el contexto se actualice
      setTimeout(() => {
        navigate(`/formulario/${id}`);
      }, 100);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-[#282195] p-6 text-white text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Logo Mova" className="h-12 w-auto" />
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {esSoloLeyenda ? "Firma de Contrato" : "Detalle de Vale"}
            </h1>
            <p className="text-blue-200 text-xs mt-1 break-all uppercase opacity-80">
              REF: {id}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {!esSoloLeyenda && (
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-3 items-center">
                  <span className="text-gray-500 font-medium text-sm">
                    Monto:
                  </span>
                  <span className="font-bold text-xl text-gray-900">
                    $
                    {Number(vale.monto).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3 items-center">
                  <span className="text-gray-500 font-medium text-sm">
                    Plazos:
                  </span>
                  <span className="font-bold text-gray-900">{vale.plazos}</span>
                </div>

                {vale.plazoTipo && (
                  <div className="flex justify-between border-b pb-3 items-center">
                    <span className="text-gray-500 font-medium text-sm">
                      Tipo de Plazo:
                    </span>
                    <span className="font-bold text-[#282195] text-xs uppercase text-right">
                      {vale.plazoTipo}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b pb-3 items-center">
                  <span className="text-gray-500 font-medium text-sm">
                    Seguro:
                  </span>
                  <span className="font-bold text-gray-900">
                    $
                    {Number(vale.seguro).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {vale.fechaPrimerPago && (
                  <div className="flex justify-between border-b pb-3 items-center">
                    <span className="text-gray-500 font-medium text-sm">
                      Fecha:
                    </span>
                    <span className="font-bold text-gray-900">
                      {new Date(vale.fechaPrimerPago).toLocaleDateString(
                        "es-MX"
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              {vale.leyenda ? (
                <div
                  className="text-sm text-gray-700 leading-relaxed dynamic-html"
                  dangerouslySetInnerHTML={{ __html: vale.leyenda }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic text-center">
                  Información autorizada.
                </p>
              )}
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={manejarConfirmacion}
                className="w-full bg-[#282195] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                SÍ, ES CORRECTA
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
              >
                NO
              </button>
            </div>
          </div>
        </div>
      </div>

      <ErrorDisplay error={error} onClose={clearError} />

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
