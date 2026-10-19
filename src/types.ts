export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagenes: string[]; // la primera es la portada
}

export interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

export type MetodoPago = "efectivo" | "tarjeta";
export type EstadoPedido = "pendiente" | "pagado" | "cancelado";
export type Entrega = "retiro" | "envio";
export type EstadoFlete = "pendiente" | "enviado" | "entregado" | "cancelado";

// Solo lo ve el dueño en el panel
export interface Flete {
  id: string;
  codigo: string;
  estado: EstadoFlete;
  distanciaKm: number | null;
  ganancia: number;
  destino: { direccion: string; lat: number | null; lng: number | null };
  mensaje: string;
  urlWhatsApp: string;
  urlMapa: string;
}

export interface Pedido {
  id: string;
  codigo: string;
  fecha: string; // ISO
  comprador: { nombre: string; telefono: string; direccion: string };
  items: { productoId: string; nombre: string; precio: number; cantidad: number }[];
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  entrega: Entrega;
  tarjetaUltimos4?: string;
  flete?: Flete; // solo en las respuestas del admin
}