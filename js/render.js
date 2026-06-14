/* ============================================
   render.js — carrega os dados (data/*.json)
   e injeta o conteúdo no DOM.
   ============================================ */

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

const CATEGORIAS = {
  todos: "Todos",
  ia: "Agentes de IA",
  web: "Aplicações Web",
  dados: "Bancos de Dados",
};

/* ---------- PERFIL / HERO / CONTATO ---------- */
function renderProfile(p) {
  document.title = `${p.nome} — Portfólio`;

  setText("[data-bind='nome']", p.nome);
  setText("[data-bind='titulo']", p.titulo);
  setText("[data-bind='tagline']", p.tagline);
  setText("[data-bind='brand']", p.nome.split(" ")[0]);

  // Sobre (parágrafos separados por quebra dupla)
  const aboutEl = document.querySelector("[data-bind='sobre']");
  if (aboutEl) {
    aboutEl.innerHTML = p.sobre
      .split("\n\n")
      .map((para) => `<p>${esc(para)}</p>`)
      .join("");
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
          ${g.itens.map((i) => `<span class="chip">${esc(i)}</span>`).join("")}
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
        <p class="tl-period">${esc(e.periodo)}</p>
        <h3 class="tl-title">${esc(e.titulo)}</h3>
        <p class="tl-org">${esc(e.organizacao)}</p>
        <p class="tl-desc">${esc(e.descricao)}</p>
        <div class="tl-tags">
          ${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
        </div>
      </div>`
    )
    .join("");
}

/* ---------- PROJETOS ---------- */
function projectCard(proj) {
  const featured = proj.destaque ? "featured" : "";
  const kindLabel = CATEGORIAS[proj.categoria] || proj.categoria;

  const highlights = (proj.destaques || [])
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");

  const tags = (proj.stack || [])
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join("");

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
    linksHtml = `<span class="muted-link card-lock">🔒 Sistema interno · sob sigilo</span>`;
  } else {
    linksHtml = `<span class="muted-link">Em breve</span>`;
  }

  return `
    <article class="card reveal" data-cat="${esc(proj.categoria)}">
      <div class="card-top">
        <span class="card-kind ${featured}">${featured ? "★ Destaque" : esc(kindLabel)}</span>
        ${proj.confidencial ? '<span class="card-lock">🔒 Confidencial</span>' : ""}
      </div>
      <h3>${esc(proj.nome)}</h3>
      ${proj.empresa ? `<span class="card-company">@ ${esc(proj.empresa)}</span>` : ""}
      <p class="card-resumo">${esc(proj.resumo)}</p>
      ${highlights ? `<ul class="card-highlights">${highlights}</ul>` : ""}
      <div class="tags">${tags}</div>
      <div class="card-links">${linksHtml}</div>
    </article>`;
}

function renderProjects(projects) {
  const grid = document.querySelector("[data-bind='projects']");
  if (!grid) return;
  grid.innerHTML = projects.map(projectCard).join("");

  // Monta os botões de filtro a partir das categorias presentes
  const present = new Set(projects.map((p) => p.categoria));
  const filterRoot = document.querySelector("[data-bind='filters']");
  if (filterRoot) {
    const cats = ["todos", ...Object.keys(CATEGORIAS).filter((c) => c !== "todos" && present.has(c))];
    filterRoot.innerHTML = cats
      .map(
        (c, i) =>
          `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${c}">${esc(
            CATEGORIAS[c]
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

    document.dispatchEvent(new CustomEvent("content:ready"));
  } catch (err) {
    console.error("[PortfolioHUB] erro ao carregar dados:", err);
    const grid = document.querySelector("[data-bind='projects']");
    if (grid) {
      grid.innerHTML = `<p style="color:var(--muted)">Não foi possível carregar os projetos. Verifique se está servindo via HTTP (não abrindo o arquivo direto).</p>`;
    }
  }
}
