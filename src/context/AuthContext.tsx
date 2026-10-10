import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  borrarToken,
  EVENTO_SESION_VENCIDA,
  guardarToken,
  obtenerToken,
} from "../services/api";

interface AuthCtx {
  esAdmin: boolean;
  login: (usuario: string, clave: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage: la sesión se cierra sola al cerrar la pestaña
  const [esAdmin, setEsAdmin] = useState(() => obtenerToken() !== null);

  useEffect(() => {
    const alVencer = () => setEsAdmin(false);
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);

    // Si había una sesión guardada, confirmamos que el servidor la acepta
    if (obtenerToken()) {
      api("/auth/verificar", { auth: true }).catch(() => {});
    }

    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, []);

  // Lanza un error con el mensaje del servidor si las credenciales no sirven
  const login = async (usuario: string, clave: string) => {
    const { token } = await api<{ token: string }>("/auth/login", {
      metodo: "POST",
      cuerpo: { usuario, clave },
    });
    guardarToken(token);
    setEsAdmin(true);
  };

  const logout = () => {
    borrarToken();
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