import { Router } from "express";
import { randomInt, randomUUID } from "node:crypto";
import { db } from "../db";
import { requerirAdmin } from "../auth";
import { ErrorNegocio } from "../errores";

export const rutasPedidos = Router();

const METODOS = ["efectivo", "tarjeta"] as const;
const ESTADOS = ["pendiente", "pagado", "cancelado"] as const;
type Metodo = (typeof METODOS)[number];
type Estado = (typeof ESTADOS)[number];

interface FilaPedido {
  id: string;
  codigo: string;
  fecha: string;
  comprador_nombre: string;
  comprador_telefono: string;
  comprador_direccion: string;
  total: number;
  metodo_pago: Metodo;
  estado: Estado;
  tarjeta_ultimos4: string | null;
}

interface FilaItem {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

const COLUMNAS = `id, codigo, fecha, comprador_nombre, comprador_telefono,
  comprador_direccion, total, metodo_pago, estado, tarjeta_ultimos4`;

const itemsDe = db.prepare(
  "SELECT producto_id, nombre, precio, cantidad FROM pedido_items WHERE pedido_id = ? ORDER BY id"
);

// Misma forma que el tipo Pedido del frontend
function aPedido(f: FilaPedido) {
  const items = itemsDe.all(f.id) as FilaItem[];
  return {
    id: f.id,
    codigo: f.codigo,
    fecha: f.fecha,
    comprador: {
      nombre: f.comprador_nombre,
      telefono: f.comprador_telefono,
      direccion: f.comprador_direccion,
    },
    items: items.map((i) => ({
      productoId: i.producto_id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
    })),
    total: f.total,
    metodoPago: f.metodo_pago,
    estado: f.estado,
    ...(f.tarjeta_ultimos4 ? { tarjetaUltimos4: f.tarjeta_ultimos4 } : {}),
  };
}

function leerPedido(id: string): FilaPedido {
  const fila = db
    .prepare(`SELECT ${COLUMNAS} FROM pedidos WHERE id = ?`)
    .get(id) as FilaPedido | undefined;
  if (!fila) throw new ErrorNegocio("Pedido no encontrado", 404);
  return fila;
}

/* ---------- Crear pedido ---------- */

interface DatosPedido {
  nombre: string;
  telefono: string;
  direccion: string;
  items: { productoId: string; cantidad: number }[];
  metodo: Metodo;
  ultimos4: string | null;
}

const texto = (valor: unknown, max: number) =>
  typeof valor === "string" ? valor.trim().slice(0, max) : "";

function validarPedido(body: unknown): DatosPedido {
  const b = (body ?? {}) as Record<string, unknown>;
  const comprador = (b.comprador ?? {}) as Record<string, unknown>;

  const nombre = texto(comprador.nombre, 100);
  const telefono = texto(comprador.telefono, 40);
  const direccion = texto(comprador.direccion, 200);
  if (!nombre || !telefono) {
    throw new ErrorNegocio("Nombre y teléfono son obligatorios");
  }

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    throw new ErrorNegocio("El pedido no tiene productos");
  }

  // Si un mismo producto viene repetido, sumamos las cantidades
  const acumulado = new Map<string, number>();
  for (const item of b.items as Record<string, unknown>[]) {
    const productoId = typeof item?.productoId === "string" ? item.productoId : "";
    const cantidad = item?.cantidad;
    if (
      !productoId ||
      !Number.isInteger(cantidad) ||
      (cantidad as number) < 1 ||
      (cantidad as number) > 999
    ) {
      throw new ErrorNegocio("Los productos del pedido no son válidos");
    }
    acumulado.set(productoId, (acumulado.get(productoId) ?? 0) + (cantidad as number));
  }

  if (!METODOS.includes(b.metodoPago as Metodo)) {
    throw new ErrorNegocio("Forma de pago no válida");
  }
  const metodo = b.metodoPago as Metodo;

  // DEMO: el pago con tarjeta se simula en el frontend. Con una pasarela
  // real (Mercado Pago), el servidor confirmaría el pago por su cuenta.
  let ultimos4: string | null = null;
  if (metodo === "tarjeta") {
    if (typeof b.tarjetaUltimos4 !== "string" || !/^\d{4}$/.test(b.tarjetaUltimos4)) {
      throw new ErrorNegocio("Falta confirmar el pago con tarjeta");
    }
    ultimos4 = b.tarjetaUltimos4;
  }

  return {
    nombre,
    telefono,
    direccion,
    items: [...acumulado].map(([productoId, cantidad]) => ({ productoId, cantidad })),
    metodo,
    ultimos4,
  };
}

