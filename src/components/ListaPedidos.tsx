import { useCallback, useEffect, useMemo, useState } from "react";
import type { EstadoPedido, Pedido } from "../types";
import {
  cambiarEstado,
  cancelarPedido,
  listarPedidos,
} from "../services/pedidos";
import { formatearPrecio } from "../utils/formato";

interface Props {
  onCambio?: () => void;
}

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

export default function ListaPedidos({ onCambio }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | EstadoPedido>("todos");

  const cargar = useCallback(() => {
    listarPedidos().then(setPedidos);
  }, []);

  useEffect(() => {
    cargar();
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
    await cambiarEstado(p.id, "pagado");
    cargar();
  };

  const cancelar = async (p: Pedido) => {
    if (!confirm(`¿Cancelar el pedido ${p.codigo}? El stock se va a reponer.`))
      return;
    await cancelarPedido(p.id);
    cargar();
    onCambio?.();
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilosEstado[p.estado]}`}
                  >
                    {etiquetaEstado[p.estado]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {p.metodoPago === "efectivo"
                      ? "💵 Efectivo"
                      : `💳 Tarjeta ····${p.tarjetaUltimos4}`}
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