import { useCallback, useEffect, useMemo, useState } from "react";
import type { Producto } from "../types";
import { listarProductos } from "../services/productos";
import { useCarrito } from "../context/CarritoContext";
import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import ProductoDetalle from "../components/ProductoDetalle";
import UbicacionContacto from "../components/UbicacionContacto";
import Footer from "../components/Footer";
import Carrito from "../components/Carrito";

export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const { agregar, cantidadTotal } = useCarrito();

  const cargar = useCallback(() => {
    listarProductos().then((lista) =>
      setProductos(lista.map((p) => ({ ...p, imagenes: p.imagenes ?? [] })))
    );
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

  // Se busca por id para que el detalle siempre muestre el stock actualizado
  const seleccionado = productos.find((p) => p.id === seleccionadoId);

  const cerrarDetalle = useCallback(() => setSeleccionadoId(null), []);

  const irAlCarrito = () => {
    setSeleccionadoId(null);
    setCarritoAbierto(true);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <NavBar
        cantidadTotal={cantidadTotal}
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      <Hero />

      <main id="productos" className="mx-auto max-w-6xl scroll-mt-20 p-6">
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
              <ProductCard
                key={p.id}
                producto={p}
                onAgregar={agregar}
                onVer={(prod) => setSeleccionadoId(prod.id)}
              />
            ))}
          </div>
        )}
      </main>

      <UbicacionContacto />

      <Footer />

      {seleccionado && (
        <ProductoDetalle
          key={seleccionado.id}
          producto={seleccionado}
          onCerrar={cerrarDetalle}
          onVerCarrito={irAlCarrito}
        />
      )}

      <Carrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        productos={productos}
        onCompraExitosa={cargar}
      />
    </div>
  );
}