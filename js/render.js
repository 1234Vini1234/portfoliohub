/* ============================================
   render.js — carrega os dados (data/*.json)
   e injeta o conteúdo no DOM.
   ============================================ */
import { iconHTML } from "./icons.js";
import { field, t } from "./i18n.js";

/** Escapa texto para evitar HTML indevido vindo do JSON. */
function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path} (${res.status})`);
  return res.json();
}

// Categorias de projeto; os rótulos vêm do i18n (filter.<chave>)
const CATEGORIAS = ["todos", "ia", "web", "dados"];

/* ---------- PERFIL / HERO / CONTATO ---------- */
function renderProfile(p) {
  document.title = `${p.nome} — Portfólio`;

  setText("[data-bind='nome']", p.nome);
  setText("[data-bind='titulo']", field(p, "titulo"));
  setText("[data-bind='tagline']", field(p, "tagline"));
  setText("[data-bind='brand']", p.nome.split(" ")[0]);

  // Bio curta no Hero (usa bio_curta do JSON; respeita o idioma ativo)
  const bioEl = document.querySelector("[data-bind='sobre-curto']");
  if (bioEl && p.bio_curta) bioEl.textContent = field(p, "bio_curta");

  // Foto de perfil (Hero)
  const fotoEl = document.querySelector("[data-bind='foto']");
  if (fotoEl) {
    if (p.foto) {
      fotoEl.src = p.foto;
      fotoEl.alt = `Foto de ${p.nome}`;
    } else {
      // Sem foto: esconde o container da imagem
      const wrap = fotoEl.closest(".hero-photo");
      if (wrap) wrap.style.display = "none";
    }
  }

  // Links de contato (hero + contato + footer)
  const { github, linkedin, email } = p.contato;
  document.querySelectorAll("[data-link='github']").forEach((a) => (a.href = github));
  document.querySelectorAll("[data-link='linkedin']").forEach((a) => (a.href = linkedin));
  document.querySelectorAll("[data-link='email']").forEach((a) => (a.href = `mailto:${email}`));

  const cvBtn = document.querySelector("[data-link='cv']");
  if (cvBtn) {
    if (p.cv) cvBtn.href = p.cv;
    else cvBtn.style.display = "none";
  }
}

/* ---------- SKILLS ---------- */
function renderSkills(groups) {
  const root = document.querySelector("[data-bind='skills']");
  if (!root) return;
  root.innerHTML = groups
    .map(
      (g) => `
      <div class="skill-group">
        <p class="skill-group-title">${esc(g.grupo)}</p>
        <div class="chips">
          ${g.itens
            .map((i) => {
              // Aceita item como objeto {nome,slug,cor} ou string simples
              const nome = typeof i === "string" ? i : i.nome;
              return `<span class="chip">${iconHTML(nome)}<span>${esc(nome)}</span></span>`;
            })
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

/* ---------- TIMELINE ---------- */
function renderExperience(items) {
  const root = document.querySelector("[data-bind='timeline']");
  if (!root) return;
  root.innerHTML = items
    .map(
      (e) => `
      <div class="tl-item reveal">
        <p class="tl-period">${esc(field(e, "periodo"))}</p>
        <h3 class="tl-title">${esc(field(e, "titulo"))}</h3>
        <p class="tl-org">${esc(field(e, "organizacao"))}</p>
        <p class="tl-desc">${esc(field(e, "descricao"))}</p>
        <div class="tl-tags">
          ${e.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}
        </div>
      </div>`
    )
    .join("");
}

/* ---------- PROJETOS ---------- */
function projectCard(proj) {
  const featured = proj.destaque ? "featured" : "";
  const kindLabel = t(`filter.${proj.categoria}`);

  const highlights = (field(proj, "destaques") || [])
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");

  // Mostra no máximo 4 techs principais; o resto vira "+N" (evita poluição)
  const stack = proj.stack || [];
  const MAX_TAGS = 4;
  const shown = stack.slice(0, MAX_TAGS);
  const extra = stack.length - shown.length;
  const tags =
    shown
      .map((tech) => `<span class="tag">${iconHTML(tech)}<span>${esc(tech)}</span></span>`)
      .join("") +
    (extra > 0 ? `<span class="tag tag--more">+${extra}</span>` : "");

  // Links: se confidencial e sem links, mostra cadeado; senão renderiza links reais.
  let linksHtml = "";
  const linkEntries = Object.entries(proj.links || {});
  if (linkEntries.length) {
    linksHtml = linkEntries
      .map(
        ([label, url]) =>
          `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} →</a>`
      )
      .join("");
  } else if (proj.confidencial) {
    linksHtml = `<span class="muted-link card-lock">${t("card.sigilo")}</span>`;
  } else {
    linksHtml = `<span class="muted-link">${t("card.breve")}</span>`;
  }

  // Projetos de IA ganham mais peso visual (card maior, selo dedicado)
  const iaClass = proj.ia ? "card--ia" : "";
  const kindBadge = proj.ia
    ? `<span class="card-kind card-kind--ia">${t("card.ia")}</span>`
    : `<span class="card-kind ${featured}">${featured ? t("card.featured") : esc(kindLabel)}</span>`;

  return `
    <article class="card reveal ${iaClass}" data-cat="${esc(proj.categoria)}">
      <div class="card-top">
        ${kindBadge}
        ${proj.confidencial ? `<span class="card-lock">${t("card.confidencial")}</span>` : ""}
      </div>
      <h3>${esc(field(proj, "nome"))}</h3>
      ${proj.empresa ? `<span class="card-company">@ ${esc(proj.empresa)}</span>` : ""}
      <p class="card-resumo">${esc(field(proj, "resumo"))}</p>
      ${highlights ? `<ul class="card-highlights">${highlights}</ul>` : ""}
      <div class="tags">${tags}</div>
      <div class="card-links">${linksHtml}</div>
    </article>`;
}

function renderProjects(projects) {
  const grid = document.querySelector("[data-bind='projects']");
  if (!grid) return;

  // Projetos de IA primeiro (mais peso); demais preservam a ordem do JSON
  const ordered = [...projects].sort((a, b) => (b.ia === true) - (a.ia === true));
  grid.innerHTML = ordered.map(projectCard).join("");

  // Monta os botões de filtro a partir das categorias presentes
  const present = new Set(projects.map((p) => p.categoria));
  const filterRoot = document.querySelector("[data-bind='filters']");
  if (filterRoot) {
    const cats = ["todos", ...CATEGORIAS.filter((c) => c !== "todos" && present.has(c))];
    filterRoot.innerHTML = cats
      .map(
        (c, i) =>
          `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${c}">${esc(
            t(`filter.${c}`)
          )}</button>`
      )
      .join("");
  }
}

/* ---------- helpers ---------- */
function setText(sel, value) {
  document.querySelectorAll(sel).forEach((el) => (el.textContent = value));
}

/** Ponto de entrada: carrega tudo em paralelo e renderiza. */
export async function hydrate() {
  try {
    const [profile, skills, experience, projects] = await Promise.all([
      loadJSON("data/profile.json"),
      loadJSON("data/skills.json"),
      loadJSON("data/experience.json"),
      loadJSON("data/projects.json"),
    ]);

    renderProfile(profile);
    renderSkills(skills);
    renderExperience(experience);
    renderProjects(projects);

    document.dispatchEvent(
      new CustomEvent("content:ready", { detail: { github_user: profile.github_user } })
    );
  } catch (err) {
    console.error("[PortfolioHUB] erro ao carregar dados:", err);
    const grid = document.querySelector("[data-bind='projects']");
    if (grid) {
      grid.innerHTML = `<p style="color:var(--muted)">Não foi possível carregar os projetos. Verifique se está servindo via HTTP (não abrindo o arquivo direto).</p>`;
    }
  }
}
