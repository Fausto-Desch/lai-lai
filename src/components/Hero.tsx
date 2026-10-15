import { useCallback, useEffect, useState } from "react";
import { HERO_IMAGENES, LOCAL_INFO } from "../config";

const INTERVALO_MS = 5000;

export default function Hero() {
  const [fallidas, setFallidas] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const imagenes = HERO_IMAGENES.filter(
    (src) => !fallidas.includes(src)
  );
  const total = imagenes.length;
  const actual = total ? indice % total : 0;

  const mover = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndice((i) => (i + delta + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (
      total < 2 ||
      pausado ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const id = window.setTimeout(
      () => mover(1),
      INTERVALO_MS
    );

    return () => window.clearTimeout(id);
  }, [total, pausado, actual, mover]);

  const irAProductos = () => {
    document.getElementById("productos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    LOCAL_INFO.direccion
  )}`;

  return (
    <section
      aria-label={`Bienvenidos a ${LOCAL_INFO.nombre}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-slate-900"
    >
      {/* Carrusel de Imágenes de Fondo a Pantalla Completa */}
      <div className="absolute inset-0 z-0">
        {imagenes.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Fotografía de la tienda ${i + 1}`}
            aria-hidden={i !== actual}
            onError={() =>
              setFallidas((prev) =>
                prev.includes(src) ? prev : [...prev, src]
              )
            }
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === actual ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          />
        ))}

        {total === 0 && (
          <div className="flex h-full items-center justify-center text-6xl text-rose-300">
            🌸
          </div>
        )}

        {/* Overlay oscuro para garantizar contraste de texto sobre la foto */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Contenido principal superpuesto */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-5 py-20 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Bloque de Información / Texto Principal */}
        <div className="max-w-xl text-white">
          <span className="inline-block bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white">
            ¡Bienvenidos a nuestra tienda!
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight drop-shadow-md">
            {LOCAL_INFO.nombre}
          </h1>

          <p className="mt-4 text-lg sm:text-xl font-medium text-slate-100 drop-shadow">
            {LOCAL_INFO.lema}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={irAProductos}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-4 shadow-lg shadow-rose-600/30 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
            >
              Explorar productos
            </button>

            {LOCAL_INFO.direccion && (
              <a
                href={urlMapa}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-semibold px-6 py-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              >
                Cómo llegar ↗
              </a>
            )}
          </div>
        </div>

        {/* Banner destacado estilo "Promo / 10% OFF" inspirado en tu imagen */}
        <div className="relative w-full max-w-md lg:max-w-lg">
          <div className="rounded-[2.5rem] border-4 border-white/80 bg-rose-500/90 backdrop-blur-md p-8 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden group">
            {/* Círculo decorativo interno de brillo */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/20 blur-2xl" />

            <span className="block text-sm sm:text-base font-extrabold tracking-wider uppercase text-rose-100">
              Te regalamos
            </span>
            <span className="block text-5xl sm:text-6xl font-black tracking-tighter mt-1 drop-shadow-md text-white">
              10% OFF
            </span>

            <div className="mt-6 inline-block bg-white text-rose-600 font-extrabold text-sm sm:text-base px-6 py-2.5 rounded-full shadow-md uppercase tracking-wide">
              Código: CEREZAS10
            </div>

            {/* Botón circular "Shop Now" flotante inferior como en tu referencia */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <button
                onClick={irAProductos}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl border-4 border-white hover:bg-slate-800 transition-transform hover:scale-110"
                aria-label="Shop now"
              >
                <span className="text-xl">🛍️</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Controles de carrusel inferiores discretos si hay más de 1 imagen */}
      {total > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/20">
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => mover(-1)}
            className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            ‹
          </button>
          <span className="text-xs text-white font-medium px-2">
            {actual + 1} / {total}
          </span>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => mover(1)}
            className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}