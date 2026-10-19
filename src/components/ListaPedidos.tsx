import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EstadoFlete, EstadoPedido, Pedido } from "../types";
import {
  actualizarFlete,
  cambiarEstado,
  cancelarPedido,
  listarPedidos,
} from "../services/pedidos";
import { formatearPrecio } from "../utils/formato";

interface Props {
  onCambio?: () => void;
}

const INTERVALO_MS = 15000;

const estilosEstado: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  pagado: "bg-green-100 text-green-800",
  cancelado: "bg-gray-200 text-gray-600",
};

const etiquetaEstado: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const estilosFlete: Record<EstadoFlete, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  enviado: "bg-blue-100 text-blue-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-gray-200 text-gray-600",
};

const etiquetaFlete: Record<EstadoFlete, string> = {
  pendiente: "Sin enviar al flete",
  enviado: "Enviado al flete",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const mensajeDe = (err: unknown, porDefecto: string) =>
  err instanceof Error ? err.message : porDefecto;

export default function ListaPedidos({ onCambio }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [nuevos, setNuevos] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | EstadoPedido>("todos");
  const vistos = useRef<Set<string> | null>(null);

  const cargar = useCallback(() => {
    listarPedidos()
      .then((lista) => {
        setPedidos(lista);

        // La primera carga no cuenta: solo marcamos lo que llega después
        if (vistos.current === null) {
          vistos.current = new Set(lista.map((p) => p.id));
          return;
        }
        const conocidos = vistos.current;
        const recientes = lista.filter((p) => !conocidos.has(p.id));
        if (recientes.length > 0) {
          recientes.forEach((p) => conocidos.add(p.id));
          setNuevos((prev) => new Set([...prev, ...recientes.map((p) => p.id)]));
        }
      })
      .catch(() => {
        // si falla una actualización, se reintenta en la próxima
      });
  }, []);

  // Carga inicial y actualización automática
  useEffect(() => {
    cargar();
    const temporizador = window.setInterval(cargar, INTERVALO_MS);
    return () => window.clearInterval(temporizador);
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter(
      (p) =>
        (filtro === "todos" || p.estado === filtro) &&
        (p.codigo.toLowerCase().includes(q) ||
          p.comprador.nombre.toLowerCase().includes(q))
    );
  }, [pedidos, busqueda, filtro]);

  const pendientes = pedidos.filter((p) => p.estado === "pendiente").length;

  const marcarPagado = async (p: Pedido) => {
    try {
      await cambiarEstado(p.id, "pagado");
      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo actualizar el pedido"));
    }
  };

  const cancelar = async (p: Pedido) => {
    if (!confirm(`¿Cancelar el pedido ${p.codigo}? El stock se va a reponer.`))
      return;
    try {
      await cancelarPedido(p.id);
      cargar();
      onCambio?.();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo cancelar el pedido"));
    }
  };

  // Abre WhatsApp con el mensaje armado y marca el viaje como enviado
  const enviarAlFlete = async (p: Pedido) => {
    if (!p.flete) return;
    window.open(p.flete.urlWhatsApp, "_blank", "noopener,noreferrer");
    if (p.flete.estado === "pendiente") {
      try {
        await actualizarFlete(p.id, { estado: "enviado" });
        cargar();
      } catch (err) {
        alert(mensajeDe(err, "No se pudo actualizar el viaje"));
      }
    }
  };

  const marcarEntregado = async (p: Pedido) => {
    try {
      await actualizarFlete(p.id, { estado: "entregado" });
      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo actualizar el viaje"));
    }
  };

  const editarGanancia = async (p: Pedido) => {
    if (!p.flete) return;
    const respuesta = prompt(
      "Ganancia del flete por este viaje (en pesos):",
      String(p.flete.ganancia)
    );
    if (respuesta === null) return;
    const ganancia = Number(respuesta);
    if (!Number.isInteger(ganancia) || ganancia < 0) {
      alert("Ingresá un número entero, 0 o más");
      return;
    }
    try {
      await actualizarFlete(p.id, { ganancia });
      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo cambiar la ganancia"));
    }
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">
        Pedidos ({pedidos.length}) · {pendientes} pendientes de pago
      </h2>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código o nombre (ej. LL-7K2M9P)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-600"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as "todos" | EstadoPedido)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-600"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="text-gray-500">No hay pedidos para mostrar.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visibles.map((p) => (
            <li key={p.id} className="rounded-lg border border-red-100 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold tracking-wider">
                    {p.codigo}
                  </span>
                  {nuevos.has(p.id) && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      🆕 Nuevo
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilosEstado[p.estado]}`}
                  >
                    {etiquetaEstado[p.estado]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {p.metodoPago === "efectivo"
                      ? "💵 Efectivo"
                      : `💳 Tarjeta ····${p.tarjetaUltimos4}`}
                    {" · "}
                    {p.entrega === "envio" ? "🚚 Envío" : "🏪 Retiro"}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(p.fecha).toLocaleString("es-AR")}
                </span>
              </div>

              <p className="text-sm">
                <strong>{p.comprador.nombre}</strong> · 📞{" "}
                {p.comprador.telefono}
                {p.comprador.direccion && <> · 📍 {p.comprador.direccion}</>}
              </p>

              <ul className="my-2 text-sm text-gray-700">
                {p.items.map((i) => (
                  <li key={i.productoId}>
                    {i.cantidad} × {i.nombre} —{" "}
                    {formatearPrecio(i.precio * i.cantidad)}
                  </li>
                ))}
              </ul>

              {/* Viaje del flete */}
              {p.entrega === "envio" && p.flete && (
                <div className="mb-3 rounded-lg bg-sky-50 p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      🚚 Flete {p.flete.codigo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilosFlete[p.flete.estado]}`}
                    >
                      {etiquetaFlete[p.flete.estado]}
                    </span>
                  </div>

                  <p>📍 {p.flete.destino.direccion}</p>
                  <p>
                    📏{" "}
                    {p.flete.distanciaKm !== null
                      ? `${p.flete.distanciaKm.toLocaleString("es-AR")} km`
                      : "Distancia sin calcular"}
                    {" · "}💰 Ganancia: {formatearPrecio(p.flete.ganancia)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {p.flete.estado !== "cancelado" &&
                      p.flete.estado !== "entregado" && (
                        <button
                          onClick={() => enviarAlFlete(p)}
                          className="font-semibold text-green-700 hover:underline"
                        >
                          📲{" "}
                          {p.flete.estado === "pendiente"
                            ? "Enviar al flete por WhatsApp"
                            : "Reenviar por WhatsApp"}
                        </button>
                      )}
                    <a
                      href={p.flete.urlMapa}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      🗺️ Ver ruta
                    </a>
                    {p.flete.estado !== "cancelado" &&
                      p.flete.estado !== "entregado" && (
                        <>
                          <button
                            onClick={() => editarGanancia(p)}
                            className="text-gray-700 hover:underline"
                          >
                            ✏️ Editar ganancia
                          </button>
                          <button
                            onClick={() => marcarEntregado(p)}
                            className="text-gray-700 hover:underline"
                          >
                            ✅ Marcar entregado
                          </button>
                        </>
                      )}
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600">
                      Ver el mensaje que recibe el flete
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-white p-2 text-xs">
                      {p.flete.mensaje}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-x-4 text-sm">
                  <a
                    href={`/comprobante/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    Ver comprobante
                  </a>
                  {p.estado === "pendiente" && (
                    <button
                      onClick={() => marcarPagado(p)}
                      className="font-medium text-green-700 hover:underline"
                    >
                      Marcar como pagado
                    </button>
                  )}
                  {p.estado !== "cancelado" && (
                    <button
                      onClick={() => cancelar(p)}
                      className="text-red-700 hover:underline"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold">
                  Total: {formatearPrecio(p.total)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}