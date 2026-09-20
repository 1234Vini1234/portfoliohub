#!/usr/bin/env node
/* ============================================
   gitlab-snapshot.mjs — gera data/gitlab.json com a
   CONTAGEM DIÁRIA de commits do GitLab da empresa.

   Roda na SUA máquina (com VPN ligada, se for o caso).
   O token fica no ambiente, nunca no repositório.

   O arquivo gerado contém apenas datas e números:
   nenhum nome de projeto, repositório, branch ou
   mensagem de commit é lido ou gravado.

   Uso (PowerShell):
     $env:GITLAB_URL   = "https://gitlab.suaempresa.com.br"
     $env:GITLAB_TOKEN = "<personal access token, escopo read_api>"
     node tools/gitlab-snapshot.mjs

   Opcionais:
     GITLAB_DAYS      quantos dias puxar (padrão: 365)
     GITLAB_INSECURE  =1 aceita certificado TLS self-signed
   ============================================ */

const URL_BASE = (process.env.GITLAB_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.GITLAB_TOKEN || "";
const DIAS = Number(process.env.GITLAB_DAYS || 365);
const SAIDA = new global.URL("../data/gitlab.json", import.meta.url);

if (!URL_BASE || !TOKEN) {
  console.error(
    "Faltou configurar o ambiente.\n" +
      "  GITLAB_URL   = https://gitlab.suaempresa.com.br\n" +
      "  GITLAB_TOKEN = <personal access token com escopo read_api>"
  );
  process.exit(1);
}

if (process.env.GITLAB_INSECURE === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("! TLS sem verificação (GITLAB_INSECURE=1).");
}

const pad = (n) => String(n).padStart(2, "0");
/** Data local no formato YYYY-MM-DD (o dia que você viu no relógio). */
const diaLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function api(caminho) {
  const res = await fetch(`${URL_BASE}/api/v4${caminho}`, {
    headers: { "PRIVATE-TOKEN": TOKEN },
  });
  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    throw new Error(`GET ${caminho} → ${res.status} ${res.statusText}\n${corpo.slice(0, 300)}`);
  }
  return res.json();
}

const hoje = new Date();
const inicio = new Date(hoje);
inicio.setDate(inicio.getDate() - DIAS);
// O parâmetro "after" do GitLab é exclusivo: recua um dia para não perder o primeiro.
const after = new Date(inicio);
after.setDate(after.getDate() - 1);

console.log(`Puxando eventos de ${diaLocal(inicio)} até ${diaLocal(hoje)} ...`);

const dias = {};
let totalCommits = 0;
let totalEventos = 0;
let pagina = 1;

while (true) {
  const lote = await api(
    `/events?after=${diaLocal(after)}&per_page=100&page=${pagina}`
  );
  if (!Array.isArray(lote) || lote.length === 0) break;

  for (const ev of lote) {
    totalEventos++;
    // Só eventos de push contam commits; o resto (issue, MR, comentário) é ignorado.
    const acao = String(ev.action_name || "");
    if (!acao.startsWith("pushed")) continue;

    const quantos = Number(ev.push_data?.commit_count ?? 1) || 1;
    const dia = diaLocal(new Date(ev.created_at));
    dias[dia] = (dias[dia] || 0) + quantos;
    totalCommits += quantos;
  }

  if (lote.length < 100) break;
  pagina++;
  if (pagina > 100) {
    console.warn("! Parei em 100 páginas por segurança.");
    break;
  }
}

// Ordena por data e descarta o que ficou fora da janela.
const limite = diaLocal(inicio);
const ordenados = Object.keys(dias)
  .filter((d) => d >= limite)
  .sort()
  .reduce((acc, d) => ((acc[d] = dias[d]), acc), {});

const saida = {
  fonte: "GitLab (trabalho)",
  gerado_em: diaLocal(hoje),
  inicio: limite,
  fim: diaLocal(hoje),
  total: Object.values(ordenados).reduce((a, b) => a + b, 0),
  dias: ordenados,
};

const { writeFileSync } = await import("node:fs");
writeFileSync(SAIDA, JSON.stringify(saida, null, 2) + "\n", "utf8");

console.log(
  `\nOK: ${saida.total} commits em ${Object.keys(ordenados).length} dias ` +
    `(${totalEventos} eventos lidos, ${pagina} página(s)).`
);
console.log(`Gravado em data/gitlab.json — só datas e contagens, sem nomes.`);
