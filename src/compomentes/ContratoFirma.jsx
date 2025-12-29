import React from "react";

export default function ContratoFirma() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="text-orange-500 text-2xl font-bold">
            <span className="italic">m</span>
            <span className="text-orange-400">~</span>
          </div>
          <span className="text-gray-800 font-semibold text-xl">mova</span>
        </div>
        <span className="text-gray-400 text-sm">v 1.24.23.0</span>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Firma Contrato
          </h1>

          {/* Reference */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Referencia:</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              2-BAB2E937-9227-404C-93E5-709FE95CA209
            </p>
          </div>

          {/* Main Text */}
          <div className="mb-6 text-sm text-gray-700 leading-relaxed">
            <p className="mb-4">
              Estimad@ soci@ MOVA{" "}
              <span className="font-semibold">
                ARTURO EDUARDO FAVELA GODINA
              </span>
              . Tu línea de crédito quedó autorizada. Enseguida se inicia el
              proceso de formalización mediante la recolección de firmas, para
              ello es necesario que tú y los avales realicen la firma de
              contrato en el siguiente orden.
            </p>
          </div>

          {/* Signer List */}
          <div className="mb-8 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                1 - ARTURO EDUARDO FAVELA GODINA
              </span>
            </p>
          </div>

          {/* Notice */}
          <div className="mb-8 text-sm text-gray-600 leading-relaxed">
            <p>
              Al finalizar la última firma se te notificará por sms y el agente
              de servicios <span className="font-semibold">Juan Perez</span> te
              contactará para realizar el proceso de primer canje.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Sí, es correcta
            </button>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              No
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
