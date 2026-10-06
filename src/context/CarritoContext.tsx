import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ItemCarrito, Producto } from "../types";

const KEY = "lai-lai-carrito";

interface CarritoCtx {
  items: ItemCarrito[];
  cantidadTotal: number;
  agregar: (p: Producto) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  quitar: (productoId: string) => void;
  vaciar: () => void;
}

const Ctx = createContext<CarritoCtx | null>(null);

function leer(): ItemCarrito[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ItemCarrito[];
  } catch {
    // dato corrupto: arrancamos con el carrito vacío
  }
  return [];
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(leer);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const agregar = (p: Producto) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === p.id);
      if (existente) {
        if (existente.cantidad >= p.stock) return prev; // no superar el stock
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      if (p.stock < 1) return prev;
      return [...prev, { productoId: p.id, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (productoId: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.productoId !== productoId)
        : prev.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i
          )
    );
  };

  const quitar = (productoId: string) =>
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));

  const vaciar = () => setItems([]);

  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <Ctx.Provider
      value={{ items, cantidadTotal, agregar, cambiarCantidad, quitar, vaciar }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}