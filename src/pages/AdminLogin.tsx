import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LOCAL_INFO } from "../config";

export default function AdminLogin() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(usuario, clave);
      navigate("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      
      {/* Fondo decorativo con luces difuminadas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-600/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        
        {/* Tarjeta del Formulario */}
        <form
          onSubmit={enviar}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl"
        >
          {/* Encabezado */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-400 mb-4">
              <span>🔒</span>
              <span>Panel de Administración</span>
            </div>

            <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black tracking-wider uppercase text-white">
              <span>🍒</span>
              <span>{LOCAL_INFO.nombre}</span>
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              Ingresá tus credenciales para acceder a la gestión
            </p>
          </div>

          {/* Campo Usuario */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-300">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                👤
              </span>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                🔑
              </span>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>
          </div>

          {/* Error Alerta */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-400">
              ⚠️ {error}
            </div>
          )}

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={cargando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition-all duration-200 hover:bg-rose-500 hover:shadow-rose-600/35 active:scale-98 disabled:cursor-wait disabled:opacity-60"
          >
            {cargando ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Ingresar al Panel</span>
            )}
          </button>
        </form>

        {/* Pie decorativo */}
        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {LOCAL_INFO.nombre} · Todos los derechos reservados
        </p>
      </div>

    </div>
  );
}