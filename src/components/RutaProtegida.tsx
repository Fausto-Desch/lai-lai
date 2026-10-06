import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children }: { children: ReactNode }) {
  const { esAdmin } = useAuth();
  return esAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
}