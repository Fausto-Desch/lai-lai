import type { KeyboardEvent } from "react";
import type { Producto } from "../types";
import { formatearPrecio } from "../utils/formato";

interface Props {
  producto: Producto;
  onAgregar: (p: Producto) => void;
  onVer: (p: Producto) => void;
}

export default function ProductCard({ producto, onAgregar, onVer }: Props) {
  const sinStock = producto.stock === 0;
  const pocoStock = producto.stock > 0 && producto.stock <= 5;
  const imagenes = producto.imagenes ?? [];
  const portada = imagenes[0];

  const abrirConTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onVer(producto);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      
      {/* Área interactiva de la tarjeta (Imagen + Información) */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${producto.nombre}`}
        onClick={() => onVer(producto)}
        onKeyDown={abrirConTeclado}
        className="flex flex-1 cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-t-2xl"
      >
        {/* Contenedor de Imagen de Portada */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center">
          {portada ? (
            <img
              src={portada}
              alt={producto.nombre}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl opacity-40">🍒</span>
          )}

          {/* Badge flotante de estado de Stock en la esquina superior izquierda */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md shadow-xs ${
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

          {/* Contador de fotos en la esquina inferior derecha */}
          {imagenes.length > 1 && (
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-900/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs flex items-center gap-1">
              📷 {imagenes.length}
            </span>
          )}
        </div>

        {/* Detalles del Producto */}
        <div className="flex flex-1 flex-col p-5 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
            {producto.categoria}
          </span>

          <h3 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
            {producto.nombre}
          </h3>

          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
            {producto.descripcion}
          </p>

          <div className="mt-4 flex items-baseline justify-between border-t border-slate-50 pt-3">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Precio</span>
              <span className="text-xl font-black text-slate-900">
                {formatearPrecio(producto.precio)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de Acción Principal */}
      <div className="p-5 pt-2">
        <button
          type="button"
          onClick={() => onAgregar(producto)}
          disabled={sinStock}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-4 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-rose-600 hover:shadow-rose-600/20 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
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