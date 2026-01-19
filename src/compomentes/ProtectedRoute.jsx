import { Navigate, useParams } from 'react-router';
import { useFlow } from './FlowContext';
export const ProtectedRoute = ({ children, step }) => {
  const { id } = useParams();
  const { canAccessStep, isValidId } = useFlow();

  if (!id || !isValidId(id) || !canAccessStep(id, step)) {
    console.warn("Acceso denegado: ID no válido o paso incorrecto");
    return <Navigate to="/" replace />; // Te expulsa de nuevo
  }

  return children;
};