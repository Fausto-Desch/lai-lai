export interface DatosTarjeta {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
}

export interface ResultadoPago {
  aprobado: boolean;
  ultimos4: string;
  motivo?: string;
}

// SIMULACIÓN: no cobra nada. Cuando haya backend, esta función se
// reemplaza por la integración real (Mercado Pago, Stripe, etc.).
export async function procesarPagoTarjeta(
  tarjeta: DatosTarjeta,
  _monto: number
): Promise<ResultadoPago> {
  await new Promise((r) => setTimeout(r, 1200));

  const digitos = tarjeta.numero.replace(/\D/g, "");
  const ultimos4 = digitos.slice(-4);

  // Tarjeta de prueba que siempre se rechaza
  if (digitos === "4000000000000002") {
    return { aprobado: false, ultimos4, motivo: "La tarjeta fue rechazada" };
  }
  return { aprobado: true, ultimos4 };
}