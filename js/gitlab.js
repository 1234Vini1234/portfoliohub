/* ============================================
   gitlab.js — mapa de commits do GitLab do trabalho.

   Diferente do GitHub, aqui NÃO há chamada ao vivo: a
   instância é interna (VPN) e exigiria token no site, que
   é público. Os dados vêm de data/gitlab.json, gerado na
   máquina do dono pelo tools/gitlab-snapshot.mjs — só
   datas e contagens, sem nome de projeto ou commit.

   Sem o arquivo, o bloco simplesmente não aparece.
   ============================================ */

import { t, getLang } from "./i18n.js";

const ARQUIVO = "data/gitlab.json";
const SEMANAS = 53;

const pad = (n) => String(n).padStart(2, "0");
const diaISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Faixa de intensidade da célula (0 = sem commit). */
function nivel(n) {
  if (!n) return 0;
  if (n <= 2) return 1;
  if (n <= 5) return 2;
  if (n <= 9) return 3;
  return 4;
}

/** Interpreta "YYYY-MM-DD" como data local (evita o recuo de fuso do parser ISO). */
function dataLocal(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

function fmtData(d) {
  return d.toLocaleDateString(getLang() === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Monta as 53 colunas de 7 dias terminando no último dia do snapshot. */
function montarSemanas(fim) {
  const ultimo = new Date(fim);
  // Fecha a última coluna no sábado, para as linhas baterem com os dias da semana.
  ultimo.setDate(ultimo.getDate() + (6 - ultimo.getDay()));

  const primeiro = new Date(ultimo);
  primeiro.setDate(primeiro.getDate() - (SEMANAS * 7 - 1));

  const semanas = [];
  const cursor = new Date(primeiro);
  for (let s = 0; s < SEMANAS; s++) {
    const semana = [];
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

function render(raiz, dados) {
  const fim = dados.fim ? dataLocal(dados.fim) : new Date();
  const inicio = dados.inicio ? dataLocal(dados.inicio) : null;
  const hoje = diaISO(new Date());
  const semanas = montarSemanas(fim);

  // Rótulos de mês: um por coluna em que o mês vira.
  let mesAnterior = -1;
  const meses = semanas.map((semana, i) => {
    const primeiroDia = semana[0];
    const m = primeiroDia.getMonth();
    // Evita rótulo colado na borda direita, onde não caberia.
    if (m !== mesAnterior && i < SEMANAS - 2) {
      mesAnterior = m;
      const nome = primeiroDia.toLocaleDateString(
        getLang() === "en" ? "en-US" : "pt-BR",
        { month: "short" }
      );
      return `<span style="grid-column:${i + 1}">${nome.replace(".", "")}</span>`;
    }
    return "";
  });

  let totalJanela = 0;
  const celulas = [];
  for (const semana of semanas) {
    for (const dia of semana) {
      const iso = diaISO(dia);
      const dentro = iso <= hoje && (!inicio || dia >= inicio);
      const n = dentro ? dados.dias[iso] || 0 : 0;
      if (dentro) totalJanela += n;

      const rotulo = dentro
        ? `${n} ${n === 1 ? t("gl.commit") : t("gl.commits")} · ${fmtData(dia)}`
        : fmtData(dia);

      celulas.push(
        `<span class="gl-cell${dentro ? "" : " gl-cell--fora"}" data-n="${nivel(n)}" title="${rotulo}"></span>`
      );
    }
  }

  const legenda = [0, 1, 2, 3, 4]
    .map((n) => `<span class="gl-cell" data-n="${n}"></span>`)
    .join("");

  raiz.innerHTML = `
    <div class="gl-cal" role="img" aria-label="${t("gl.title")}: ${totalJanela} ${t("gl.commits")}">
      <div class="gl-scroll">
        <div class="gl-months" style="grid-template-columns:repeat(${SEMANAS}, var(--gl-cell))">
          ${meses.join("")}
        </div>
        <div class="gl-grid">${celulas.join("")}</div>
      </div>
    </div>

    <div class="gl-foot">
      <span class="gl-total"><strong>${totalJanela.toLocaleString(
        getLang() === "en" ? "en-US" : "pt-BR"
      )}</strong> ${t("gl.periodo")}</span>
      <span class="gl-legend">
        ${t("gl.menos")} ${legenda} ${t("gl.mais")}
      </span>
    </div>
    ${
      dados.gerado_em
        ? `<p class="gl-updated">${t("gl.atualizado")} ${fmtData(dataLocal(dados.gerado_em))}</p>`
        : ""
    }`;
}

/** Mostra ou esconde a seção inteira (título incluso) e o link na navbar. */
function exibirSecao(raiz, visivel) {
  const secao = raiz.closest("section");
  if (secao) secao.hidden = !visivel;
  const link = document.querySelector('.nav-links a[href="#atividade"]');
  if (link?.parentElement) link.parentElement.hidden = !visivel;
}

/** Ponto de entrada — chamado por main.js. Silencioso se não houver snapshot. */
export async function loadGitLab() {
  const raiz = document.querySelector("[data-bind='gl-block']");
  if (!raiz) return;

  try {
    const res = await fetch(ARQUIVO, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const dados = await res.json();
    if (!dados || typeof dados.dias !== "object") throw new Error("formato inesperado");

    raiz.hidden = false;
    exibirSecao(raiz, true);
    render(raiz, dados);

    // O bloco nasce oculto, então o scroll reveal pode já ter passado por ele.
    if (raiz.getBoundingClientRect().top < window.innerHeight) {
      raiz.classList.add("visible");
    }
  } catch (err) {
    // Sem snapshot (ou snapshot inválido): a seção inteira some, sem título órfão.
    raiz.hidden = true;
    raiz.innerHTML = "";
    exibirSecao(raiz, false);
  }
}
