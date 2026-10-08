export function irA(id: string) {
  if (id === "inicio") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}