import { useState } from "react";
import { HAY_CONTACTO, LOCAL_INFO } from "../config";
import { irA } from "../utils/scrolls";

interface Props {
  cantidadTotal: number;
  onAbrirCarrito: () => void;
}

export default function Navbar({ cantidadTotal, onAbrirCarrito }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { id: "inicio", texto: "Inicio" },
    { id: "productos", texto: "Productos" },
    ...(HAY_CONTACTO ? [{ id: "contacto", texto: "Contacto" }] : []),
  ];

  const navegar = (id: string) => {
    setMenuAbierto(false);
    irA(id);
  };

  const enlace =
    "rounded-lg px-3 py-2 font-medium transition hover:bg-white/10";

  return (
    <header className="sticky top-0 z-30 bg-red-700 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <button
          onClick={() => navegar("inicio")}
          className="text-xl font-bold"
        >
          🏮 {LOCAL_INFO.nombre}
        </button>

        {/* Links (escritorio) */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 md:flex"
        >
          {enlaces.map((e) => (
            <button
              key={e.id}
              onClick={() => navegar(e.id)}
              className={enlace}
            >
              {e.texto}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onAbrirCarrito}
            className="relative rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
          >
            🛒 <span className="hidden sm:inline">Carrito</span>
            {cantidadTotal > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-red-900">
                {cantidadTotal}
              </span>
            )}
          </button>

          {/* Botón hamburguesa (celular) */}
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="rounded-lg px-3 py-2 text-xl hover:bg-white/10 md:hidden"
          >
            {menuAbierto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menú desplegable (celular) */}
      {menuAbierto && (
        <nav
          aria-label="Navegación principal"
          className="border-t border-white/20 bg-red-800 px-4 py-2 md:hidden"
        >
          {enlaces.map((e) => (
            <button
              key={e.id}
              onClick={() => navegar(e.id)}
              className={`${enlace} block w-full text-left`}
            >
              {e.texto}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}