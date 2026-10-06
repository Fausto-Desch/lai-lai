export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen: string;
}

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

export type MetodoPago = "efectivo" | "tarjeta";
export type EstadoPedido = "pendiente" | "pagado" | "cancelado";

export interface Pedido {
  id: string;
  codigo: string;
  fecha: string; // ISO
  comprador: { nombre: string; telefono: string; direccion: string };
  items: { productoId: string; nombre: string; precio: number; cantidad: number }[];
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  tarjetaUltimos4?: string;
}