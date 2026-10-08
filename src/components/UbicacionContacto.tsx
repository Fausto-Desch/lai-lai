import type { ReactNode } from "react";
import { HAY_CONTACTO, LOCAL_INFO } from "../config";

/* ---------- Logos (SVG) ---------- */

function LogoGmail() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#fff" stroke="#d1d5db" />
      <path
        d="M2.5 6.5 12 13.5l9.5-7"
        fill="none"
        stroke="#EA4335"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.8 7v10.5" stroke="#4285F4" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21.2 7v10.5" stroke="#34A853" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LogoWhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <g transform="translate(7.6 7.4) scale(0.4)">
        <path
          strokeWidth="3.5"
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
      </g>
    </svg>
  );
}

function LogoInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- Botón de red ---------- */

interface BotonRedProps {
  href: string;
  icono: ReactNode;
  titulo: string;
  detalle: string;
  clases: string;
}

function BotonRed({ href, icono, titulo, detalle, clases }: BotonRedProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-4 rounded-xl px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${clases}`}
    >
      <span className="shrink-0">{icono}</span>
      <span className="min-w-0 text-left">
        <span className="block font-semibold leading-tight">{titulo}</span>
        <span className="block truncate text-sm opacity-90">{detalle}</span>
      </span>
    </a>
  );
}

/* ---------- Sección ---------- */

export default function UbicacionContacto() {
  if (!HAY_CONTACTO) {
    return import.meta.env.DEV ? (
      <section
        id="contacto"
        className="border-t border-dashed bg-white px-6 py-10 text-center text-sm text-gray-500"
      >
        Sección de ubicación y contacto oculta: completá los datos del local en{" "}
        <code>src/config.ts</code> para que aparezca.
      </section>
    ) : null;
  }

  const { direccion, mapaEmbedUrl, horario, telefono, email } = LOCAL_INFO;
  const whatsapp = LOCAL_INFO.whatsapp.replace(/\D/g, "");
  const instagram = LOCAL_INFO.instagram.replace(/^@/, "").trim();

  const mapaSrc =
    mapaEmbedUrl ||
    (direccion
      ? `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`
      : "");
  const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    direccion
  )}`;

  const hayUbicacion = Boolean(mapaSrc || direccion);
  const hayBotones = Boolean(email || whatsapp || instagram);
  const hayContacto = Boolean(hayBotones || horario || telefono);
  const dosColumnas = hayUbicacion && hayContacto;

  return (
    <section id="contacto" className="scroll-mt-20 bg-white py-12">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold text-red-800">
          Dónde estamos y cómo contactarnos
        </h2>

        <div
          className={`grid gap-8 ${
            dosColumnas ? "md:grid-cols-2" : "mx-auto max-w-2xl"
          }`}
        >
          {/* Ubicación */}
          {hayUbicacion && (
            <div className="flex flex-col gap-4">
              {mapaSrc && (
                <iframe
                  src={mapaSrc}
                  title="Mapa con la ubicación del local"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full rounded-xl border-0 shadow-sm md:h-full md:min-h-80"
                />
              )}
              {direccion && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-gray-700">📍 {direccion}</p>
                  <a
                    href={urlMapa}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Cómo llegar
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contacto */}
          {hayContacto && (
            <div className="flex flex-col gap-5">
              {hayBotones && (
                <>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Contactanos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Elegí cómo preferís escribirnos
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {email && (
                      <BotonRed
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          email
                        )}&su=${encodeURIComponent("Consulta desde la tienda")}`}
                        icono={<LogoGmail />}
                        titulo="Gmail"
                        detalle={email}
                        clases="border border-gray-200 bg-white text-gray-900"
                      />
                    )}
                    {whatsapp && (
                      <BotonRed
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                          "Hola, quería hacer una consulta."
                        )}`}
                        icono={<LogoWhatsApp />}
                        titulo="WhatsApp"
                        detalle="Escribinos por WhatsApp"
                        clases="bg-[#25D366] text-white"
                      />
                    )}
                    {instagram && (
                      <BotonRed
                        href={`https://instagram.com/${instagram}`}
                        icono={<LogoInstagram />}
                        titulo="Instagram"
                        detalle={`@${instagram}`}
                        clases="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white"
                      />
                    )}
                  </div>
                </>
              )}

              {(horario || telefono) && (
                <ul className="flex flex-col gap-2 border-t pt-4 text-gray-700">
                  {horario && <li>🕒 {horario}</li>}
                  {telefono && (
                    <li>
                      📞{" "}
                      <a
                        href={`tel:${telefono.replace(/[^\d+]/g, "")}`}
                        className="text-red-700 hover:underline"
                      >
                        {telefono}
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}