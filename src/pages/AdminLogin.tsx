import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-red-700">
          🏮 Lai Lai · Administración
        </h1>

        <label className="mb-1 block text-sm font-medium">Usuario</label>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-600"
          autoFocus
        />

        <label className="mb-1 block text-sm font-medium">Contraseña</label>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-600"
        />

        {error && (
          <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-red-700 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}