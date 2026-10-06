import type { Producto } from "../types";

const KEY = "lai-lai-productos";

const iniciales: Producto[] = [
  {
    id: "1",
    nombre: "Set de palillos",
    descripcion: "Pack de 10 pares de palillos de bambú",
    precio: 3500,
    stock: 25,
    categoria: "Cocina",
    imagen: "",
  },
  {
    id: "2",
    nombre: "Taza de cerámica",
    descripcion: "Taza con diseño de dragón",
    precio: 5200,
    stock: 12,
    categoria: "Cocina",
    imagen: "",
  },
];

function leer(): Producto[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Producto[];
  } catch {
    // si el dato está corrupto, arrancamos de cero
  }
  localStorage.setItem(KEY, JSON.stringify(iniciales));
  return iniciales;
}

function guardar(productos: Producto[]) {
  localStorage.setItem(KEY, JSON.stringify(productos));
}

export async function listarProductos(): Promise<Producto[]> {
  return leer();
}

export async function guardarProducto(p: Producto): Promise<void> {
  const productos = leer();
  const i = productos.findIndex((x) => x.id === p.id);
  if (i >= 0) productos[i] = p;
  else productos.push(p);
  guardar(productos);
}

export async function eliminarProducto(id: string): Promise<void> {
  guardar(leer().filter((p) => p.id !== id));
}

// Valida todo antes de modificar nada: la compra nunca queda a medias
export async function descontarStock(
  items: { productoId: string; cantidad: number }[]
): Promise<void> {
  const productos = leer();
  for (const item of items) {
    const p = productos.find((x) => x.id === item.productoId);
    if (!p || p.stock < item.cantidad) {
      throw new Error(`Stock insuficiente para ${p?.nombre ?? "un producto"}`);
    }
  }
  for (const item of items) {
    const p = productos.find((x) => x.id === item.productoId)!;
    p.stock -= item.cantidad;
  }
  guardar(productos);
}

export async function reponerStock(
  items: { productoId: string; cantidad: number }[]
): Promise<void> {
  const productos = leer();
  for (const item of items) {
    const p = productos.find((x) => x.id === item.productoId);
    if (p) p.stock += item.cantidad;
  }
  guardar(productos);
}