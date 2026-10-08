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
    <div className="flex flex-col overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm transition hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${producto.nombre}`}
        onClick={() => onVer(producto)}
        onKeyDown={abrirConTeclado}
        className="flex flex-1 cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-red-600"
      >
        <div className="relative flex h-40 items-center justify-center bg-red-50 text-5xl">
          {portada ? (
            <img
              src={portada}
              alt={producto.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            "🏮"
          )}
          {imagenes.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              📷 {imagenes.length}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 pb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-red-700">
            {producto.categoria}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">
            {producto.nombre}
          </h3>
          <p className="line-clamp-2 flex-1 text-sm text-gray-600">
            {producto.descripcion}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
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
        </div>
      </div>

      <div className="p-4 pt-2">
        <button
          onClick={() => onAgregar(producto)}
          disabled={sinStock}
          className="w-full rounded-lg bg-red-700 py-2 font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sinStock ? "No disponible" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}