/* ============================================
   github.js — integração com a API pública do GitHub.
   Busca perfil, repositórios e atividade recente
   a cada visita (sem token, limite 60 req/h por IP).
   Como roda no carregamento da página, qualquer push
   novo aparece automaticamente na próxima visita.
   ============================================ */

import { t } from "./i18n.js";

const API = "https://api.github.com";

/** Escapa texto vindo da API antes de injetar no DOM. */
function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ghFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Converte uma data ISO em texto relativo ("há 3 dias"). */
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  const map = [
    ["ano", 31536000],
    ["mês", 2592000],
    ["dia", 86400],
    ["h", 3600],
    ["min", 60],
  ];
  for (const [label, secs] of map) {
    const v = Math.floor(s / secs);
    if (v >= 1) {
      if (label === "h" || label === "min") return `há ${v}${label}`;
      const plural = v > 1 ? (label === "mês" ? "meses" : label + "s") : label;
      return `há ${v} ${plural}`;
    }
  }
  return "agora";
}

const numFmt = (n) => new Intl.NumberFormat("pt-BR").format(n ?? 0);

/* ---------- PERFIL + ESTATÍSTICAS ---------- */
function renderProfile(user) {
  const box = document.querySelector("[data-bind='gh-profile']");
  if (box) {
    box.innerHTML = `
      <img class="gh-avatar" src="${esc(user.avatar_url)}" alt="Avatar de ${esc(user.login)}" loading="lazy" />
      <div class="gh-profile-info">
        <h3>${esc(user.name || user.login)}</h3>
        <span class="gh-login">@${esc(user.login)}</span>
        ${user.bio ? `<p>${esc(user.bio)}</p>` : ""}
      </div>`;
  }

  const stats = document.querySelector("[data-bind='gh-stats']");
  if (stats) {
    const items = [
      { num: numFmt(user.public_repos), lbl: t("gh.stat.repos") },
      { num: numFmt(user.followers), lbl: t("gh.stat.followers") },
      { num: numFmt(user.following), lbl: t("gh.stat.following") },
    ];
    stats.innerHTML = items
      .map(
        (i) =>
          `<div class="gh-stat"><span class="gh-num text-gradient">${i.num}</span><span class="gh-lbl">${i.lbl}</span></div>`
      )
      .join("");
  }
}

/* ---------- REPOSITÓRIOS ---------- */
function renderRepos(repos) {
  const box = document.querySelector("[data-bind='gh-repos']");
  if (!box) return;

  const list = repos
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 4);

  if (!list.length) {
    box.innerHTML = `<p class="gh-error">${t("gh.empty.repos")}</p>`;
    return;
  }

  box.innerHTML = list
    .map(
      (r) => `
      <a class="gh-repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <span class="gh-repo-name">${esc(r.name)}</span>
        <p class="gh-repo-desc">${esc(r.description || t("gh.repo.nodesc"))}</p>
        <div class="gh-repo-foot">
          ${r.language ? `<span class="gh-lang">${esc(r.language)}</span>` : ""}
          ${r.stargazers_count ? `<span>★ ${numFmt(r.stargazers_count)}</span>` : ""}
          <span>Atualizado ${timeAgo(r.pushed_at)}</span>
        </div>
      </a>`
    )
    .join("");
}

/* ---------- ATIVIDADE RECENTE (eventos/commits) ---------- */
const EVENT_ICONS = { PushEvent: "📦", CreateEvent: "✨", PullRequestEvent: "🔀", IssuesEvent: "🐛", WatchEvent: "⭐", ForkEvent: "🍴" };

function describeEvent(ev) {
  const repo = esc(ev.repo?.name || "");
  const repoUrl = `https://github.com/${repo}`;
  const repoLink = `<a href="${repoUrl}" target="_blank" rel="noopener">${repo}</a>`;

  switch (ev.type) {
    case "PushEvent": {
      const n = ev.payload?.commits?.length || 0;
      const plural = n === 1 ? "commit" : "commits";
      const msg = ev.payload?.commits?.[0]?.message?.split("\n")[0];
      return {
        title: `${n} ${plural} em ${repoLink}`,
        meta: msg ? esc(msg) : "",
      };
    }
    case "CreateEvent":
      return { title: `Criou ${esc(ev.payload?.ref_type || "")} em ${repoLink}`, meta: "" };
    case "PullRequestEvent":
      return { title: `${esc(ev.payload?.action || "")} PR em ${repoLink}`, meta: esc(ev.payload?.pull_request?.title || "") };
    case "IssuesEvent":
      return { title: `${esc(ev.payload?.action || "")} issue em ${repoLink}`, meta: esc(ev.payload?.issue?.title || "") };
    case "WatchEvent":
      return { title: `Marcou ${repoLink} com estrela`, meta: "" };
    case "ForkEvent":
      return { title: `Fez fork de ${repoLink}`, meta: "" };
    default:
      return { title: `Atividade em ${repoLink}`, meta: "" };
  }
}

function renderActivity(events) {
  const box = document.querySelector("[data-bind='gh-activity']");
  if (!box) return;

  const relevant = events
    .filter((e) => EVENT_ICONS[e.type])
    .slice(0, 5);

  if (!relevant.length) {
    box.innerHTML = `<li class="gh-error">${t("gh.empty.activity")}</li>`;
    return;
  }

  box.innerHTML = relevant
    .map((ev) => {
      const { title, meta } = describeEvent(ev);
      const ico = EVENT_ICONS[ev.type] || "•";
      return `
        <li>
          <span class="gh-ico">${ico}</span>
          <span>
            ${title}
            ${meta ? `<span class="gh-meta">${meta}</span>` : ""}
          </span>
          <time datetime="${esc(ev.created_at)}">${timeAgo(ev.created_at)}</time>
        </li>`;
    })
    .join("");
}

/* ---------- erro global da seção ---------- */
function showError(msg) {
  const targets = ["gh-profile", "gh-activity", "gh-repos"];
  targets.forEach((t) => {
    const el = document.querySelector(`[data-bind='${t}']`);
    if (el) el.innerHTML = `<p class="gh-error">${esc(msg)}</p>`;
  });
  const stats = document.querySelector("[data-bind='gh-stats']");
  if (stats) stats.innerHTML = "";
}

/** Ponto de entrada — chamado por main.js com o usuário do perfil. */
export async function loadGitHub(username) {
  if (!username || username.includes("SEU")) {
    showError("Configure seu usuário do GitHub em data/profile.json (campo github_user).");
    return;
  }

  try {
    // Perfil primeiro (valida o usuário); repos e eventos em paralelo.
    const user = await ghFetch(`/users/${username}`);
    renderProfile(user);

    const [repos, events] = await Promise.all([
      ghFetch(`/users/${username}/repos?per_page=100&sort=pushed`).catch(() => []),
      ghFetch(`/users/${username}/events/public?per_page=30`).catch(() => []),
    ]);

    renderRepos(repos);
    renderActivity(events);
  } catch (err) {
    console.error("[GitHub]", err);
    if (err.status === 403) {
      showError(t("gh.error.rate"));
    } else if (err.status === 404) {
      showError(t("gh.error.notfound"));
    } else {
      showError(t("gh.error.generic"));
    }
  }
}
