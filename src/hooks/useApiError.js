import { useState, useCallback } from "react";

export const useApiError = () => {
  const [error, setError] = useState(null);

  const handleApiError = useCallback((err) => {
    const errorFormatted = {
      message: err.message || "Error desconocido",
      code: err.code || "UNKNOWN",
      details: err.details || err.data,
      status: err.status,
      isDbError: err.isDbError || false,
    };
    setError(errorFormatted);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleApiError, clearError };
};