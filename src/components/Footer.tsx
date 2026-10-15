import { HAY_CONTACTO, LOCAL_INFO } from "../config";
import { urlGmail, urlInstagram, urlWhatsApp } from "../utils/redes";
import { irA } from "../utils/scrolls";
import { LogoGmail, LogoInstagram, LogoWhatsApp } from "./Logo";

export default function Footer() {
  const { nombre, lema, direccion, horario, telefono } = LOCAL_INFO;
  const hayDatos = Boolean(direccion || horario || telefono);
  const hayRedes = Boolean(urlGmail || urlWhatsApp || urlInstagram);

  const titulo = "mb-4 text-xs font-black uppercase tracking-widest text-rose-400";
  const enlaceNav =
    "block py-1.5 text-left text-sm font-medium text-slate-300 transition-colors hover:text-white hover:translate-x-1 duration-200";
  const circulo =
    "flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          
          {/* Marca / Logo */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xl font-black tracking-widest uppercase text-white">
              <span>🍒</span>
              <span>{nombre}</span>
            </div>
            {lema && (
              <p className="text-xs leading-relaxed text-slate-400 max-w-xs">
                {lema}
              </p>
            )}
          </div>

          {/* Navegación rápida */}
          <div>
            <h3 className={titulo}>Navegación</h3>
            <nav className="flex flex-col" aria-label="Navegación del pie de página">
              <button onClick={() => irA("inicio")} className={enlaceNav}>
                Inicio
              </button>
              <button onClick={() => irA("productos")} className={enlaceNav}>
                Productos
              </button>
              {HAY_CONTACTO && (
                <button onClick={() => irA("contacto")} className={enlaceNav}>
                  Contacto
                </button>
              )}
            </nav>
          </div>

          {/* Datos del local / Visítanos */}
          {hayDatos && (
            <div>
              <h3 className={titulo}>Visítanos</h3>
              <ul className="space-y-3 text-xs font-medium text-slate-300">
                {direccion && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400">📍</span>
                    <span className="leading-relaxed">{direccion}</span>
                  </li>
                )}
                {horario && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400">🕒</span>
                    <span className="leading-relaxed">{horario}</span>
                  </li>
                )}
                {telefono && (
                  <li className="flex items-center gap-2.5">
                    <span className="text-rose-400">📞</span>
                    <a
                      href={`tel:${telefono.replace(/[^\d+]/g, "")}`}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      {telefono}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Redes Sociales / Contacto */}
          {hayRedes && (
            <div>
              <h3 className={titulo}>Escríbenos</h3>
              <p className="text-xs text-slate-400 mb-4">
                Encuéntranos en nuestras redes oficiales.
              </p>
              <div className="flex flex-wrap gap-3">
                {urlGmail && (
                  <a
                    href={urlGmail}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Gmail"
                    className={`${circulo} bg-white text-slate-900 hover:bg-slate-100`}
                  >
                    <LogoGmail className="h-5 w-5" />
                  </a>
                )}

                {urlWhatsApp && (
                  <a
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className={`${circulo} bg-[#25D366] text-white shadow-emerald-500/10`}
                  >
                    <LogoWhatsApp className="h-5 w-5" />
                  </a>
                )}

                {urlInstagram && (
                  <a
                    href={urlInstagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className={`${circulo} bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-rose-500/10`}
                  >
                    <LogoInstagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Copyright y Créditos */}
      <div className="border-t border-slate-900 bg-slate-950/80 px-6 py-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
          </p>

          <p className="flex items-center gap-1.5">
            <span>Diseñado con pasión por</span>
            <a
              href="https://www.instagram.com/innovabyte0/"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-slate-300 transition hover:text-rose-400 hover:underline"
            >
              InnovaByte
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}