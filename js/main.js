/* ============================================
   main.js — interações da UI
   (navbar, menu mobile, filtros, scroll reveal)
   ============================================ */
import { hydrate } from "./render.js";
import { loadGitHub } from "./github.js";
import { initI18n, applyUI, toggleLang } from "./i18n.js";
import { toggleTheme } from "./theme.js";

/* ---------- Intro / boas-vindas (typewriter + saída lateral) ---------- */
function initIntro() {
  const intro = document.querySelector("#intro");
  if (!intro) return;

  const typed = intro.querySelector(".intro-typed");

  // Mensagem digitada. Cada segmento tem um texto e se é destacado (laranja).
  const segments = [
    { text: "Welcome to my ", em: false },
    { text: "digital portfolio", em: true },
  ];

  // Trava o scroll do site enquanto a intro está visível
  document.body.style.overflow = "hidden";

  let typedDone = false;
  let leaving = false;

  /* ----- saída lateral (só após terminar de digitar) ----- */
  const leave = () => {
    if (!typedDone || leaving) return;
    leaving = true;
    intro.classList.add("leaving");
    // pequena pausa para o acento lateral aparecer antes de deslizar
    requestAnimationFrame(() => intro.classList.add("hide"));
    document.body.style.overflow = "";
    cleanup();
    setTimeout(() => intro.remove(), 1200);
  };

  const onInteract = (e) => {
    // ignora a tecla Tab (acessibilidade: navegar sem fechar)
    if (e.type === "keydown" && e.key === "Tab") return;
    leave();
  };

  const events = ["click", "wheel", "touchstart", "keydown"];
  const armExit = () => events.forEach((ev) =>
    window.addEventListener(ev, onInteract, { passive: true })
  );
  const cleanup = () => events.forEach((ev) =>
    window.removeEventListener(ev, onInteract)
  );

  /* ----- efeito de digitação ----- */
  // Respeita "reduzir movimento": mostra tudo de uma vez.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finishTyping = () => {
    typedDone = true;
    intro.classList.add("typed");
    armExit();
  };

  if (reduce) {
    // Sem animação: mostra tudo de uma vez, agrupando por palavra (não quebra no meio)
    const wrap = (text) =>
      text
        .split(/( )/) // mantém os espaços como itens separados
        .map((part) => {
          if (part === " ") return `<span class="ch"> </span>`;
          const letters = [...part].map((c) => `<span class="ch">${c}</span>`).join("");
          return `<span class="word">${letters}</span>`;
        })
        .join("");
    typed.innerHTML = segments
      .map((s) => (s.em ? `<em>${wrap(s.text)}</em>` : wrap(s.text)))
      .join("");
    finishTyping();
    return;
  }

  let si = 0; // índice do segmento
  let ci = 0; // índice do caractere

  // Ritmo levemente variável = digitação mais "humana" e suave.
  // Pausa um pouco mais após espaços e pontuação.
  const delayFor = (ch) => {
    const base = 48 + Math.random() * 34; // ~48–82ms
    if (ch === " ") return base + 40;
    if (".,!?".includes(ch)) return base + 130;
    return base;
  };

  // Container de destaque (laranja) é criado sob demanda para o segmento "em".
  let target = typed; // onde anexar os próximos caracteres
  let word = null; // .word corrente (agrupa letras p/ não quebrar no meio)

  // Anexa UMA letra. Letras vão dentro de uma .word (que não quebra);
  // espaços ficam soltos no target, permitindo a quebra só entre palavras.
  const appendChar = (c) => {
    const span = document.createElement("span");
    span.className = "ch";
    span.textContent = c;

    if (c === " ") {
      word = null; // fecha a palavra; espaço solto permite quebra de linha
      target.appendChild(span);
    } else {
      if (!word) {
        word = document.createElement("span");
        word.className = "word";
        target.appendChild(word);
      }
      word.appendChild(span);
    }
  };

  const tick = () => {
    if (si >= segments.length) {
      finishTyping();
      return;
    }
    const seg = segments[si];

    // Ao iniciar um segmento destacado, cria o <em> e passa a anexar nele
    if (ci === 0) {
      word = null;
      target = seg.em
        ? typed.appendChild(document.createElement("em"))
        : typed;
    }

    const ch = seg.text[ci];
    appendChar(ch);
    ci++;

    if (ci >= seg.text.length) {
      si++;
      ci = 0;
      target = typed;
      setTimeout(tick, seg.em ? 0 : 150); // micro-pausa entre segmentos
    } else {
      setTimeout(tick, delayFor(ch));
    }
  };

  setTimeout(tick, 750); // começa depois do "Welcome" aparecer
}

/* ---------- Tilt 3D da foto do Hero (segue o mouse) ---------- */
function initPhotoTilt() {
  const wrap = document.querySelector(".hero-photo");
  if (!wrap) return;

  // Só em dispositivos com mouse (evita em touch) e sem "reduzir movimento"
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduce) return;

  const MAX = 9; // graus máximos de inclinação

  wrap.addEventListener("mousemove", (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    // Inclina na direção do cursor; brilho acompanha
    wrap.style.setProperty("--ry", `${(px - 0.5) * 2 * MAX}deg`);
    wrap.style.setProperty("--rx", `${(0.5 - py) * 2 * MAX}deg`);
    wrap.style.setProperty("--mx", `${px * 100}%`);
    wrap.style.setProperty("--my", `${py * 100}%`);
  });

  // Ao sair, volta suave ao neutro
  wrap.addEventListener("mouseleave", () => {
    wrap.style.setProperty("--ry", "0deg");
    wrap.style.setProperty("--rx", "0deg");
  });
}

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

/* ---------- Toggles de idioma e tema ---------- */
function initToggles() {
  const langBtn = document.querySelector(".lang-toggle");
  const themeBtn = document.querySelector(".theme-toggle");

  langBtn?.addEventListener("click", () => {
    toggleLang();
    // micro-animação: flip da bandeira
    langBtn.classList.add("flipping");
    setTimeout(() => langBtn.classList.remove("flipping"), 450);
  });

  themeBtn?.addEventListener("click", () => {
    toggleTheme();
    // micro-animação: gira o ícone sol/lua
    themeBtn.classList.add("spinning");
    setTimeout(() => themeBtn.classList.remove("spinning"), 450);
  });
}

/* ---------- bootstrap ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  initIntro();
  initNavbar();
  initMobileMenu();
  initToggles();
  initPhotoTilt();
  initYear();

  // Idioma precisa estar pronto ANTES de renderizar o conteúdo
  await initI18n();
  applyUI();
  hydrate(); // carrega os JSON e injeta o conteúdo no idioma ativo
});

// Quando o conteúdo dinâmico estiver pronto, liga filtros + reveal + GitHub
let ghUser = null;
document.addEventListener("content:ready", (e) => {
  initFilters();
  initReveal();

  ghUser = e.detail?.github_user || ghUser;
  if (ghUser) loadGitHub(ghUser);
});

// Trocar de idioma: re-renderiza o conteúdo dinâmico (cards, timeline, etc.)
document.addEventListener("lang:changed", () => {
  hydrate(); // re-injeta tudo no novo idioma; dispara content:ready de novo
});
