import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Pedido } from "../types";
import { obtenerPedido } from "../services/pedidos";
import { formatearPrecio } from "../utils/formato";

export default function Comprobante() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<Pedido | null | undefined>(undefined);

  useEffect(() => {
    obtenerPedido(id ?? "").then(setPedido);
  }, [id]);

  if (pedido === undefined) {
    return <p className="p-8 text-center text-gray-500">Cargando...</p>;
  }

  if (pedido === null) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-gray-600">No encontramos este pedido.</p>
        <Link to="/" className="text-red-700 hover:underline">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const estadoTexto = {
    pendiente: "Pendiente de pago",
    pagado: "Pagado",
    cancelado: "Cancelado",
  }[pedido.estado];

  return (
    <div className="min-h-screen bg-amber-50 p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md print:max-w-none print:shadow-none">
        <div className="mb-6 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold text-red-700">🏮  Lai Lai</h1>
          <p className="text-gray-600">Comprobante de pedido</p>
        </div>

        <div className="mb-6 rounded-lg border-2 border-dashed border-red-300 p-4 text-center">
          <p className="text-sm text-gray-500">Código de pedido</p>
          <p className="text-4xl font-bold tracking-widest">{pedido.codigo}</p>
        </div>

        <div className="mb-6 grid gap-1 text-sm">
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(pedido.fecha).toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Cliente:</strong> {pedido.comprador.nombre}
          </p>
          <p>
            <strong>Teléfono:</strong> {pedido.comprador.telefono}
          </p>
          {pedido.comprador.direccion && (
            <p>
              <strong>Dirección:</strong> {pedido.comprador.direccion}
            </p>
          )}
          <p>
            <strong>Forma de pago:</strong>{" "}
            {pedido.metodoPago === "efectivo"
              ? "Efectivo en el local"
              : `Tarjeta terminada en ${pedido.tarjetaUltimos4}`}
          </p>
          <p>
            <strong>Estado:</strong> {estadoTexto}
          </p>
        </div>

        <table className="mb-4 w-full text-left text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="py-2">Producto</th>
              <th className="py-2 text-center">Cant.</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((i) => (
              <tr key={i.productoId} className="border-b">
                <td className="py-2">{i.nombre}</td>
                <td className="py-2 text-center">{i.cantidad}</td>
                <td className="py-2 text-right">{formatearPrecio(i.precio)}</td>
                <td className="py-2 text-right">
                  {formatearPrecio(i.precio * i.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mb-6 text-right text-xl font-bold">
          Total: {formatearPrecio(pedido.total)}
        </p>

        {pedido.estado === "pendiente" && (
          <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-900 print:border">
            Presentá este comprobante en el local para abonar y retirar tu
            compra.
          </p>
        )}

        <div className="mt-8 flex justify-center gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-red-700 px-6 py-2 font-semibold text-white hover:bg-red-800"
          >
            Imprimir / Guardar PDF
          </button>
          <Link to="/" className="rounded-lg border px-6 py-2 hover:bg-gray-100">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}