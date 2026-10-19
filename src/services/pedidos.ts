import type { Entrega, EstadoPedido, MetodoPago, Pedido } from "../types";
import { api } from "./api";

export interface NuevoPedido {
  comprador: Pedido["comprador"];
  items: { productoId: string; cantidad: number }[];
  metodoPago: MetodoPago;
  entrega: Entrega;
  tarjetaUltimos4?: string;
}

export interface FiltrosPedidos {
  estado?: EstadoPedido;
  metodo?: MetodoPago;
  desde?: string; // fecha ISO
  hasta?: string; // fecha ISO
  q?: string; // código o nombre del cliente
}

// El precio y el total los calcula el servidor
export const crearPedido = (datos: NuevoPedido) =>
  api<Pedido>("/pedidos", { metodo: "POST", cuerpo: datos });

// Para el comprobante del cliente. Devuelve null si no existe.
export const obtenerPedido = (id: string) =>
  api<Pedido>(`/pedidos/${id}`).catch(() => null);

// Historial del admin (incluye los datos del flete)
export function listarPedidos(filtros: FiltrosPedidos = {}) {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) params.set(clave, valor);
  }
  const consulta = params.toString();
  return api<Pedido[]>(`/pedidos${consulta ? `?${consulta}` : ""}`, {
    auth: true,
  });
}

export const cambiarEstado = (id: string, estado: EstadoPedido) =>
  api<Pedido>(`/pedidos/${id}`, {
    metodo: "PATCH",
    cuerpo: { estado },
    auth: true,
  });

// Cancelar repone el stock (lo hace el servidor)
export const cancelarPedido = (id: string) => cambiarEstado(id, "cancelado");

// Viaje del flete: marcar como enviado o entregado, o cambiar la ganancia
export const actualizarFlete = (
  pedidoId: string,
  cambios: { estado?: "enviado" | "entregado"; ganancia?: number }
) =>
  api<Pedido>(`/pedidos/${pedidoId}/flete`, {
    metodo: "PATCH",
    cuerpo: cambios,
    auth: true,
  });