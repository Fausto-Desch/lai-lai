

export const AVISO_PAGO_DEMO =
  "Pago de demostración: no se realiza ningún cobro real.";

export type Marca = "visa" | "mastercard" | "amex" | "diners" | "otra";

interface ReglaMarca {
  nombre: string;
  largos: number[]; // cantidades de dígitos válidas
  grupos: number[]; // cómo se agrupa el número al escribirlo
  cvv: number[]; // cantidades de dígitos válidas del código de seguridad
}

// Las tarjetas locales (Naranja, Cabal, Argencard, Nativa, Shopping, etc.)
// no se identifican de forma confiable por prefijo: caen en "otra" y se
// validan solo por largo (13 a 19 dígitos) y algoritmo de Luhn.
const REGLAS: Record<Marca, ReglaMarca> = {
  visa: { nombre: "Visa", largos: [16], grupos: [4, 4, 4, 4], cvv: [3] },
  mastercard: {
    nombre: "Mastercard",
    largos: [16],
    grupos: [4, 4, 4, 4],
    cvv: [3],
  },
  amex: { nombre: "American Express", largos: [15], grupos: [4, 6, 5], cvv: [4] },
  diners: { nombre: "Diners Club", largos: [14], grupos: [4, 6, 4], cvv: [3] },
  otra: {
    nombre: "Tarjeta",
    largos: [13, 14, 15, 16, 17, 18, 19],
    grupos: [4, 4, 4, 4, 4],
    cvv: [3, 4],
  },
};

const soloDigitos = (valor: string) => valor.replace(/\D/g, "");

const maximo = (lista: number[]) => Math.max(...lista);

export const nombreMarca = (marca: Marca) => REGLAS[marca].nombre;

export function detectarMarca(valor: string): Marca {
  const d = soloDigitos(valor);

  if (/^3[47]/.test(d)) return "amex";
  if (/^(36|30[0-5]|3095|3[89])/.test(d)) return "diners";
  if (/^4/.test(d)) return "visa";

  if (d.length >= 2) {
    const p2 = Number(d.slice(0, 2));
    if (p2 >= 51 && p2 <= 55) return "mastercard";
  }
  if (d.length >= 4) {
    const p4 = Number(d.slice(0, 4));
    if (p4 >= 2221 && p4 <= 2720) return "mastercard";
  }

  return "otra";
}

// Algoritmo de Luhn: detecta errores de tipeo (no confirma que la tarjeta exista)
export function luhnValido(numero: string): boolean {
  const digitos = soloDigitos(numero);
  if (digitos.length < 13 || digitos.length > 19) return false;

  let suma = 0;
  let doble = false;
  for (let i = digitos.length - 1; i >= 0; i--) {
    let d = Number(digitos[i]);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return suma % 10 === 0;
}

// Número válido = largo correcto para la marca + Luhn
export function numeroValido(valor: string): boolean {
  const d = soloDigitos(valor);
  const { largos } = REGLAS[detectarMarca(d)];
  return largos.includes(d.length) && luhnValido(d);
}

function agrupar(digitos: string, grupos: number[]): string {
  const partes: string[] = [];
  let i = 0;
  for (const g of grupos) {
    if (i >= digitos.length) break;
    partes.push(digitos.slice(i, i + g));
    i += g;
  }
  if (i < digitos.length) partes.push(digitos.slice(i));
  return partes.join(" ");
}

// Visa/Mastercard: 4-4-4-4 · Amex: 4-6-5 · Diners: 4-6-4
export function formatearNumero(valor: string): string {
  const marca = detectarMarca(valor);
  const regla = REGLAS[marca];
  const digitos = soloDigitos(valor).slice(0, maximo(regla.largos));
  return agrupar(digitos, regla.grupos);
}

// Código de seguridad: 3 dígitos (4 en American Express)
export const formatearCvv = (valor: string, marca: Marca): string =>
  soloDigitos(valor).slice(0, maximo(REGLAS[marca].cvv));

export const cvvValido = (valor: string, marca: Marca): boolean =>
  /^\d+$/.test(valor) && REGLAS[marca].cvv.includes(valor.length);

const ANIOS_MAXIMOS = 20;

export function vencimientoValido(valor: string): boolean {
  const m = valor.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;

  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;

  const ahora = new Date();
  if (anio > ahora.getFullYear() + ANIOS_MAXIMOS) return false;

  // Vale hasta el último día del mes de vencimiento
  const ultimoDia = new Date(anio, mes, 0, 23, 59, 59);
  return ultimoDia >= ahora;
}

export function formatearVencimiento(valor: string): string {
  let d = soloDigitos(valor).slice(0, 4);
  // Si escribe 2 a 9 como primer dígito, se completa el 0 (5 → 05)
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// Nombre tal como figura en la tarjeta (en mayúsculas, máx. 26 caracteres)
export const formatearTitular = (valor: string): string =>
  valor
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÜÑ' .-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 26);

export const titularValido = (valor: string): boolean =>
  /^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ' .-]{2,}$/.test(valor.trim());

// DNI argentino: 7 u 8 dígitos, se muestra con puntos (12.345.678)
export const formatearDni = (valor: string): string =>
  soloDigitos(valor)
    .slice(0, 8)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function dniValido(valor: string): boolean {
  const d = soloDigitos(valor);
  return d.length >= 7 && d.length <= 8 && Number(d) >= 1_000_000;
}

// Lo único de la tarjeta que se manda al servidor y se guarda
export const ultimos4 = (numero: string): string =>
  soloDigitos(numero).slice(-4);

export interface DatosTarjeta {
  numero: string;
  vencimiento: string;
  cvv: string;
  titular: string;
  dni: string;
}

export type ErroresTarjeta = Partial<Record<keyof DatosTarjeta, string>>;

export function validarTarjeta(datos: DatosTarjeta): ErroresTarjeta {
  const errores: ErroresTarjeta = {};
  const marca = detectarMarca(datos.numero);

  if (!numeroValido(datos.numero))
    errores.numero = "Revisá el número de la tarjeta";

  if (!vencimientoValido(datos.vencimiento))
    errores.vencimiento = "Revisá el vencimiento (MM/AA)";

  if (!cvvValido(datos.cvv, marca))
    errores.cvv =
      marca === "amex"
        ? "El código de seguridad tiene 4 dígitos"
        : "El código de seguridad tiene 3 dígitos";

  if (!titularValido(datos.titular))
    errores.titular = "Escribí el nombre como figura en la tarjeta";

  if (!dniValido(datos.dni))
    errores.dni = "Ingresá un DNI de 7 u 8 dígitos";

  return errores;
}

export const tarjetaEsValida = (errores: ErroresTarjeta): boolean =>
  Object.keys(errores).length === 0;

// Atributos para los <input>: teclado numérico en el celular y autocompletado
// del navegador. No uses type="number" en estos campos.
export const ATRIBUTOS_INPUT = {
  numero: { inputMode: "numeric", autoComplete: "cc-number" },
  vencimiento: { inputMode: "numeric", autoComplete: "cc-exp" },
  cvv: { inputMode: "numeric", autoComplete: "cc-csc" },
  titular: { inputMode: "text", autoComplete: "cc-name" },
  dni: { inputMode: "numeric", autoComplete: "off" },
} as const;