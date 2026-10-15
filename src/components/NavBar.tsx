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
    { id: "inicio", texto: "HOME" },
    { id: "productos", texto: "SHOP" },
    ...(HAY_CONTACTO ? [{ id: "contacto", texto: "CONTACTO" }] : []),
  ];

  const navegar = (id: string) => {
    setMenuAbierto(false);
    irA(id);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md text-white transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Izquierda: Enlaces de navegación (Escritorio) */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-8 md:flex md:w-1/3"
        >
          {enlaces.map((e) => (
            <button
              key={e.id}
              onClick={() => navegar(e.id)}
              className="text-xs font-bold tracking-widest text-slate-100 transition-colors hover:text-rose-300 uppercase"
            >
              {e.texto}
            </button>
          ))}
        </nav>

        {/* Centro: Logo de la tienda */}
        <div className="flex justify-start md:justify-center md:w-1/3">
          <button
            onClick={() => navegar("inicio")}
            className="flex items-center gap-2 text-2xl font-black tracking-widest text-white hover:opacity-90 transition-opacity uppercase"
          >
            <span>🍒</span>
            <span>{LOCAL_INFO.nombre}</span>
          </button>
        </div>

        {/* Derecha: Acciones (Búsqueda, Carrito, Menú móvil) */}
        <div className="flex items-center justify-end gap-5 md:w-1/3">
          
          {/* Botón de búsqueda estética */}
          <button
            type="button"
            aria-label="Buscar"
            className="text-slate-200 hover:text-white transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Botón de Carrito (Estilo circular flotante con badge menta) */}
          <button
            onClick={onAbrirCarrito}
            aria-label="Abrir carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white/25 active:scale-95"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>

            {cantidadTotal > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-slate-900 shadow-sm animate-pulse">
                {cantidadTotal}
              </span>
            )}
          </button>

          {/* Menú Hamburguesa (Mobile) */}
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-white hover:bg-white/10 md:hidden"
          >
            {menuAbierto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menú desplegable Móvil */}
      {menuAbierto && (
        <nav
          aria-label="Navegación móvil"
          className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-6 py-4 md:hidden flex flex-col gap-3 animate-fadeIn"
        >
          {enlaces.map((e) => (
            <button
              key={e.id}
              onClick={() => navegar(e.id)}
              className="w-full text-left py-2 text-sm font-bold tracking-widest text-slate-200 hover:text-rose-300 uppercase transition-colors"
            >
              {e.texto}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}