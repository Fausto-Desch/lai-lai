import type { ReactNode } from "react";
import { HAY_CONTACTO, LOCAL_INFO } from "../config";

/* ---------- Logos (SVG) ---------- */

function LogoGmail() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
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
      className="h-7 w-7 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function LogoInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
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
      className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${clases}`}
    >
      <span className="shrink-0">{icono}</span>
      <span className="min-w-0 text-left">
        <span className="block font-extrabold leading-tight">{titulo}</span>
        <span className="block truncate text-xs opacity-90">{detalle}</span>
      </span>
    </a>
  );
}

/* ---------- Sección Principal ---------- */

export default function UbicacionContacto() {
  if (!HAY_CONTACTO) {
    return import.meta.env.DEV ? (
      <section
        id="contacto"
        className="border-t border-dashed bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
      >
        Sección de ubicación y contacto oculta: completá los datos del local en{" "}
        <code className="font-mono text-slate-800">src/config.ts</code> para que aparezca.
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
    <section id="contacto" className="scroll-mt-20 bg-slate-50/60 py-16 lg:py-24 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        
        {/* Titular de la Sección */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-rose-100/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">
            Estamos para ayudarte
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Dónde estamos y cómo contactarnos
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Visitanos en nuestro local comercial o escribinos directamente por tus vías preferidas.
          </p>
        </div>

        <div
          className={`grid gap-8 lg:gap-12 ${
            dosColumnas ? "lg:grid-cols-2 items-start" : "mx-auto max-w-2xl"
          }`}
        >
          {/* Ubicación y Mapa */}
          {hayUbicacion && (
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100">
              {mapaSrc && (
                <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-80 w-full overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
                  <iframe
                    src={mapaSrc}
                    title="Mapa con la ubicación del local"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full border-0"
                  />
                </div>
              )}
              
              {direccion && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                      📍
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dirección</p>
                      <p className="text-sm font-bold text-slate-800">{direccion}</p>
                    </div>
                  </div>

                  <a
                    href={urlMapa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-600 hover:shadow-rose-600/20"
                  >
                    <span>Cómo llegar</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contacto y Redes */}
          {hayContacto && (
            <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
              {hayBotones && (
                <>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Canales de atención
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Hacé clic en cualquiera de nuestras redes para iniciar una conversación
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {whatsapp && (
                      <BotonRed
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                          "Hola, quería hacer una consulta."
                        )}`}
                        icono={<LogoWhatsApp />}
                        titulo="WhatsApp"
                        detalle="Escribinos directamente al chat"
                        clases="bg-[#25D366] text-white shadow-emerald-500/10"
                      />
                    )}
                    {instagram && (
                      <BotonRed
                        href={`https://instagram.com/${instagram}`}
                        icono={<LogoInstagram />}
                        titulo="Instagram"
                        detalle={`@${instagram}`}
                        clases="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-rose-500/10"
                      />
                    )}
                    {email && (
                      <BotonRed
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          email
                        )}&su=${encodeURIComponent("Consulta desde la tienda")}`}
                        icono={<LogoGmail />}
                        titulo="Correo electrónico"
                        detalle={email}
                        clases="border border-slate-200 bg-slate-50/50 text-slate-800 hover:bg-white"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Horarios y Teléfono */}
              {(horario || telefono) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                  {horario && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs">
                        ⏰
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Horarios
                        </span>
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {horario}
                        </span>
                      </div>
                    </div>
                  )}

                  {telefono && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs">
                        📞
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Teléfono
                        </span>
                        <a
                          href={`tel:${telefono.replace(/[^\d+]/g, "")}`}
                          className="block text-xs font-bold text-rose-600 hover:underline truncate"
                        >
                          {telefono}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}