import { AlertCircle, X } from "lucide-react";

// ==========================================
// COMPONENTE PARA MOSTRAR ERRORES
// ==========================================
const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md z-50 animate-slide-in">
      <div
        className={`rounded-lg shadow-lg p-4 ${error.isDbError
            ? "bg-yellow-50 border-l-4 border-yellow-500"
            : "bg-red-50 border-l-4 border-red-500"
          }`}
      >
        <div className="flex items-start">
          <AlertCircle
            className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${error.isDbError ? "text-yellow-600" : "text-red-600"
              }`}
          />

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-sm mb-1 ${error.isDbError ? "text-yellow-800" : "text-red-800"
                }`}
            >
              {error.isDbError ? "Error de Validación" : "Error de Conexión"}
            </h3>

            <p
              className={`text-sm break-words ${error.isDbError ? "text-yellow-700" : "text-red-700"
                }`}
            >
              {error.message}
            </p>

            {error.code && (
              <p
                className={`text-xs mt-2 font-mono ${error.isDbError ? "text-yellow-600" : "text-red-600"
                  }`}
              >
                Código: {error.code}
              </p>
            )}

            {error.details && (
              <details className="mt-2">
                <summary
                  className={`text-xs cursor-pointer ${error.isDbError ? "text-yellow-600" : "text-red-600"
                    } hover:underline`}
                >
                  Ver detalles técnicos
                </summary>
                <pre
                  className={`text-xs mt-2 p-2 rounded ${error.isDbError ? "bg-yellow-100" : "bg-red-100"
                    } overflow-auto max-h-40`}
                >
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${error.isDbError
                ? "text-yellow-600 hover:text-yellow-800"
                : "text-red-600 hover:text-red-800"
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