const obtenerProducto = db.prepare(
  "SELECT nombre, precio, stock FROM productos WHERE id = ?"
);
const descontar = db.prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
const reponer = db.prepare("UPDATE productos SET stock = stock + ? WHERE id = ?");
const existeCodigo = db.prepare("SELECT 1 FROM pedidos WHERE codigo = ?");
const insertarPedido = db.prepare(
  `INSERT INTO pedidos
   (id, codigo, fecha, comprador_nombre, comprador_telefono, comprador_direccion,
    total, metodo_pago, estado, tarjeta_ultimos4)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertarItem = db.prepare(
  `INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad)
   VALUES (?, ?, ?, ?, ?)`
);

// Sin letras ni números ambiguos (0/O, 1/I) para que sea fácil de dictar
function generarCodigo(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo: string;
  do {
    codigo = "LL-";
    for (let i = 0; i < 6; i++) codigo += letras[randomInt(letras.length)];
  } while (existeCodigo.get(codigo));
  return codigo;
}

// Todo dentro de una transacción: o se guarda todo, o no se guarda nada
const crearPedido = db.transaction((datos: DatosPedido): string => {
  let total = 0;
  const lineas = datos.items.map((it) => {
    const producto = obtenerProducto.get(it.productoId) as
      | { nombre: string; precio: number; stock: number }
      | undefined;
    if (!producto) {
      throw new ErrorNegocio("Un producto del carrito ya no está disponible", 409);
    }
    if (producto.stock < it.cantidad) {
      throw new ErrorNegocio(`Stock insuficiente para ${producto.nombre}`, 409);
    }
    descontar.run(it.cantidad, it.productoId);
    total += producto.precio * it.cantidad; // el precio sale de la base
    return {
      productoId: it.productoId,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: it.cantidad,
    };
  });

  const id = randomUUID();
  insertarPedido.run(
    id,
    generarCodigo(),
    new Date().toISOString(),
    datos.nombre,
    datos.telefono,
    datos.direccion,
    total,
    datos.metodo,
    datos.metodo === "tarjeta" ? "pagado" : "pendiente",
    datos.ultimos4
  );
  for (const l of lineas) {
    insertarItem.run(id, l.productoId, l.nombre, l.precio, l.cantidad);
  }
  return id;
});

// Público: lo usa el cliente al comprar
rutasPedidos.post("/", (req, res) => {
  const id = crearPedido(validarPedido(req.body));
  res.status(201).json(aPedido(leerPedido(id)));
});

/* ---------- Consultar ---------- */

// Admin: historial con filtros (estado, metodo, desde, hasta, q)
rutasPedidos.get("/", requerirAdmin, (req, res) => {
  const { estado, metodo, desde, hasta, q } = req.query;
  const where: string[] = [];
  const params: string[] = [];

  if (typeof estado === "string" && ESTADOS.includes(estado as Estado)) {
    where.push("estado = ?");
    params.push(estado);
  }
  if (typeof metodo === "string" && METODOS.includes(metodo as Metodo)) {
    where.push("metodo_pago = ?");
    params.push(metodo);
  }

  const aIso = (v: unknown) =>
    typeof v === "string" && !Number.isNaN(Date.parse(v))
      ? new Date(v).toISOString()
      : null;
  const fechaDesde = aIso(desde);
  const fechaHasta = aIso(hasta);
  if (fechaDesde) {
    where.push("fecha >= ?");
    params.push(fechaDesde);
  }
  if (fechaHasta) {
    where.push("fecha < ?"); // "hasta" no incluye el instante exacto
    params.push(fechaHasta);
  }

  if (typeof q === "string" && q.trim()) {
    where.push("(codigo LIKE ? OR comprador_nombre LIKE ?)");
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  const sql = `SELECT ${COLUMNAS} FROM pedidos
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY fecha DESC LIMIT 500`;
  const filas = db.prepare(sql).all(...params) as FilaPedido[];
  res.json(filas.map(aPedido));
});

// Público por id: lo usa el cliente para ver su comprobante. El id es un
// UUID imposible de adivinar, por eso alcanza como "llave" del comprobante.
rutasPedidos.get("/:id", (req, res) => {
  res.json(aPedido(leerPedido(req.params.id)));
});

/* ---------- Cambiar estado (admin) ---------- */

const cancelar = db.transaction((id: string) => {
  const items = db
    .prepare("SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?")
    .all(id) as { producto_id: string; cantidad: number }[];
  for (const item of items) reponer.run(item.cantidad, item.producto_id);
  db.prepare("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?").run(id);
});

rutasPedidos.patch("/:id", requerirAdmin, (req, res) => {
  const actual = leerPedido(String(req.params.id));
  const nuevo = req.body?.estado;

  if (nuevo === "pagado") {
    if (actual.estado === "cancelado") {
      throw new ErrorNegocio(
        "Un pedido cancelado no se puede marcar como pagado",
        409
      );
    }
    db.prepare("UPDATE pedidos SET estado = 'pagado' WHERE id = ?").run(actual.id);
  } else if (nuevo === "cancelado") {
    if (actual.estado !== "cancelado") cancelar(actual.id); // repone el stock
  } else {
    throw new ErrorNegocio("Estado no válido");
  }

  res.json(aPedido(leerPedido(actual.id)));
});