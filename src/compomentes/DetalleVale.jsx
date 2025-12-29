import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { globalApi } from "../../services/globalApi";

export default function DetalleVale() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vale, setVale] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;

    globalApi
      .obtenerDetalleVale(id)
      .then((res) => {
        const respuestaApi = res.data;
        if (respuestaApi && respuestaApi.error === 0 && respuestaApi.data) {
          setVale(respuestaApi.data);
        } else {
          setVale(null);
        }
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        setVale(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#282195]"></div>
      </div>
    );

  if (!vale)
    return (
      <div className="text-center p-10 text-red-500 font-bold">
        No se obtuvo información con la referencia proporcionada.
      </div>
    );

  // Lógica de discriminación de ID
  const esSoloLeyenda =
    id.startsWith("2") || id.startsWith("3") || id.startsWith("4");

  // NUEVA FUNCIÓN: Navegación inteligente
  const manejarConfirmacion = () => {
    if (esSoloLeyenda) {
      // Si es ID 2, 3 o 4 va directo al reconocimiento de INE
      navigate(`/captura-ine/${id}`);
    } else {
      // Si es ID 1 va al formulario
      navigate(`/formulario/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-[#282195] p-6 text-white text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {esSoloLeyenda ? "Firma de Contrato" : "Detalle de Vale"}
          </h1>
          <p className="text-blue-200 text-xs mt-1 break-all uppercase opacity-80">
            REF: {id}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* SECCIÓN FINANCIERA: Se oculta totalmente para ID 2, 3 y 4 */}
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
                    {new Date(vale.fechaPrimerPago).toLocaleDateString("es-MX")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CUADRO DE LEYENDA: Lo único que se muestra en ID 2, 3 y 4 */}
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
  );
}
