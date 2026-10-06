import { useCallback, useEffect, useMemo, useState } from "react";
import type { Producto } from "../types";
import { listarProductos } from "../services/productos";
import { useCarrito } from "../context/CarritoContext";
import ProductCard from "../components/ProductCard";
import Carrito from "../components/Carrito";

export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const { agregar, cantidadTotal } = useCarrito();

  const cargar = useCallback(() => {
    listarProductos().then(setProductos);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const categorias = useMemo(
    () => ["Todas", ...new Set(productos.map((p) => p.categoria))],
    [productos]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (categoria === "Todas" || p.categoria === categoria) &&
        (p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q))
    );
  }, [productos, busqueda, categoria]);

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="flex items-center justify-between bg-red-700 px-6 py-4 text-white shadow">
        <h1 className="text-2xl font-bold">🏮 Bazar Lai Lai</h1>
        <button
          onClick={() => setCarritoAbierto(true)}
          className="relative rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
        >
          🛒 Carrito
          {cantidadTotal > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-red-900">
              {cantidadTotal}
            </span>
          )}
        </button>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-red-600"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-red-600"
          >
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {filtrados.length === 0 ? (
          <p className="py-12 text-center text-gray-500">
            No se encontraron productos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((p) => (
              <ProductCard key={p.id} producto={p} onAgregar={agregar} />
            ))}
          </div>
        )}
      </main>

      <Carrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        productos={productos}
        onCompraExitosa={cargar}
      />
    </div>
  );
}