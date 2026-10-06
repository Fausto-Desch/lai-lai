import { useState } from "react";
import type { MetodoPago, Pedido, Producto } from "../types";
import { useCarrito } from "../context/CarritoContext";
import { descontarStock, reponerStock } from "../services/productos";
import { crearPedido } from "../services/pedidos";
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
    if (metodo === "tarjeta") {
      const msg = validarTarjeta();
      if (msg) {
        setError(msg);
        return;
      }
    }

    const itemsPedido = lineas.map((l) => ({
      productoId: l.producto.id,
      cantidad: l.cantidad,
    }));

    setProcesando(true);
    try {
      // 1. Reservamos el stock (valida que alcance, todo o nada)
      await descontarStock(itemsPedido);

      // 2. Si es tarjeta, procesamos el pago; si falla, devolvemos el stock
      let ultimos4: string | undefined;
      if (metodo === "tarjeta") {
        const res = await procesarPagoTarjeta(tarjeta, total);
        if (!res.aprobado) {
          await reponerStock(itemsPedido);
          setError(res.motivo ?? "No se pudo procesar el pago");
          return;
        }
        ultimos4 = res.ultimos4;
      }

      // 3. Registramos el pedido
      let nuevo: Pedido;
      try {
        nuevo = await crearPedido({
          comprador: {
            nombre: datos.nombre.trim(),
            telefono: datos.telefono.trim(),
            direccion: datos.direccion.trim(),
          },
          items: lineas.map((l) => ({
            productoId: l.producto.id,
            nombre: l.producto.nombre,
            precio: l.producto.precio,
            cantidad: l.cantidad,
          })),
          total,
          metodoPago: metodo,
          estado: metodo === "tarjeta" ? "pagado" : "pendiente",
          tarjetaUltimos4: ultimos4,
        });
      } catch {
        await reponerStock(itemsPedido);
        throw new Error("No se pudo registrar el pedido. Probá de nuevo.");
      }

      vaciar();
      setDatos(datosVacios);
      setTarjeta(tarjetaVacia);
      setPedido(nuevo);
      onCompraExitosa();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la compra"
      );
    } finally {
      setProcesando(false);
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-600";

  const botonMetodo = (valor: MetodoPago, texto: string) => (
    <button
      type="button"
      onClick={() => setMetodo(valor)}
      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
        metodo === valor
          ? "border-red-700 bg-red-50 text-red-800"
          : "border-gray-300 hover:bg-gray-50"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={cerrar}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-xl font-bold">Tu carrito</h2>
          <button
            onClick={cerrar}
            className="text-2xl text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {pedido ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-green-700">
                ¡Pedido realizado! 🎉
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Tu código de pedido es
              </p>
              <p className="my-2 text-3xl font-bold tracking-wider text-red-700">
                {pedido.codigo}
              </p>
              {pedido.metodoPago === "efectivo" ? (
                <p className="text-sm text-gray-600">
                  Presentá este código en el local para abonar{" "}
                  <strong>{formatearPrecio(pedido.total)}</strong> y retirar tu
                  compra.
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Pago aprobado con tarjeta terminada en{" "}
                  {pedido.tarjetaUltimos4}.
                </p>
              )}
              <a
                href={`/comprobante/${pedido.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-lg bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
              >
                Ver e imprimir comprobante
              </a>
            </div>
          ) : lineas.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              El carrito está vacío.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-4">
                {lineas.map(({ producto, cantidad }) => (
                  <li
                    key={producto.id}
                    className="flex items-center gap-3 border-b pb-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {formatearPrecio(producto.precio)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          cambiarCantidad(producto.id, cantidad - 1)
                        }
                        className="h-8 w-8 rounded border hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center">{cantidad}</span>
                      <button
                        onClick={() =>
                          cambiarCantidad(producto.id, cantidad + 1)
                        }
                        disabled={cantidad >= producto.stock}
                        className="h-8 w-8 rounded border hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-24 text-right">
                      <p className="font-semibold">
                        {formatearPrecio(producto.precio * cantidad)}
                      </p>
                      <button
                        onClick={() => quitar(producto.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3">
                <h3 className="font-semibold">Tus datos</h3>
                <input
                  className={input}
                  placeholder="Nombre y apellido"
                  value={datos.nombre}
                  onChange={(e) =>
                    setDatos({ ...datos, nombre: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Teléfono"
                  value={datos.telefono}
                  onChange={(e) =>
                    setDatos({ ...datos, telefono: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Dirección (opcional)"
                  value={datos.direccion}
                  onChange={(e) =>
                    setDatos({ ...datos, direccion: e.target.value })
                  }
                />
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <h3 className="font-semibold">Forma de pago</h3>
                <div className="flex gap-2">
                  {botonMetodo("efectivo", "💵 Efectivo en el local")}
                  {botonMetodo("tarjeta", "💳 Tarjeta")}
                </div>

                {metodo === "efectivo" ? (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    Te damos un comprobante con un código. Lo presentás en el
                    local, abonás y retirás tu compra. Reservamos tu stock
                    mientras tanto.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      className={input}
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
                      className={input}
                      placeholder="Nombre del titular"
                      value={tarjeta.titular}
                      onChange={(e) =>
                        setTarjeta({ ...tarjeta, titular: e.target.value })
                      }
                    />
                    <div className="flex gap-3">
                      <input
                        className={input}
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
                        className={input}
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
                    <p className="text-xs text-gray-500">
                      Modo demostración: no se realiza ningún cobro real.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!pedido && lineas.length > 0 && (
          <div className="border-t p-5">
            {error && (
              <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mb-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatearPrecio(total)}</span>
            </div>
            <button
              onClick={confirmar}
              disabled={procesando}
              className="w-full rounded-lg bg-red-700 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
            >
              {procesando
                ? "Procesando..."
                : metodo === "tarjeta"
                ? "Pagar con tarjeta"
                : "Confirmar pedido"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}