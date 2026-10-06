import { createContext, useContext, useState, type ReactNode } from "react";
import { ADMIN_USUARIO, ADMIN_CLAVE } from "../config";

const KEY = "lai-lai-admin-sesion";

interface AuthCtx {
  esAdmin: boolean;
  login: (usuario: string, clave: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage: la sesión se cierra sola al cerrar la pestaña
  const [esAdmin, setEsAdmin] = useState(
    () => sessionStorage.getItem(KEY) === "1"
  );

  const login = (usuario: string, clave: string) => {
    if (usuario === ADMIN_USUARIO && clave === ADMIN_CLAVE) {
      sessionStorage.setItem(KEY, "1");
      setEsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(KEY);
    setEsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ esAdmin, login, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}