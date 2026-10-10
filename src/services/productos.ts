import type { Producto } from "../types";
import { api } from "./api";

// Lo que se manda al crear o editar. Las imágenes pueden ser rutas que ya
// existen ("/uploads/...") o fotos nuevas en base64: el servidor distingue.
export type DatosProducto = Omit<Producto, "id">;

export const listarProductos = () => api<Producto[]>("/productos");

export const crearProducto = (datos: DatosProducto) =>
  api<Producto>("/productos", { metodo: "POST", cuerpo: datos, auth: true });

export const actualizarProducto = (id: string, datos: DatosProducto) =>
  api<Producto>(`/productos/${id}`, {
    metodo: "PUT",
    cuerpo: datos,
    auth: true,
  });

// Suma o resta unidades de stock (delta puede ser negativo)
export const modificarStock = (id: string, delta: number) =>
  api<Producto>(`/productos/${id}/stock`, {
    metodo: "PATCH",
    cuerpo: { delta },
    auth: true,
  });

export const eliminarProducto = (id: string) =>
  api<void>(`/productos/${id}`, { metodo: "DELETE", auth: true });