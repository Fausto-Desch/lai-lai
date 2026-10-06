import type { Producto } from "../types";
import { formatearPrecio } from "../utils/formato";

interface Props {
  producto: Producto;
  onAgregar: (p: Producto) => void;
}

export default function ProductCard({ producto, onAgregar }: Props) {
  const sinStock = producto.stock === 0;
  const pocoStock = producto.stock > 0 && producto.stock <= 5;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex h-40 items-center justify-center bg-red-50 text-5xl">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          "🏮"
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-red-700">
          {producto.categoria}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">
          {producto.nombre}
        </h3>
        <p className="flex-1 text-sm text-gray-600">{producto.descripcion}</p>

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

        <button
          onClick={() => onAgregar(producto)}
          disabled={sinStock}
          className="mt-2 rounded-lg bg-red-700 py-2 font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sinStock ? "No disponible" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}