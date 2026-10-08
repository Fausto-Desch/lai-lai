import { useCallback, useEffect, useState } from "react";
import { HERO_IMAGENES, LOCAL_INFO } from "../config";

const INTERVALO_MS = 5000;

export default function Hero() {
  const [fallidas, setFallidas] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Si una foto no existe o no carga, simplemente se descarta
  const imagenes = HERO_IMAGENES.filter((src) => !fallidas.includes(src));
  const total = imagenes.length;
  const actual = total > 0 ? indice % total : 0;

  const mover = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndice((i) => (i + delta + total) % total);
    },
    [total]
  );

  // Cambio automático (se vuelve a armar después de cada cambio)
  useEffect(() => {
    if (total < 2 || pausado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => mover(1), INTERVALO_MS);
    return () => window.clearTimeout(id);
  }, [total, pausado, actual, mover]);

  const irAProductos = () =>
    document
      .getElementById("productos")
      ?.scrollIntoView({ behavior: "smooth" });

  const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    LOCAL_INFO.direccion
  )}`;

  const flecha =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl text-red-900 shadow transition hover:bg-white sm:flex";

  return (
    <section
      aria-label="Fotos del local"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative isolate flex min-h-[420px] items-end overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-amber-600 text-white md:min-h-[520px]"
    >
      {/* Fotos apiladas con fundido */}
      {imagenes.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Foto del local ${i + 1}`}
          aria-hidden={i !== actual}
          onError={() => setFallidas((f) => [...f, src])}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ${
            i === actual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Sin fotos: decoración de respaldo */}
      {total === 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 flex items-center justify-center text-[10rem] opacity-20"
        >
          🏮
        </div>
      )}

      {/* Degradé para que el texto se lea siempre */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

      {/* Contenido */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-amber-300">
          Bienvenidos
        </p>
        <h2 className="text-4xl font-bold drop-shadow md:text-6xl">
          {LOCAL_INFO.nombre}
        </h2>
        <p className="mt-3 max-w-xl text-lg text-white/90 md:text-xl">
          {LOCAL_INFO.lema}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={irAProductos}
            className="rounded-lg bg-amber-400 px-6 py-3 font-semibold text-red-900 transition hover:bg-amber-300"
          >
            Ver productos
          </button>
          {LOCAL_INFO.direccion && (
            <a
              href={urlMapa}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/70 px-6 py-3 font-semibold transition hover:bg-white/10"
            >
              📍 Cómo llegar
            </a>
          )}
        </div>

        {(LOCAL_INFO.direccion || LOCAL_INFO.horario) && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/90">
            {LOCAL_INFO.direccion && <span>📍 {LOCAL_INFO.direccion}</span>}
            {LOCAL_INFO.horario && <span>🕒 {LOCAL_INFO.horario}</span>}
          </div>
        )}
      </div>

      {/* Controles del carrusel */}
      {total > 1 && (
        <>
          <button
            onClick={() => mover(-1)}
            aria-label="Foto anterior"
            className={`${flecha} left-4`}
          >
            ‹
          </button>
          <button
            onClick={() => mover(1)}
            aria-label="Foto siguiente"
            className={`${flecha} right-4`}
          >
            ›
          </button>
          <div className="absolute bottom-5 right-6 flex gap-2">
            {imagenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual}
                className={`h-2.5 rounded-full transition-all ${
                  i === actual
                    ? "w-6 bg-amber-400"
                    : "w-2.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}   