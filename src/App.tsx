import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CarritoProvider } from "./context/CarritoContext";
import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";
import Tienda from "./pages/Tienda";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import Comprobante from "./pages/comprobante";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <Routes>
            <Route path="/" element={<Tienda />} />
            <Route path="/comprobante/:id" element={<Comprobante />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RutaProtegida>
                  <Admin />
                </RutaProtegida>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}