import { useCallback, useEffect, useRef, useState } from "react";
import type { Producto } from "../types";
import { useCarrito } from "../context/CarritoContext";
import { formatearPrecio } from "../utils/formato";

interface Props {
  producto: Producto;
  onCerrar: () => void;
  onVerCarrito: () => void;
}

export default function ProductoDetalle({
  producto,
  onCerrar,
  onVerCarrito,
}: Props) {
  const [indice, setIndice] = useState(0);
  const toqueX = useRef<number | null>(null);
  const { items, agregar } = useCarrito();

  const imagenes = producto.imagenes ?? [];
  const total = imagenes.length;
  const enCarrito =
    items.find((i) => i.productoId === producto.id)?.cantidad ?? 0;
  const sinStock = producto.stock === 0;
  const alLimite = enCarrito >= producto.stock;
  const pocoStock = producto.stock > 0 && producto.stock <= 5;

  const mover = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndice((i) => (i + delta + total) % total);
    },
    [total]
  );

  // Teclado (← → Esc) y bloqueo del scroll de fondo mientras está abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    window.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar, mover]);

  // Deslizar con el dedo en el celular
  const alTocar = (e: React.TouchEvent) => {
    toqueX.current = e.touches[0].clientX;
  };
  const alSoltar = (e: React.TouchEvent) => {
    if (toqueX.current === null) return;
    const delta = e.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (Math.abs(delta) > 50) mover(delta > 0 ? -1 : 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.nombre}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 md:flex-row md:overflow-hidden"
      >
        {/* Botón de cierre */}
        <button
          onClick={onCerrar}
          aria-label="Cerrar modal"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-md transition-all hover:bg-slate-900 hover:text-white hover:scale-105"
        >
          ✕
        </button>

        {/* Columna Izquierda: Galería y Carrusel */}
        <div className="flex flex-col md:w-1/2 bg-slate-50">
          <div
            className="relative aspect-square w-full select-none overflow-hidden bg-slate-100 flex items-center justify-center"
            onTouchStart={alTocar}
            onTouchEnd={alSoltar}
          >
            {total === 0 ? (
              <div className="flex h-full items-center justify-center text-7xl opacity-40">
                🍒
              </div>
            ) : (
              <img
                src={imagenes[indice]}
                alt={`${producto.nombre} foto ${indice + 1}`}
                className="h-full w-full object-cover transition-all duration-300"
                draggable={false}
              />
            )}

            {/* Badges Flotantes sobre la Imagen */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md shadow-xs ${
                  sinStock
                    ? "bg-slate-900/80 text-white"
                    : pocoStock
                    ? "bg-amber-500/90 text-white"
                    : "bg-emerald-500/90 text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    sinStock
                      ? "bg-slate-300"
                      : pocoStock
                      ? "bg-amber-200 animate-pulse"
                      : "bg-emerald-200"
                  }`}
                />
                {sinStock ? "Sin stock" : pocoStock ? `¡Últimas ${producto.stock}! ` : "Disponible"}
              </span>
            </div>

            {/* Controles del Carrusel */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                >
                  ›
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                  {indice + 1} / {total}
                </span>
              </>
            )}
          </div>

          {/* Miniaturas de la Galería */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto p-4 bg-white border-t border-slate-100">
              {imagenes.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    i === indice
                      ? "border-rose-500 shadow-sm scale-105"
                      : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información y Acciones */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 md:w-1/2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
              {producto.categoria}
            </span>

            <h2 className="mt-2 pr-8 text-2xl sm:text-3xl font-black text-slate-900">
              {producto.nombre}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {producto.descripcion || "Sin descripción disponible para este producto."}
            </p>

            <div className="mt-6 flex items-baseline gap-4 border-t border-b border-slate-100 py-4">
              <span className="text-3xl font-black text-slate-900">
                {formatearPrecio(producto.precio)}
              </span>
            </div>
          </div>

          {/* Bloque de compra e interacción con carrito */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => agregar(producto)}
              disabled={sinStock || alLimite}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 px-6 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-rose-600 hover:shadow-rose-600/20 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {sinStock ? (
                "Producto No Disponible"
              ) : alLimite ? (
                "Stock máximo alcanzado"
              ) : (
                <>
                  <span>🛒</span>
                  <span>Agregar al carrito</span>
                </>
              )}
            </button>

            {/* Aviso de unidades agregadas */}
            {enCarrito > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  ✓ En tu carrito: {enCarrito} {enCarrito === 1 ? "unidad" : "unidades"}
                </span>
                <button
                  type="button"
                  onClick={onVerCarrito}
                  className="font-extrabold text-emerald-900 hover:underline uppercase tracking-wider text-[11px]"
                >
                  Ver Carrito ↗
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}