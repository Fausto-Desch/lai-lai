import {
  useCallback,
  useEffect,
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
import ListaPedidos from "../components/ListaPedidos";

const MAX_IMAGENES = 5;

const vacio = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  categoria: "",
};

const mensajeDe = (err: unknown, porDefecto: string) =>
  err instanceof Error ? err.message : porDefecto;

export default function Admin() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState(vacio);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
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
    input.value = ""; // permite volver a elegir el mismo archivo
    if (archivos.length === 0) return;

    const lugar = MAX_IMAGENES - imagenes.length;
    if (lugar <= 0) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto`);
      return;
    }

    try {
      const nuevas = await Promise.all(
        archivos.slice(0, lugar).map((f) => archivoAImagen(f))
      );
      setImagenes((prev) => [...prev, ...nuevas]);
      setError(
        archivos.length > lugar
          ? `Máximo ${MAX_IMAGENES} imágenes: se agregaron solo las primeras ${lugar}`
          : ""
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
      if (editandoId) await actualizarProducto(editandoId, datos);
      else await crearProducto(datos);
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
      await modificarStock(p.id, delta);
      cargar();
    } catch (err) {
      alert(mensajeDe(err, "No se pudo cambiar el stock"));
    }
  };

  const salir = () => {
    logout();
    navigate("/admin/login");
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-600";
  const botonMini =
    "flex h-6 w-6 items-center justify-center rounded bg-white/90 text-xs shadow hover:bg-white disabled:opacity-30";

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="flex items-center justify-between bg-red-700 px-6 py-4 text-white shadow">
        <h1 className="text-2xl font-bold">🏮 Panel del dueño</h1>
        <button
          onClick={salir}
          className="rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-6">
        {/* Formulario de alta / edición */}
        <form
          onSubmit={enviar}
          className="grid gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <h2 className="text-lg font-bold sm:col-span-2">
            {editandoId ? "Editar producto" : "Nuevo producto"}
          </h2>

          <input
            className={input}
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
          />
          <input
            className={input}
            placeholder="Categoría"
            value={form.categoria}
            onChange={(e) => cambiar("categoria", e.target.value)}
          />
          <input
            className={input}
            type="number"
            min="0"
            placeholder="Precio"
            value={form.precio}
            onChange={(e) => cambiar("precio", e.target.value)}
          />
          <input
            className={input}
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => cambiar("stock", e.target.value)}
          />

          {/* Imágenes */}
          <div className="flex flex-col gap-3 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-red-700 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                📷 Agregar fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={subirImagenes}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                {imagenes.length}/{MAX_IMAGENES} · la primera es la portada
              </span>
            </div>

            {imagenes.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagenes.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-24 w-24 overflow-hidden rounded-lg border"
                  >
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => quitarImagen(i)}
                      aria-label="Quitar foto"
                      className={`${botonMini} absolute right-1 top-1 text-red-700`}
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between">
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

          <textarea
            className={`${input} sm:col-span-2`}
            rows={2}
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
          />

          {error && (
            <p className="rounded bg-red-50 p-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-red-700 px-6 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Agregar producto"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className="rounded-lg border px-6 py-2 hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Tabla de productos */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50 text-red-900">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Stock</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.imagenes[0] ? (
                        <img
                          src={p.imagenes[0]}
                          alt={p.nombre}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50">
                          🏮
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{p.nombre}</span>
                        {p.imagenes.length > 1 && (
                          <span className="ml-2 text-xs text-gray-500">
                            📷 {p.imagenes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{p.categoria}</td>
                  <td className="p-3">{formatearPrecio(p.precio)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarStock(p, -1)}
                        className="h-7 w-7 rounded border hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{p.stock}</span>
                      <button
                        onClick={() => cambiarStock(p, 1)}
                        className="h-7 w-7 rounded border hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="space-x-3 p-3 text-right">
                    <button
                      onClick={() => editar(p)}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(p)}
                      className="text-red-700 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Todavía no cargaste productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pedidos */}
        <ListaPedidos onCambio={cargar} />
      </main>
    </div>
  );
}