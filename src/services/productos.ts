import type { Producto } from "../types";
import { api } from "./api";

/**
 * Datos que se envían al crear o editar un producto.
 * Las imágenes pueden ser rutas existentes ("/uploads/...") o fotos nuevas
 * en base64: el servidor distingue cuál es cuál.
 */
export type DatosProducto = Omit<Producto, "id">;

/** Devuelve todos los productos. */
export const listarProductos = () => api<Producto[]>("/productos");

/** Crea un producto nuevo. */
export const crearProducto = (datos: DatosProducto) =>
  api<Producto>("/productos", {
    metodo: "POST",
    cuerpo: datos,
    auth: true,
  });

/** Reemplaza los datos de un producto existente. */
export const actualizarProducto = (id: string, datos: DatosProducto) =>
  api<Producto>(`/productos/${id}`, {
    metodo: "PUT",
    cuerpo: datos,
    auth: true,
  });

/** Suma o resta unidades de stock (`delta` puede ser negativo). */
export const modificarStock = (id: string, delta: number) =>
  api<Producto>(`/productos/${id}/stock`, {
    metodo: "PATCH",
    cuerpo: { delta },
    auth: true,
  });

/** Elimina un producto. */
export const eliminarProducto = (id: string) =>
  api<void>(`/productos/${id}`, {
    metodo: "DELETE",
    auth: true,
  });