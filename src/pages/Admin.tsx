import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Producto } from "../types";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  modificarStock,
} from "../services/productos";
import { useAuth } from "../context/AuthContext";
import { formatearPrecio } from "../utils/formato";
import { archivoAImagen } from "../utils/imagen";
import { LOCAL_INFO } from "../config";
import ListaPedidos from "../components/ListaPedidos";

const MAX_IMAGENES = 5;
const UMBRAL_STOCK_DEFAULT = 5;
const CLAVE_HISTORIAL_STOCK = "lai-lai-historial-stock";
const CLAVE_ALERTAS_STOCK = "lai-lai-alertas-stock";

type MovimientoStock = {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: "Ingreso" | "Retiro" | "Ajuste";
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  fecha: string;
  fechaISO?: string;
};

const vacio = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  categoria: "",
};

const mensajeDe = (err: unknown, porDefecto: string) =>
  err instanceof Error ? err.message : porDefecto;

// Devuelve la fecha actual según el horario local del navegador.
const obtenerFechaLocalISO = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

// Escapa los valores para evitar problemas con comillas y separadores en CSV.
const escaparCSV = (valor: string | number) =>
  `"${String(valor).replace(/"/g, '""')}"`;

// Genera y descarga un archivo CSV sin instalar dependencias.
const descargarCSV = (
  movimientos: MovimientoStock[],
  nombreArchivo: string,
) => {
  if (movimientos.length === 0) {
    alert("No hay movimientos para descargar.");
    return;
  }

  const encabezados = [
    "Fecha y hora",
    "ID del producto",
    "Producto",
    "Tipo de movimiento",
    "Cantidad",
    "Stock anterior",
    "Stock final",
  ];

  const filas = movimientos.map((m) => [
    m.fecha,
    m.productoId,
    m.productoNombre,
    m.tipo,
    m.cantidad,
    m.stockAnterior,
    m.stockNuevo,
  ]);

  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCSV).join(";"))
    .join("\r\n");

  // El BOM permite que Excel interprete correctamente los acentos.
  const blob = new Blob(["\uFEFF", contenido], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  // Revocamos la URL después de iniciar la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function Admin() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState(vacio);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<
    "todos" | "bajo" | "agotado"
  >("todos");
  const [umbralStock, setUmbralStock] = useState(UMBRAL_STOCK_DEFAULT);

  const [historial, setHistorial] = useState<MovimientoStock[]>(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_HISTORIAL_STOCK);
      return guardado
        ? (JSON.parse(guardado) as MovimientoStock[])
        : [];
    } catch {
      return [];
    }
  });

  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [aviso, setAviso] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    listarProductos()
      .then(setProductos)
      .catch(() => setError("No se pudo cargar la lista de productos"));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Guarda el historial en este navegador para que sobreviva al recargar.
  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE_HISTORIAL_STOCK,
        JSON.stringify(historial),
      );
    } catch {
      setAviso("No se pudo guardar el historial en este navegador.");
    }
  }, [historial]);

  // Detecta productos agotados o con stock bajo.
  useEffect(() => {
    if (!productos.length) return;

    const estados = productos
      .filter((p) => p.stock === 0 || p.stock <= umbralStock)
      .map((p) => `${p.id}:${p.stock === 0 ? "agotado" : "bajo"}`)
      .sort();

    const firmaActual = estados.join("|");

    try {
      const firmaAnterior =
        localStorage.getItem(CLAVE_ALERTAS_STOCK) ?? "";

      if (firmaActual !== firmaAnterior && firmaActual) {
        const agotados = productos.filter((p) => p.stock === 0).length;
        const bajos = productos.filter(
          (p) => p.stock > 0 && p.stock <= umbralStock,
        ).length;

        const mensaje = [
          agotados ? `${agotados} producto(s) agotado(s)` : "",
          bajos ? `${bajos} producto(s) con stock bajo` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        setAviso(`Atención: ${mensaje}. Revisá el inventario.`);

        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(`${LOCAL_INFO.nombre}: alerta de stock`, {
            body: mensaje,
          });
        }
      }

      localStorage.setItem(CLAVE_ALERTAS_STOCK, firmaActual);
    } catch {
      // El panel sigue funcionando aunque localStorage esté bloqueado.
    }
  }, [productos, umbralStock]);

  // Registra un movimiento con fecha y hora exactas.
  const registrarMovimiento = (
    producto: Producto,
    tipo: MovimientoStock["tipo"],
    cantidad: number,
    stockAnterior: number,
    stockNuevo: number,
  ) => {
    if (stockAnterior === stockNuevo) return;

    const ahora = new Date();

    const movimiento: MovimientoStock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productoId: producto.id,
      productoNombre: producto.nombre,
      tipo,
      cantidad,
      stockAnterior,
      stockNuevo,
      fecha: ahora.toLocaleString("es-AR"),
      fechaISO: ahora.toISOString(),
    };

    setHistorial((actual) => [movimiento, ...actual].slice(0, 100));
  };

  // Solicita permiso para las notificaciones del navegador.
  const solicitarPermisoNotificaciones = async () => {
    if (!("Notification" in window)) {
      setAviso("Este navegador no admite notificaciones de escritorio.");
      return;
    }

    try {
      const permiso = await Notification.requestPermission();

      setAviso(
        permiso === "granted"
          ? "Notificaciones del navegador activadas."
          : "No se concedió permiso para mostrar notificaciones.",
      );
    } catch {
      setAviso("No se pudo solicitar el permiso de notificaciones.");
    }
  };

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-AR");

    return productos.filter((p) => {
      const coincideTexto =
        p.nombre.toLocaleLowerCase("es-AR").includes(termino) ||
        p.categoria.toLocaleLowerCase("es-AR").includes(termino);

      const coincideStock =
        filtroStock === "todos" ||
        (filtroStock === "agotado" && p.stock === 0) ||
        (filtroStock === "bajo" &&
          p.stock > 0 &&
          p.stock <= umbralStock);

      return coincideTexto && coincideStock;
    });
  }, [productos, busqueda, filtroStock, umbralStock]);

  const totalUnidades = productos.reduce(
    (total, p) => total + p.stock,
    0,
  );

  const productosBajos = productos.filter(
    (p) => p.stock > 0 && p.stock <= umbralStock,
  );

  const productosAgotados = productos.filter((p) => p.stock === 0);

  // Filtra únicamente los movimientos del día actual en horario local.
  const fechaActual = obtenerFechaLocalISO();

  const movimientosDeHoy = useMemo(
    () =>
      historial.filter((movimiento) => {
        if (!movimiento.fechaISO) return false;

        const fecha = new Date(movimiento.fechaISO);

        return (
          !Number.isNaN(fecha.getTime()) &&
          obtenerFechaLocalISO(fecha) === fechaActual
        );
      }),
    [historial, fechaActual],
  );

  const exportarHistorialDelDia = () => {
    descargarCSV(
      movimientosDeHoy,
      `historial-stock-${fechaActual}.csv`,
    );
  };

  const cambiar = (campo: keyof typeof vacio, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cancelar = () => {
    setForm(vacio);
    setImagenes([]);
    setEditandoId(null);
    setError("");
  };

  const subirImagenes = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const archivos = Array.from(input.files ?? []);
    input.value = "";

    if (archivos.length === 0) return;

    const lugar = MAX_IMAGENES - imagenes.length;

    if (lugar <= 0) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto`);
      return;
    }

    try {
      const nuevas = await Promise.all(
        archivos.slice(0, lugar).map((f) => archivoAImagen(f)),
      );

      setImagenes((prev) => [...prev, ...nuevas]);

      setError(
        archivos.length > lugar
          ? `Máximo ${MAX_IMAGENES} imágenes: se agregaron solo las primeras ${lugar}`
          : "",
      );
    } catch (err) {
      setError(mensajeDe(err, "No se pudo cargar la imagen"));
    }
  };

  const quitarImagen = (i: number) =>
    setImagenes((prev) => prev.filter((_, idx) => idx !== i));

  const moverImagen = (i: number, delta: number) =>
    setImagenes((prev) => {
      const j = i + delta;

      if (j < 0 || j >= prev.length) return prev;

      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];

      return copia;
    });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();

    const precio = Number(form.precio);
    const stock = Number(form.stock);

    if (!form.nombre.trim() || !form.categoria.trim()) {
      setError("Nombre y categoría son obligatorios");
      return;
    }

    if (!Number.isInteger(precio) || precio <= 0) {
      setError("El precio debe ser un número entero mayor a 0 (en pesos)");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("El stock debe ser un número entero, 0 o más");
      return;
    }

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio,
      stock,
      categoria: form.categoria.trim(),
      imagenes,
    };

    setGuardando(true);

    try {
      if (editandoId) {
        const productoAnterior = productos.find(
          (p) => p.id === editandoId,
        );

        await actualizarProducto(editandoId, datos);

        if (
          productoAnterior &&
          productoAnterior.stock !== stock
        ) {
          registrarMovimiento(
            productoAnterior,
            "Ajuste",
            Math.abs(stock - productoAnterior.stock),
            productoAnterior.stock,
            stock,
          );
        }
      } else {
        await crearProducto(datos);
      }

      cancelar();
      cargar();
    } catch (err) {
      setError(mensajeDe(err, "No se pudo guardar el producto"));
    } finally {
      setGuardando(false);
    }
  };

  const editar = (p: Producto) => {
    setEditandoId(p.id);

    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: String(p.precio),
      stock: String(p.stock),
      categoria: p.categoria,
    });

    setImagenes(p.imagenes);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;

    try {
      await eliminarProducto(p.id);
      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo eliminar el producto"));
    }
  };

  const cambiarStock = async (p: Producto, delta: number) => {
    try {
      if (delta < 0 && p.stock <= 0) {
        setAviso(
          `No se puede retirar stock: "${p.nombre}" ya está agotado.`,
        );
        return;
      }

      await modificarStock(p.id, delta);

      registrarMovimiento(
        p,
        delta > 0 ? "Ingreso" : "Retiro",
        Math.abs(delta),
        p.stock,
        p.stock + delta,
      );

      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo cambiar el stock"));
    }
  };

  const salir = () => {
    logout();
    navigate("/admin/login");
  };

  const inputStyle =
    "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white";

  const botonMini =
    "flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-xs shadow-xs hover:bg-white disabled:opacity-30 transition";

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍒</span>

            <div>
              <h1 className="text-lg font-black tracking-wider uppercase leading-tight">
                {LOCAL_INFO.nombre}
              </h1>

              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
                Panel de Administración
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-rose-600 hover:text-white transition-all duration-200"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* Avisos del inventario */}
        {(aviso || productosBajos.length > 0 || productosAgotados.length > 0) && (
          <section className="space-y-3">
            {aviso && (
              <div
                role="status"
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
              >
                <span>{aviso}</span>

                <button
                  type="button"
                  onClick={() => setAviso("")}
                  className="shrink-0 rounded-lg px-2 py-1 hover:bg-amber-100"
                  aria-label="Cerrar aviso"
                >
                  ✕
                </button>
              </div>
            )}

            {(productosBajos.length > 0 || productosAgotados.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap gap-3 text-sm font-bold">
                  {productosAgotados.length > 0 && (
                    <span className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                      {productosAgotados.length} agotado(s)
                    </span>
                  )}

                  {productosBajos.length > 0 && (
                    <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                      {productosBajos.length} con stock bajo
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={solicitarPermisoNotificaciones}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Activar notificaciones
                </button>
              </div>
            )}
          </section>
        )}

        {/* Resumen del inventario */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Productos registrados
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {productos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unidades disponibles
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {totalUnidades}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Movimientos de hoy
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {movimientosDeHoy.length}
            </p>
          </div>
        </section>

        {/* Formulario de productos */}
        <form
          onSubmit={enviar}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {editandoId ? "Editar Producto" : "Nuevo Producto"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {editandoId
                  ? "Modificá la información y fotos de este producto"
                  : "Completá los campos para agregar un nuevo ítem al catálogo"}
              </p>
            </div>

            {editandoId && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                Editando ID #{editandoId.slice(0, 6)}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Nombre del Producto
              </label>

              <input
                className={inputStyle}
                placeholder="ej. Maceta Artesanal"
                value={form.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Categoría
              </label>

              <input
                className={inputStyle}
                placeholder="ej. Decoración"
                value={form.categoria}
                onChange={(e) => cambiar("categoria", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Precio ($)
              </label>

              <input
                className={inputStyle}
                type="number"
                min="1"
                step="1"
                placeholder="ej. 1500"
                value={form.precio}
                onChange={(e) => cambiar("precio", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Stock Disponible
              </label>

              <input
                className={inputStyle}
                type="number"
                min="0"
                step="1"
                placeholder="ej. 10"
                value={form.stock}
                onChange={(e) => cambiar("stock", e.target.value)}
              />
            </div>

            {/* Carga de imágenes */}
            <div className="flex flex-col gap-3 pt-2 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Galería de Fotos
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-600">
                  <span>📷</span>
                  <span>Agregar Fotos</span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={subirImagenes}
                    className="hidden"
                  />
                </label>

                <span className="text-xs font-medium text-slate-400">
                  {imagenes.length}/{MAX_IMAGENES} seleccionadas · La primera imagen será la portada
                </span>
              </div>

              {imagenes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  {imagenes.map((src, i) => (
                    <div
                      key={i}
                      className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
                    >
                      <img
                        src={src}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {i === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                          Portada
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => quitarImagen(i)}
                        aria-label="Quitar foto"
                        className={`${botonMini} absolute right-1.5 top-1.5 font-bold text-rose-600`}
                      >
                        ✕
                      </button>

                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between">
                        <button
                          type="button"
                          onClick={() => moverImagen(i, -1)}
                          disabled={i === 0}
                          aria-label="Mover a la izquierda"
                          className={botonMini}
                        >
                          ◀
                        </button>

                        <button
                          type="button"
                          onClick={() => moverImagen(i, 1)}
                          disabled={i === imagenes.length - 1}
                          aria-label="Mover a la derecha"
                          className={botonMini}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Descripción del Producto
              </label>

              <textarea
                className={`${inputStyle} h-24`}
                placeholder="Escribí una breve descripción del producto..."
                value={form.descripcion}
                onChange={(e) => cambiar("descripcion", e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600"
            >
              ⚠️ {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-600 disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : editandoId
                  ? "✓ Guardar cambios"
                  : "+ Agregar Producto"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Catálogo e historial */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Catálogo de Productos ({productosFiltrados.length} de{" "}
                {productos.length})
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Buscá productos y detectá rápidamente los que necesitan reposición.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMostrarHistorial((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {mostrarHistorial
                  ? "Ocultar historial"
                  : "Historial de stock"}
              </button>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                Alertar con ≤

                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={umbralStock}
                  onChange={(e) =>
                    setUmbralStock(
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                  className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-900"
                  aria-label="Umbral de stock bajo"
                />
              </label>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto o categoría..."
              className={inputStyle}
              aria-label="Buscar productos"
            />

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["todos", "Todos"],
                  ["bajo", "Stock bajo"],
                  ["agotado", "Agotados"],
                ] as const
              ).map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltroStock(valor)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    filtroStock === valor
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          {mostrarHistorial && (
            <section className="mb-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-col gap-3 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    Movimientos recientes
                  </h4>

                  <p className="text-xs text-slate-500">
                    Se guardan en este navegador (máximo 100 movimientos).
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Movimientos de hoy: {movimientosDeHoy.length}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportarHistorialDelDia}
                    disabled={movimientosDeHoy.length === 0}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Descargar historial de hoy
                  </button>

                  {historial.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "¿Borrar todo el historial de movimientos?",
                          )
                        ) {
                          setHistorial([]);
                        }
                      }}
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Borrar historial
                    </button>
                  )}
                </div>
              </div>

              {historial.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  Todavía no hay movimientos registrados.
                </p>
              ) : (
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Producto</th>
                        <th className="p-3">Movimiento</th>
                        <th className="p-3">Cambio</th>
                        <th className="p-3">Stock final</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {historial.map((m) => (
                        <tr key={m.id}>
                          <td className="whitespace-nowrap p-3 text-slate-500">
                            {m.fecha}
                          </td>

                          <td className="p-3 font-semibold text-slate-800">
                            {m.productoNombre}
                          </td>

                          <td className="p-3">{m.tipo}</td>

                          <td
                            className={`p-3 font-black ${
                              m.tipo === "Retiro"
                                ? "text-rose-600"
                                : m.tipo === "Ingreso"
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {m.tipo === "Retiro"
                              ? "−"
                              : m.tipo === "Ingreso"
                                ? "+"
                                : "±"}
                            {m.cantidad}
                          </td>

                          <td className="p-3 font-bold text-slate-800">
                            {m.stockAnterior} → {m.stockNuevo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Tabla de productos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">Producto</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5">Precio</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {p.imagenes[0] ? (
                          <img
                            src={p.imagenes[0]}
                            alt={p.nombre}
                            className="h-11 w-11 rounded-xl border border-slate-100 object-cover shadow-xs"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400">
                            🌸
                          </div>
                        )}

                        <div>
                          <p className="font-bold text-slate-900">
                            {p.nombre}
                          </p>

                          {p.imagenes.length > 1 && (
                            <span className="text-[11px] font-medium text-slate-400">
                              📷 {p.imagenes.length} fotos
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                        {p.categoria}
                      </span>
                    </td>

                    <td className="p-3.5 font-black text-slate-900">
                      {formatearPrecio(p.precio)}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarStock(p, -1)}
                          disabled={p.stock <= 0}
                          aria-label={`Restar stock de ${p.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          −
                        </button>

                        <div className="flex min-w-16 flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {p.stock}
                          </span>

                          <span
                            className={`mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                              p.stock === 0
                                ? "bg-rose-100 text-rose-700"
                                : p.stock <= umbralStock
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {p.stock === 0
                              ? "Agotado"
                              : p.stock <= umbralStock
                                ? "Stock bajo"
                                : "Disponible"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => cambiarStock(p, 1)}
                          aria-label={`Sumar stock a ${p.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-700 shadow-xs transition hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => editar(p)}
                          className="text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminar(p)}
                          className="text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {productosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center font-medium text-slate-400"
                    >
                      {productos.length === 0
                        ? "Todavía no cargaste productos en el catálogo."
                        : "No hay productos que coincidan con la búsqueda o el filtro."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gestión de pedidos */}
        <ListaPedidos onCambio={cargar} />
      </main>
    </div>
  );
}
