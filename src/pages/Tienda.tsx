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

type Orden = "relevancia" | "menor" | "mayor" | "nombre";

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "relevancia", etiqueta: "Más relevantes" },
  { valor: "menor", etiqueta: "Menor precio" },
  { valor: "mayor", etiqueta: "Mayor precio" },
  { valor: "nombre", etiqueta: "Nombre (A-Z)" },
];

const BENEFICIOS = [
  {
    icono: "🏪",
    titulo: "Retiro en el local",
    texto: "Pedí online y pagá en efectivo al retirar.",
  },
  {
    icono: "🚚",
    titulo: "Envío a domicilio",
    texto: "Te lo llevamos a tu casa.",
  },
  {
    icono: "💳",
    titulo: "Efectivo o tarjeta",
    texto: "Elegí cómo pagar al finalizar la compra.",
  },
];

// Para que "lámpara" y "lampara" encuentren lo mismo
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function TarjetaEsqueleto() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-sky-100 bg-white"
      aria-hidden="true"
    >
      <div className="aspect-square bg-sky-50" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-sky-100" />
        <div className="h-3 w-1/2 rounded bg-sky-50" />
        <div className="h-9 w-full rounded-xl bg-sky-100" />
      </div>
    </div>
  );
}

export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [soloConStock, setSoloConStock] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [mostrarSubir, setMostrarSubir] = useState(false);
  const { agregar, cantidadTotal } = useCarrito();

  const cargar = useCallback(() => {
    listarProductos()
      .then((lista) => {
        setProductos(lista.map((p) => ({ ...p, imagenes: p.imagenes ?? [] })));
        setErrorCarga(false);
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Botón "volver arriba" cuando ya se bajó bastante
  useEffect(() => {
    const alScrollear = () => setMostrarSubir(window.scrollY > 700);
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  const categorias = useMemo(
    () => ["Todas", ...new Set(productos.map((p) => p.categoria))],
    [productos]
  );

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());

    const lista = productos.filter(
      (p) =>
        (categoria === "Todas" || p.categoria === categoria) &&
        (!soloConStock || p.stock > 0) &&
        (normalizar(p.nombre).includes(q) ||
          normalizar(p.descripcion).includes(q))
    );

    if (orden === "menor") lista.sort((a, b) => a.precio - b.precio);
    if (orden === "mayor") lista.sort((a, b) => b.precio - a.precio);
    if (orden === "nombre")
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    return lista;
  }, [productos, busqueda, categoria, orden, soloConStock]);

  const hayFiltros =
    busqueda.trim() !== "" || categoria !== "Todas" || soloConStock;

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria("Todas");
    setSoloConStock(false);
    setOrden("relevancia");
  };

  // Se busca por id para que el detalle siempre muestre el stock actualizado
  const seleccionado = productos.find((p) => p.id === seleccionadoId);

  const cerrarDetalle = useCallback(() => setSeleccionadoId(null), []);

  const abrirCarrito = () => setCarritoAbierto(true);

  const irAlCarrito = () => {
    setSeleccionadoId(null);
    setCarritoAbierto(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <NavBar cantidadTotal={cantidadTotal} onAbrirCarrito={abrirCarrito} />

      <Hero />

      {/* Beneficios de compra */}
      <section
        aria-label="Cómo comprar"
        className="border-y border-sky-100 bg-sky-50/60"
      >
        <ul className="mx-auto grid max-w-6xl gap-4 px-6 py-5 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-sky-100"
                aria-hidden="true"
              >
                {b.icono}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{b.titulo}</p>
                <p className="text-xs text-slate-500">{b.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <main id="productos" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-16">
        {/* Barra de búsqueda y filtros: queda fija al bajar */}
        <div className="sticky top-0 z-20 -mx-6 border-b border-sky-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                🔍
              </span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscá por nombre o descripción"
                aria-label="Buscar productos"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="orden-productos">
                Ordenar productos
              </label>
              <select
                id="orden-productos"
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {ORDENES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={soloConStock}
                  onChange={(e) => setSoloConStock(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                />
                Solo con stock
              </label>
            </div>
          </div>

          {/* Categorías como botones que se deslizan en el celular */}
          <div
            className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1"
            role="group"
            aria-label="Filtrar por categoría"
          >
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={categoria === c}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${
                  categoria === c
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-6">
          {!cargando && !errorCarga && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500" aria-live="polite">
                {filtrados.length === 1
                  ? "1 producto"
                  : `${filtrados.length} productos`}
                {categoria !== "Todas" && ` en ${categoria}`}
              </p>

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-sm font-semibold text-sky-700 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {cargando ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <TarjetaEsqueleto key={i} />
              ))}
            </div>
          ) : errorCarga ? (
            <div
              role="alert"
              className="mx-auto max-w-md rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-center"
            >
              <p className="font-bold text-rose-800">
                No pudimos cargar el catálogo
              </p>
              <p className="mt-1 text-sm text-rose-700">
                Revisá que el servidor esté encendido y probá de nuevo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCargando(true);
                  cargar();
                }}
                className="mt-5 rounded-full bg-sky-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Reintentar
              </button>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="text-lg font-bold text-slate-900">
                {productos.length === 0
                  ? "Todavía no hay productos cargados"
                  : "No encontramos productos con esos filtros"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {productos.length === 0
                  ? "Volvé más tarde: estamos actualizando el catálogo."
                  : "Probá con otra palabra o quitá algún filtro."}
              </p>
              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="mt-5 rounded-full border border-sky-200 bg-white px-6 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
                >
                  Ver todos los productos
                </button>
              )}
            </div>
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
        </div>
      </main>

      <UbicacionContacto />

      <Footer />

      {/* Botones flotantes */}
      <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
        {mostrarSubir && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Volver arriba"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-100 bg-white text-lg text-sky-700 shadow-lg transition hover:bg-sky-50"
          >
            ↑
          </button>
        )}

        <button
          type="button"
          onClick={abrirCarrito}
          aria-label={`Abrir carrito, ${cantidadTotal} producto${cantidadTotal === 1 ? "" : "s"}`}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl text-white shadow-lg transition hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 md:hidden"
        >
          <span aria-hidden="true">🛒</span>
          {cantidadTotal > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white ring-2 ring-white">
              {cantidadTotal}
            </span>
          )}
        </button>
      </div>

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