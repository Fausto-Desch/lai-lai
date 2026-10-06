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
  listarProductos,
  guardarProducto,
  eliminarProducto,
} from "../services/productos";
import { useAuth } from "../context/AuthContext";
import { formatearPrecio } from "../utils/formato";
import { archivoAImagen } from "../utils/imagen";
import ListaPedidos from "../components/ListaPedidos";

const vacio = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: "",
  categoria: "",
  imagen: "",
};

export default function Admin() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    listarProductos().then(setProductos);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo: keyof typeof vacio, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cancelar = () => {
    setForm(vacio);
    setEditandoId(null);
    setError("");
  };

  const subirImagen = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      cambiar("imagen", await archivoAImagen(archivo));
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la imagen"
      );
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const precio = Number(form.precio);
    const stock = Number(form.stock);

    if (!form.nombre.trim() || !form.categoria.trim()) {
      setError("Nombre y categoría son obligatorios");
      return;
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("El stock debe ser un número entero, 0 o más");
      return;
    }

    try {
      await guardarProducto({
        id: editandoId ?? crypto.randomUUID(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio,
        stock,
        categoria: form.categoria.trim(),
        imagen: form.imagen,
      });
    } catch {
      setError(
        "No hay espacio para guardar. Eliminá productos o usá imágenes más chicas."
      );
      return;
    }

    cancelar();
    cargar();
  };

  const editar = (p: Producto) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: String(p.precio),
      stock: String(p.stock),
      categoria: p.categoria,
      imagen: p.imagen,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    await eliminarProducto(p.id);
    cargar();
  };

  const ajustarStock = async (p: Producto, delta: number) => {
    const nuevo = Math.max(0, p.stock + delta);
    await guardarProducto({ ...p, stock: nuevo });
    cargar();
  };

  const salir = () => {
    logout();
    navigate("/admin/login");
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-600";

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

          <div className="flex items-center gap-4 sm:col-span-2">
            {form.imagen ? (
              <img
                src={form.imagen}
                alt="Vista previa"
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-red-50 text-3xl">
                🏮
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={subirImagen}
                className="text-sm"
              />
              {form.imagen && (
                <button
                  type="button"
                  onClick={() => cambiar("imagen", "")}
                  className="self-start text-sm text-red-700 hover:underline"
                >
                  Quitar imagen
                </button>
              )}
            </div>
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
              className="rounded-lg bg-red-700 px-6 py-2 font-semibold text-white hover:bg-red-800"
            >
              {editandoId ? "Guardar cambios" : "Agregar producto"}
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
                      {p.imagen ? (
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50">
                          🏮
                        </div>
                      )}
                      <span className="font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3">{p.categoria}</td>
                  <td className="p-3">{formatearPrecio(p.precio)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => ajustarStock(p, -1)}
                        className="h-7 w-7 rounded border hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{p.stock}</span>
                      <button
                        onClick={() => ajustarStock(p, 1)}
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