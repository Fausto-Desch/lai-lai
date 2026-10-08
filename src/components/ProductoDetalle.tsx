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

  const imagenes = producto.imagenes;
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

  const flecha =
    "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl shadow hover:bg-white";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.nombre}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full w-full max-w-4xl flex-col overflow-y-auto rounded-2xl bg-white shadow-xl md:flex-row"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl shadow hover:bg-white"
        >
          ×
        </button>

        {/* Carrusel */}
        <div className="md:w-1/2">
          <div
            className="relative aspect-square select-none bg-red-50"
            onTouchStart={alTocar}
            onTouchEnd={alSoltar}
          >
            {total === 0 ? (
              <div className="flex h-full items-center justify-center text-8xl">
                🏮
              </div>
            ) : (
              <img
                src={imagenes[indice]}
                alt={`${producto.nombre} - foto ${indice + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            )}

            {total > 1 && (
              <>
                <button
                  onClick={() => mover(-1)}
                  aria-label="Foto anterior"
                  className={`${flecha} left-2`}
                >
                  ‹
                </button>
                <button
                  onClick={() => mover(1)}
                  aria-label="Foto siguiente"
                  className={`${flecha} right-2`}
                >
                  ›
                </button>
                <span className="absolute bottom-2 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {indice + 1}/{total}
                </span>
              </>
            )}
          </div>

          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {imagenes.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setIndice(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === indice
                      ? "border-red-700"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="flex flex-1 flex-col gap-3 p-6 md:w-1/2">
          <span className="text-xs font-medium uppercase tracking-wide text-red-700">
            {producto.categoria}
          </span>
          <h2 className="pr-8 text-2xl font-bold text-gray-900">
            {producto.nombre}
          </h2>
          <p className="text-gray-600">
            {producto.descripcion || "Sin descripción."}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatearPrecio(producto.precio)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                sinStock
                  ? "bg-gray-200 text-gray-600"
                  : pocoStock
                  ? "bg-amber-100 text-amber-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {sinStock ? "Sin stock" : `Stock: ${producto.stock}`}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <button
              onClick={() => agregar(producto)}
              disabled={sinStock || alLimite}
              className="rounded-lg bg-red-700 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {sinStock
                ? "No disponible"
                : alLimite
                ? "Ya agregaste todo el stock"
                : "Agregar al carrito"}
            </button>

            {enCarrito > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">
                  ✓ En tu carrito: {enCarrito}{" "}
                  {enCarrito === 1 ? "unidad" : "unidades"}
                </span>
                <button
                  onClick={onVerCarrito}
                  className="font-medium text-red-700 hover:underline"
                >
                  Ir al carrito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}