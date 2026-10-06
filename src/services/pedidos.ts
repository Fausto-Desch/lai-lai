import type { EstadoPedido, Pedido } from "../types";
import { reponerStock } from "./productos";

const KEY = "lai-lai-pedidos";

export type NuevoPedido = Omit<Pedido, "id" | "codigo" | "fecha">;

function leer(): Pedido[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      return (JSON.parse(raw) as Partial<Pedido>[]).map((p) => ({
        ...p,
        codigo: p.codigo ?? (p.id ?? "").slice(0, 8).toUpperCase(),
        metodoPago: p.metodoPago ?? "efectivo",
        estado: p.estado ?? "pendiente",
      })) as Pedido[];
    }
  } catch {
    // dato corrupto: arrancamos de cero
  }
  return [];
}

function guardar(lista: Pedido[]) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

// Sin letras ni números ambiguos (0/O, 1/I) para que sea fácil de dictar
function generarCodigo(existentes: Set<string>): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  do {
    codigo = "LL-";
    for (let i = 0; i < 6; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (existentes.has(codigo));
  return codigo;
}

export async function listarPedidos(): Promise<Pedido[]> {
  return leer().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function obtenerPedido(id: string): Promise<Pedido | null> {
  return leer().find((p) => p.id === id) ?? null;
}

export async function crearPedido(datos: NuevoPedido): Promise<Pedido> {
  const lista = leer();
  const pedido: Pedido = {
    ...datos,
    id: crypto.randomUUID(),
    codigo: generarCodigo(new Set(lista.map((p) => p.codigo))),
    fecha: new Date().toISOString(),
  };
  lista.push(pedido);
  guardar(lista);
  return pedido;
}

export async function cambiarEstado(
  id: string,
  estado: EstadoPedido
): Promise<void> {
  guardar(leer().map((p) => (p.id === id ? { ...p, estado } : p)));
}

export async function cancelarPedido(id: string): Promise<void> {
  const lista = leer();
  const pedido = lista.find((p) => p.id === id);
  if (!pedido || pedido.estado === "cancelado") return;

  await reponerStock(pedido.items);
  guardar(lista.map((p) => (p.id === id ? { ...p, estado: "cancelado" } : p)));
}