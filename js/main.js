/* ============================================
   main.js — interações da UI
   (navbar, menu mobile, filtros, scroll reveal)
   ============================================ */
import { hydrate } from "./render.js";

/* ---------- Navbar: sombra ao rolar ---------- */
function initNavbar() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Menu mobile ---------- */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => links.classList.remove("open"))
  );
}

/* ---------- Filtros de projeto ---------- */
function initFilters() {
  const filterRoot = document.querySelector("[data-bind='filters']");
  const grid = document.querySelector("[data-bind='projects']");
  if (!filterRoot || !grid) return;

  filterRoot.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    filterRoot.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;
    grid.querySelectorAll(".card").forEach((card) => {
      const show = filter === "todos" || card.dataset.cat === filter;
      card.style.display = show ? "" : "none";
    });
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

/* ---------- Ano no rodapé ---------- */
function initYear() {
  const el = document.querySelector("[data-bind='ano']");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initYear();
  hydrate(); // carrega os JSON e injeta o conteúdo
});

// Quando o conteúdo dinâmico estiver pronto, liga filtros + reveal
document.addEventListener("content:ready", () => {
  initFilters();
  initReveal();
});
