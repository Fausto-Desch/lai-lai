const TOKEN_KEY = "lai-lai-admin-token";
export const EVENTO_SESION_VENCIDA = "lai-lai-sesion-vencida";

export const obtenerToken = () => sessionStorage.getItem(TOKEN_KEY);
export const guardarToken = (token: string) =>
  sessionStorage.setItem(TOKEN_KEY, token);
export const borrarToken = () => sessionStorage.removeItem(TOKEN_KEY);

export class ErrorApi extends Error {
  estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  auth?: boolean; // manda el token del admin
}

export async function api<T>(
  ruta: string,
  { metodo = "GET", cuerpo, auth = false }: Opciones = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor", 0);
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Sesión del admin vencida o inválida: se cierra sola
    if (respuesta.status === 401 && auth) {
      borrarToken();
      window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
    }
    throw new ErrorApi(datos?.error ?? "Ocurrió un error inesperado", respuesta.status);
  }

  return datos as T;
}