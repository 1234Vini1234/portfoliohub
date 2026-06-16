/* ============================================
   theme.js — alterna tema claro/escuro.
   O tema inicial já foi aplicado pelo script inline
   no <head> (evita flash). Aqui só tratamos o toggle.
   Persiste em localStorage("theme").
   ============================================ */

export function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";

  // Liga a transição suave só durante a troca
  document.documentElement.classList.add("theme-anim");
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}

  window.setTimeout(
    () => document.documentElement.classList.remove("theme-anim"),
    400
  );
  return next;
}
