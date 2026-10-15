import { useMemo, useState } from "react";
import type { Producto } from "../types";
import ProductCard from "./ProductCard";

interface Props {
  productos: Producto[];
  onAgregar: (p: Producto) => void;
  onVer: (p: Producto) => void;
}

// Mapeo opcional de imágenes o íconos por defecto para las categorías si no hay imagen asignada
const IMAGENES_CATEGORIA_DEFECTO: Record<string, string> = {
  decoracion: "🪴",
  bazar: "🍳",
  primavera: "🦩",
  jugueteria: "🧩",
  ferreteria: "🧺",
  libreria: "📚",
};

export default function SeccionProductos({ productos, onAgregar, onVer }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  // Obtener la lista única de categorías disponibles
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p) => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats);
  }, [productos]);

  // Filtrado dinámico por búsqueda de texto y/o categoría seleccionada
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideBusqueda =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);

      const coincideCategoria =
        !categoriaSeleccionada ||
        p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase();

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaSeleccionada]);

  // Obtener la imagen representativa de cada categoría (usa la foto del primer producto de esa categoría)
  const getImagenCategoria = (cat: string) => {
    const prod = productos.find(
      (p) => p.categoria.toLowerCase() === cat.toLowerCase() && p.imagenes?.length
    );
    return prod?.imagenes?.[0] || null;
  };

  return (
    <section id="productos" className="scroll-mt-20 bg-slate-50/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        
        {/* Encabezado Principal */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-rose-100/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">
            Catálogo
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Nuestros Productos
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Explora por categorías o utiliza el buscador para encontrar lo que necesitas
          </p>
        </div>

        {/* Barra de Búsqueda y Filtros Rápidos */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="¿Qué estás buscando hoy? (ej. Macetas, Vajilla...)"
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 py-3.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Activo Badge */}
          {categoriaSeleccionada && (
            <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
              <span>Categoría: <span className="uppercase tracking-wider text-rose-300">{categoriaSeleccionada}</span></span>
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                className="ml-1 text-slate-300 hover:text-white"
                title="Quitar filtro"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* GRID DE CATEGORÍAS (Inspirado en tu imagen de referencia) */}
        {!categoriaSeleccionada && !busqueda && categorias.length > 0 && (
          <div className="mb-16">
            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400 text-center sm:text-left">
              Categorías Destacadas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categorias.map((cat) => {
                const img = getImagenCategoria(cat);
                const emojiDefecto =
                  IMAGENES_CATEGORIA_DEFECTO[cat.toLowerCase()] || "📦";

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className="group relative flex h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-[#dcded9] p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-300"
                  >
                    {/* Texto tipográfico grande al fondo en la tarjeta */}
                    <div className="relative z-10 max-w-[60%] flex flex-col justify-between h-full">
                      <h4 className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-slate-700/90 break-words group-hover:text-slate-900 transition-colors">
                        {cat}
                      </h4>
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-600 group-hover:text-rose-600 transition-colors">
                        Ver todo ↗
                      </span>
                    </div>

                    {/* Imagen del producto/categoría superpuesta a la derecha */}
                    <div className="absolute right-2 bottom-0 top-0 w-1/2 flex items-center justify-center p-2">
                      {img ? (
                        <img
                          src={img}
                          alt={cat}
                          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-md"
                        />
                      ) : (
                        <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
                          {emojiDefecto}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LISTA / GRID DE PRODUCTOS */}
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4">
            <h3 className="text-base font-extrabold text-slate-800">
              {categoriaSeleccionada
                ? `Mostrando ${categoriaSeleccionada}`
                : busqueda
                ? `Resultados para "${busqueda}"`
                : "Todos los productos"}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {productosFiltrados.length} {productosFiltrados.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-base font-bold text-slate-800">
                No encontramos productos disponibles
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba buscando otro término o limpia los filtros activos.
              </p>
              <button
                onClick={() => {
                  setBusqueda("");
                  setCategoriaSeleccionada(null);
                }}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-600"
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAgregar={onAgregar}
                  onVer={onVer}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}