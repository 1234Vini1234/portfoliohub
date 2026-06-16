/* ============================================
   icons.js — ícones de tecnologia (Simple Icons via CDN).
   Mapeia o NOME da tecnologia para um slug do Simple Icons
   e sua cor de marca. Itens sem logo oficial (RAG, Text-to-SQL...)
   recebem um ícone genérico em laranja.
   CDN: https://cdn.simpleicons.org/{slug}/{cor}
   ============================================ */

// Nome (em minúsculas) -> { slug do Simple Icons, cor hex sem # }
// "" em slug = sem logo de marca; usa o fallback genérico.
const TECH = {
  // Linguagens
  "c#": { slug: "dotnet", cor: "512BD4" },
  "python": { slug: "python", cor: "3776AB" },
  "typescript": { slug: "typescript", cor: "3178C6" },
  "javascript": { slug: "javascript", cor: "F7DF1E" },
  "sql": { slug: "postgresql", cor: "4169E1" },

  // Back-end
  ".net": { slug: "dotnet", cor: "512BD4" },
  ".net 8": { slug: "dotnet", cor: "512BD4" },
  "asp.net core": { slug: "dotnet", cor: "512BD4" },
  "fastapi": { slug: "fastapi", cor: "009688" },
  "apis rest": { slug: "", cor: "" },

  // Front-end
  "next.js": { slug: "nextdotjs", cor: "FFFFFF" },
  "next.js 15": { slug: "nextdotjs", cor: "FFFFFF" },
  "react": { slug: "react", cor: "61DAFB" },
  "tailwind css": { slug: "tailwindcss", cor: "06B6D4" },
  "tailwind css 4": { slug: "tailwindcss", cor: "06B6D4" },
  "echarts": { slug: "apacheecharts", cor: "AA344D" },

  // IA & RAG
  "rag": { slug: "", cor: "" },
  "embeddings": { slug: "", cor: "" },
  "pgvector": { slug: "postgresql", cor: "4169E1" },
  "ollama": { slug: "ollama", cor: "FFFFFF" },
  "text-to-sql": { slug: "", cor: "" },
  "llms": { slug: "", cor: "" },
  "deepseek": { slug: "deepseek", cor: "4D6BFE" },
  "gemini": { slug: "googlegemini", cor: "8E75B2" },

  // Banco de dados
  "postgresql": { slug: "postgresql", cor: "4169E1" },
  "sql server": { slug: "", cor: "" },
  "mysql": { slug: "mysql", cor: "4479A1" },
  "modelagem relacional": { slug: "", cor: "" },
  "modelagem de dados": { slug: "", cor: "" },
  "modelagem": { slug: "", cor: "" },

  // DevOps & Infra
  "docker": { slug: "docker", cor: "2496ED" },
  "docker swarm": { slug: "docker", cor: "2496ED" },
  "ci/cd": { slug: "githubactions", cor: "2088FF" },
  "git": { slug: "git", cor: "F05032" },
  "linux": { slug: "linux", cor: "FCC624" },
  "nginx": { slug: "nginx", cor: "009639" },

  // Outros que aparecem nas tags de projeto
  "prisma": { slug: "prisma", cor: "2D3748" },
  "supabase": { slug: "supabase", cor: "3FCF8E" },
  "full-stack": { slug: "", cor: "" },
  "web": { slug: "", cor: "" }
};

const CDN = (slug, cor) =>
  `https://cdn.simpleicons.org/${slug}${cor ? "/" + cor : ""}`;

/** Resolve a tecnologia pelo nome (case-insensitive). */
export function resolveTech(name = "") {
  return TECH[name.trim().toLowerCase()] || { slug: "", cor: "" };
}

/**
 * Retorna o HTML do ícone para uma tecnologia.
 * - Com logo: <img> do CDN (cor da marca).
 * - Sem logo: ícone genérico (SVG inline em laranja) — RAG, Text-to-SQL, etc.
 */
export function iconHTML(name = "") {
  const { slug, cor } = resolveTech(name);
  if (slug) {
    return `<img class="tech-ico" src="${CDN(slug, cor)}" alt="" loading="lazy" width="16" height="16" />`;
  }
  // Fallback genérico: um "chip" laranja para conceitos sem marca
  return `<span class="tech-ico tech-ico--generic" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M9 9h6v6H9z"/>
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
    </svg>
  </span>`;
}
