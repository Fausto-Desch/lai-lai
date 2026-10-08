import { LOCAL_INFO } from "../config";

const whatsappNumero = LOCAL_INFO.whatsapp.replace(/\D/g, "");
const instagramUsuario = LOCAL_INFO.instagram.replace(/^@/, "").trim();
const emailLocal = LOCAL_INFO.email.trim();

// Quedan vacíos ("") si el dato no está cargado en config.ts
export const urlWhatsApp = whatsappNumero
  ? `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
      "Hola, quería hacer una consulta."
    )}`
  : "";

export const urlInstagram = instagramUsuario
  ? `https://instagram.com/${instagramUsuario}`
  : "";

export const urlGmail = emailLocal
  ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailLocal
    )}&su=${encodeURIComponent("Consulta desde la tienda")}`
  : "";