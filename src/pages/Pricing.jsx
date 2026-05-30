// @ts-nocheck
import { Navigate } from 'react-router-dom';

/** In-app pricing moved to public /pricing (outside AppLayout). */
export default function Pricing() {
  return <Navigate to="/pricing" replace />;
}
