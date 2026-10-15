export const ADMIN_USUARIO = "admin";
export const ADMIN_CLAVE = "lailai2026";

export const LOCAL_INFO = {
  nombre: " Lai Lai",
  lema: "Todo para tu casa, en un solo lugar",

  direccion: "O Higgins 33", 
  mapaEmbedUrl: "", // opcional: ver instrucciones abajo
  horario: "Lunes a Sabado de 8:30 a 21:30hs, Domingos 13:30 a 21:30 hs", // ej: "Lun a Sáb de 9 a 20 hs"

  telefono: "+54 9 2923 46-4118", // ej: "+54 291 123 4567" (se muestra y se puede llamar)
  whatsapp: "5492923464118", // solo números con código de país, ej: "5492911234567"
  email: "faudesch2210@gmail.com", // ej: "contacto@lailai.com"
  instagram: "lailai.regaleria", // usuario sin @, ej: "bazarlailai"
};

export const HAY_CONTACTO = Boolean(
  LOCAL_INFO.direccion ||
    LOCAL_INFO.mapaEmbedUrl ||
    LOCAL_INFO.horario ||
    LOCAL_INFO.telefono ||
    LOCAL_INFO.whatsapp ||
    LOCAL_INFO.email ||
    LOCAL_INFO.instagram
);

// Fotos del local: archivos dentro de la carpeta public/local/
export const HERO_IMAGENES: string[] = [
  "/local/local-1.jpg",
  "/local/local-2.jpg",
  "/local/local-3.jpg",
];