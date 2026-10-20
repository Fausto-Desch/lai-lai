import { useState } from "react";
import type { Entrega, MetodoPago, Pedido, Producto } from "../types";
import { useCarrito } from "../context/CarritoContext";
import { crearPedido } from "../services/pedidos";
import { ErrorApi } from "../services/api";
import { procesarPagoTarjeta, type DatosTarjeta } from "../services/pagos";
import { formatearPrecio } from "../utils/formato";
import {
  formatearNumero,
  formatearVencimiento,
  luhnValido,
  vencimientoValido,
} from "../utils/tarjeta";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  productos: Producto[];
  onCompraExitosa: () => void;
}

const datosVacios = { nombre: "", telefono: "", direccion: "" };
const tarjetaVacia: DatosTarjeta = {
  numero: "",
  titular: "",
  vencimiento: "",
  cvv: "",
};

export default function Carrito({
  abierto,
  onCerrar,
  productos,
  onCompraExitosa,
}: Props) {
  const { items, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [datos, setDatos] = useState(datosVacios);
  const [entrega, setEntrega] = useState<Entrega>("retiro");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [tarjeta, setTarjeta] = useState(tarjetaVacia);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  if (!abierto) return null;

  const lineas = items.flatMap((item) => {
    const producto = productos.find((p) => p.id === item.productoId);
    return producto ? [{ producto, cantidad: item.cantidad }] : [];
  });

  const total = lineas.reduce(
    (acc, l) => acc + l.producto.precio * l.cantidad,
    0
  );

  const cerrar = () => {
    setError("");
    setPedido(null);
    onCerrar();
  };

  const validarTarjeta = (): string | null => {
    if (!luhnValido(tarjeta.numero)) return "El número de tarjeta no es válido";
    if (!tarjeta.titular.trim()) return "Ingresá el nombre del titular";
    if (!vencimientoValido(tarjeta.vencimiento))
      return "El vencimiento no es válido (MM/AA)";
    if (!/^\d{3,4}$/.test(tarjeta.cvv))
      return "El código de seguridad no es válido";
    return null;
  };

  const confirmar = async () => {
    setError("");

    if (!datos.nombre.trim() || !datos.telefono.trim()) {
      setError("Completá tu nombre y teléfono para continuar");
      return;
    }
    if (entrega === "envio" && datos.direccion.trim().length < 5) {
      setError("Ingresá la dirección de entrega");
      return;
    }
    if (metodo === "tarjeta") {
      const msg = validarTarjeta();
      if (msg) {
        setError(msg);
        return;
      }
    }

    setProcesando(true);
    try {
      let ultimos4: string | undefined;
      if (metodo === "tarjeta") {
        const res = await procesarPagoTarjeta(tarjeta, total);
        if (!res.aprobado) {
          setError(res.motivo ?? "No se pudo procesar el pago");
          return;
        }
        ultimos4 = res.ultimos4;
      }

      const nuevo = await crearPedido({
        comprador: {
          nombre: datos.nombre.trim(),
          telefono: datos.telefono.trim(),
          direccion: entrega === "envio" ? datos.direccion.trim() : "",
        },
        items: lineas.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.cantidad,
        })),
        metodoPago: metodo,
        entrega,
        tarjetaUltimos4: ultimos4,
      });

      vaciar();
      setDatos(datosVacios);
      setTarjeta(tarjetaVacia);
      setPedido(nuevo);
      onCompraExitosa();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la compra"
      );
      if (e instanceof ErrorApi && e.estado === 409) onCompraExitosa();
    } finally {
      setProcesando(false);
    }
  };

  const inputStyle =
    "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white";

  const opcion = (activa: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all ${
      activa
        ? "border-slate-900 bg-slate-900 text-white shadow-md"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }`;

  const botonEntrega = (valor: Entrega, texto: string) => (
    <button
      type="button"
      onClick={() => setEntrega(valor)}
      className={opcion(entrega === valor)}
    >
      {texto}
    </button>
  );

  const botonMetodo = (valor: MetodoPago, texto: string) => (
    <button
      type="button"
      onClick={() => setMetodo(valor)}
      className={opcion(metodo === valor)}
    >
      {texto}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={cerrar}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Carrito */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Tu Carrito
            </h2>
          </div>
          <button
            onClick={cerrar}
            aria-label="Cerrar carrito"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-y-auto p-6">
          {pedido ? (
            <div className="py-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
                🎉
              </div>
              <p className="text-xl font-black text-slate-900">
                ¡Pedido realizado con éxito!
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Tu código de seguimiento es
              </p>
              <p className="my-3 text-3xl font-black tracking-wider text-rose-600 font-mono">
                #{pedido.codigo}
              </p>

              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 my-6 border border-slate-100 leading-relaxed">
                {pedido.entrega === "envio" ? (
                  <>
                    <p className="mb-1">
                      Te lo enviamos a <strong className="text-slate-900 font-bold">{pedido.comprador.direccion}</strong>.
                    </p>
                    {pedido.metodoPago === "efectivo" ? (
                      <p>
                        Pagás <strong className="text-slate-900 font-bold">{formatearPrecio(pedido.total)}</strong> en efectivo cuando lo recibís.
                      </p>
                    ) : (
                      <p>
                        Pago aprobado con tarjeta terminada en <strong className="text-slate-900 font-bold">•••• {pedido.tarjetaUltimos4}</strong>.
                      </p>
                    )}
                  </>
                ) : pedido.metodoPago === "efectivo" ? (
                  <p>
                    Presentá este código en el local para abonar <strong className="text-slate-900 font-bold">{formatearPrecio(pedido.total)}</strong> y retirar tu compra.
                  </p>
                ) : (
                  <p>
                    Pago aprobado con tarjeta terminada en <strong className="text-slate-900 font-bold">•••• {pedido.tarjetaUltimos4}</strong>.
                  </p>
                )}
              </div>

              <a
                href={`/comprobante/${pedido.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-md hover:bg-rose-600 transition-all"
              >
                <span>📄</span>
                <span>Ver e imprimir comprobante</span>
              </a>
            </div>
          ) : lineas.length === 0 ? (
            <div className="py-24 text-center">
              <span className="text-5xl block mb-3 opacity-40">🛍️</span>
              <p className="text-base font-bold text-slate-800">
                Tu carrito está vacío
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Explora el catálogo y añade tus productos favoritos.
              </p>
            </div>
          ) : (
            <>
              {/* Lista de Ítems */}
              <ul className="flex flex-col gap-4 divide-y divide-slate-100">
                {lineas.map(({ producto, cantidad }) => (
                  <li key={producto.id} className="pt-4 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {formatearPrecio(producto.precio)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
                        <button
                          onClick={() =>
                            cambiarCantidad(producto.id, cantidad - 1)
                          }
                          className="h-8 w-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900">
                          {cantidad}
                        </span>
                        <button
                          onClick={() =>
                            cambiarCantidad(producto.id, cantidad + 1)
                          }
                          disabled={cantidad >= producto.stock}
                          className="h-8 w-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="w-24 text-right">
                      <p className="text-sm font-black text-slate-900">
                        {formatearPrecio(producto.precio * cantidad)}
                      </p>
                      <button
                        onClick={() => quitar(producto.id)}
                        className="text-[11px] font-bold text-rose-500 hover:underline mt-0.5 block ml-auto"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Opción de Entrega */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Método de Entrega
                </h3>
                <div className="flex gap-3">
                  {botonEntrega("retiro", "🏪 Retiro en local")}
                  {botonEntrega("envio", "🚚 Envío a domicilio")}
                </div>
              </div>

              {/* Formulario de Datos del Comprador */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Tus Datos
                </h3>
                <div className="flex flex-col gap-3">
                  <input
                    className={inputStyle}
                    placeholder="Nombre y apellido"
                    value={datos.nombre}
                    onChange={(e) =>
                      setDatos({ ...datos, nombre: e.target.value })
                    }
                  />
                  <input
                    className={inputStyle}
                    placeholder="Teléfono de contacto"
                    value={datos.telefono}
                    onChange={(e) =>
                      setDatos({ ...datos, telefono: e.target.value })
                    }
                  />
                  {entrega === "envio" && (
                    <input
                      className={inputStyle}
                      placeholder="Dirección de entrega (calle, número, ciudad)"
                      value={datos.direccion}
                      onChange={(e) =>
                        setDatos({ ...datos, direccion: e.target.value })
                      }
                    />
                  )}
                </div>
              </div>

              {/* Forma de Pago */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Forma de Pago
                </h3>
                <div className="flex gap-3 mb-4">
                  {botonMetodo(
                    "efectivo",
                    entrega === "envio" ? "💵 Efectivo al recibir" : "💵 Efectivo en local"
                  )}
                  {botonMetodo("tarjeta", "💳 Tarjeta")}
                </div>

                {metodo === "efectivo" ? (
                  <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 p-4 text-xs font-medium text-amber-900 leading-relaxed">
                    {entrega === "envio"
                      ? "💵 Pagás en efectivo cuando te entregamos el pedido en tu domicilio."
                      : "💡 Te damos un comprobante con un código. Lo presentás en el local, abonás y retirás tu compra. Reservamos tu stock mientras tanto."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <input
                      className={inputStyle}
                      placeholder="Número de tarjeta"
                      inputMode="numeric"
                      value={tarjeta.numero}
                      onChange={(e) =>
                        setTarjeta({
                          ...tarjeta,
                          numero: formatearNumero(e.target.value),
                        })
                      }
                    />
                    <input
                      className={inputStyle}
                      placeholder="Nombre del titular"
                      value={tarjeta.titular}
                      onChange={(e) =>
                        setTarjeta({ ...tarjeta, titular: e.target.value })
                      }
                    />
                    <div className="flex gap-3">
                      <input
                        className={inputStyle}
                        placeholder="MM/AA"
                        inputMode="numeric"
                        value={tarjeta.vencimiento}
                        onChange={(e) =>
                          setTarjeta({
                            ...tarjeta,
                            vencimiento: formatearVencimiento(e.target.value),
                          })
                        }
                      />
                      <input
                        className={inputStyle}
                        placeholder="CVV"
                        inputMode="numeric"
                        maxLength={4}
                        value={tarjeta.cvv}
                        onChange={(e) =>
                          setTarjeta({
                            ...tarjeta,
                            cvv: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      🔒 Modo demostración: no se realiza ningún cobro real.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pie del Carrito / Botón de Confirmación */}
        {!pedido && lineas.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6">
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600">
                ⚠️ {error}
              </div>
            )}
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total a pagar</span>
              <span className="text-2xl font-black text-slate-900">
                {formatearPrecio(total)}
              </span>
            </div>
            <button
              onClick={confirmar}
              disabled={procesando}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-rose-600 active:scale-98 disabled:cursor-wait disabled:opacity-60"
            >
              {procesando ? (
                "Procesando..."
              ) : metodo === "tarjeta" ? (
                <>
                  <span>💳</span>
                  <span>Pagar {formatearPrecio(total)}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Confirmar pedido</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}