import type { KeyboardEvent } from "react";
import type { Producto } from "../types";
import { formatearPrecio } from "../utils/formato";

interface Props {
  producto: Producto;
  onAgregar: (p: Producto) => void;
  onVer: (p: Producto) => void;
}

/** Tarjeta de producto para la grilla: portada, datos básicos y botón de compra. */
export default function ProductCard({ producto, onAgregar, onVer }: Props) {
  // Datos derivados
  const sinStock = producto.stock === 0;
  const pocoStock = producto.stock > 0 && producto.stock <= 5;
  const imagenes = producto.imagenes ?? [];
  const portada = imagenes[0];

  /** Permite abrir el detalle con Enter o Espacio (accesibilidad). */
  const abrirConTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onVer(producto);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      {/* Área interactiva: imagen e información */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${producto.nombre}`}
        onClick={() => onVer(producto)}
        onKeyDown={abrirConTeclado}
        className="flex flex-1 cursor-pointer flex-col rounded-t-2xl outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        {/* Imagen de portada */}
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-slate-50">
          {portada ? (
            <img
              src={portada}
              alt={producto.nombre}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl opacity-40">🍒</span>
          )}

          {/* Badge de stock (esquina superior izquierda) */}
          <div className="absolute left-3 top-3 z-10">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md ${
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
                      ? "animate-pulse bg-amber-200"
                      : "bg-emerald-200"
                }`}
              />
              {sinStock
                ? "Sin stock"
                : pocoStock
                  ? `¡Últimas ${producto.stock}! `
                  : "Disponible"}
            </span>
          </div>

          {/* Contador de fotos (esquina inferior derecha) */}
          {imagenes.length > 1 && (
            <span className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-md">
              📷 {imagenes.length}
            </span>
          )}
        </div>

        {/* Detalles del producto */}
        <div className="flex flex-1 flex-col p-5 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
            {producto.categoria}
          </span>

          <h3 className="mt-1 line-clamp-1 text-base font-extrabold text-slate-900 transition-colors group-hover:text-rose-600">
            {producto.nombre}
          </h3>

          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
            {producto.descripcion}
          </p>

          <div className="mt-4 flex items-baseline justify-between border-t border-slate-50 pt-3">
            <div>
              <span className="block text-xs font-medium text-slate-400">
                Precio
              </span>
              <span className="text-xl font-black text-slate-900">
                {formatearPrecio(producto.precio)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="p-5 pt-2">
        <button
          type="button"
          onClick={() => onAgregar(producto)}
          disabled={sinStock}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-rose-600 hover:shadow-rose-600/20 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {sinStock ? (
            "Agotado"
          ) : (
            <>
              <span>🛒</span>
              <span>Agregar al carrito</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}