/* ============================================
   i18n.js — internacionalização (PT/EN).
   - Carrega data/i18n.json (labels da UI).
   - Aplica os textos marcados com data-i18n.
   - Expõe helpers para o render escolher PT/EN do CONTEÚDO
     (campos *_en nos JSON de dados).
   - Idioma persiste em localStorage("lang").
   ============================================ */

let dict = {}; // { pt: {...}, en: {...} }
let lang = "pt";

/** Idioma ativo ("pt" | "en"). */
export function getLang() {
  return lang;
}

/** Traduz uma chave da UI no idioma ativo (fallback: PT, depois a própria chave). */
export function t(key) {
  return (dict[lang] && dict[lang][key]) || (dict.pt && dict.pt[key]) || key;
}

/**
 * Escolhe o campo certo de um objeto de dados conforme o idioma.
 * Ex.: field(proj, "resumo") -> proj.resumo_en (se EN e existir) ou proj.resumo.
 */
export function field(obj, name) {
  if (!obj) return "";
  if (lang === "en") {
    const en = obj[`${name}_en`];
    if (en !== undefined && en !== null && en !== "") return en;
  }
  return obj[name];
}

/** Aplica as traduções da UI a todos os elementos [data-i18n]. */
export function applyUI(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  // Atualiza o rótulo do botão de idioma
  const flag = document.querySelector(".lang-flag");
  const code = document.querySelector(".lang-code");
  if (flag) flag.textContent = lang === "en" ? "🇺🇸" : "🇧🇷";
  if (code) code.textContent = lang === "en" ? "EN" : "PT";
  // Atributo lang do documento (acessibilidade/SEO)
  document.documentElement.setAttribute("lang", lang === "en" ? "en" : "pt-BR");
}

/** Carrega o dicionário e define o idioma inicial (localStorage). */
export async function initI18n() {
  try {
    const res = await fetch("data/i18n.json");
    if (res.ok) dict = await res.json();
  } catch (e) {
    console.warn("[i18n] não foi possível carregar i18n.json", e);
  }
  const saved = localStorage.getItem("lang");
  lang = saved === "en" ? "en" : "pt";
  return lang;
}

/** Alterna PT<->EN, persiste e dispara re-render. Retorna o novo idioma. */
export function toggleLang() {
  lang = lang === "pt" ? "en" : "pt";
  try {
    localStorage.setItem("lang", lang);
  } catch (e) {}
  applyUI();
  // Avisa o app para re-renderizar o CONTEÚDO dinâmico no novo idioma
  document.dispatchEvent(new CustomEvent("lang:changed", { detail: { lang } }));
  return lang;
}
