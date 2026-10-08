import { HAY_CONTACTO, LOCAL_INFO } from "../config";
import { urlGmail, urlInstagram, urlWhatsApp } from "../utils/redes";
import { irA } from "../utils/scrolls";
import { LogoGmail, LogoInstagram, LogoWhatsApp } from "./Logo";

export default function Footer() {
  const { nombre, lema, direccion, horario, telefono } = LOCAL_INFO;
  const hayDatos = Boolean(direccion || horario || telefono);
  const hayRedes = Boolean(urlGmail || urlWhatsApp || urlInstagram);

  const titulo = "mb-3 font-semibold text-amber-300";
  const enlaceNav =
    "block py-1 text-left text-white/80 transition hover:text-white hover:underline";
  const circulo =
    "flex h-11 w-11 items-center justify-center rounded-full shadow transition hover:-translate-y-0.5";

  return (
    <footer className="bg-red-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10 px-6 py-10">
        {/* Marca */}
        <div className="max-w-xs">
          <p className="text-xl font-bold">🏮 {nombre}</p>
          <p className="mt-2 text-sm text-white/80">{lema}</p>
        </div>

        {/* Navegación */}
        <div>
          <h3 className={titulo}>Navegación</h3>
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
        </div>

        {/* Datos del local */}
        {hayDatos && (
          <div className="text-sm">
            <h3 className={titulo}>Visitanos</h3>
            <ul className="space-y-2 text-white/80">
              {direccion && <li>📍 {direccion}</li>}
              {horario && <li>🕒 {horario}</li>}
              {telefono && (
                <li>
                  📞{" "}
                  <a
                    href={`tel:${telefono.replace(/[^\d+]/g, "")}`}
                    className="hover:text-white hover:underline"
                  >
                    {telefono}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Redes */}
        {hayRedes && (
          <div>
            <h3 className={titulo}>Escribinos</h3>
            <div className="flex gap-3">
              {urlGmail && (
                <a
                  href={urlGmail}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Gmail"
                  className={`${circulo} bg-white`}
                >
                  <LogoGmail className="h-6 w-6" />
                </a>
              )}

              {urlWhatsApp && (
                <a
                  href={urlWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className={`${circulo} bg-[#25D366] text-white`}
                >
                  <LogoWhatsApp className="h-6 w-6" />
                </a>
              )}

              {urlInstagram && (
                <a
                  href={urlInstagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className={`${circulo} bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white`}
                >
                  <LogoInstagram className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="border-t border-white/15 px-6 py-4 text-center text-sm text-white/70">
        <p>
          © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
        </p>

        <p className="mt-1">
          Página hecha por{" "}
          <a
            href="https://www.instagram.com/innovabyte0/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-white transition hover:text-amber-300 hover:underline"
          >
            InnovaByte
          </a>
        </p>
      </div>
    </footer>
  );
}