// ═══════════════════════════════════════════════════
//  FISCON — Helpers de Gerência (gerencia.js)
//  Funções puras sem JSX — importável por qualquer arquivo
// ═══════════════════════════════════════════════════

export const GERENCIAS = {
  obras: {
    id: "obras",
    nome: "Gerência de Fiscalização de Obras",
    sigla: "OB",
    prefixNotif: "NP-OB",
    prefixAuto: "AI-OB",
    secretaria: "Secretaria Municipal de Infraestrutura Urbana",
    lei: "Lei nº 1.481/2007",
    cor: "#1A56DB",
    corBg: "#EBF5FF",
    corBorder: "#93C5FD",
    emoji: "🏗️",
    usaBairros: true,
  },
  posturas: {
    id: "posturas",
    nome: "Gerência de Fiscalização de Posturas",
    sigla: "PO",
    prefixNotif: "NP-PO",
    prefixAuto: "AI-PO",
    secretaria: "Secretaria Municipal de Infraestrutura Urbana",
    lei: "Lei nº 695/1993 — Código de Polícia Administrativa",
    cor: "#166534",
    corBg: "#F0FDF4",
    corBorder: "#6EE7B7",
    emoji: "🏪",
    usaBairros: false,
  },
};

// ─── Gerar número de documento com prefixo da gerência ─────
export function gerarNumDocumento(type, gerencia, recordsExistentes) {
  const ger = GERENCIAS[gerencia] || GERENCIAS.obras;
  const prefix = type === "auto" ? ger.prefixAuto : ger.prefixNotif;
  const existentes = recordsExistentes.filter(
    (r) => r.type === type && (r.gerencia || "obras") === gerencia
  ).length;
  const seq = String(existentes + 1).padStart(4, "0");
  return `${prefix}-${seq}/${new Date().getFullYear()}`;
}

// ─── Gerar código de acesso amigável (sem ambiguidade) ─────
// Usa apenas: letras minúsculas (sem l,o) + números (sem 0,1)
// Formato: xxxx-xxxx (8 chars, fácil de ditar por telefone)
export function gerarCodigoAcesso() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.slice(0, 4) + code.slice(4);
}

// ─── Filtrar dados por gerência do usuário ─────
export function filtrarPorGerencia(dados, user) {
  if (!user) return dados;
  if (user.gerencia === "admin_geral") return dados;
  return dados.filter((d) => (d.gerencia || "obras") === (user.gerencia || "obras"));
}

// ─── Verificar se user pode ver dados de uma gerência ─────
export function podeVerGerencia(user, gerencia) {
  if (!user) return false;
  if (user.gerencia === "admin_geral") return true;
  return (user.gerencia || "obras") === gerencia;
}

// ─── Obter config da gerência do user ─────
export function getGerenciaConfig(user) {
  if (!user) return GERENCIAS.obras;
  if (user.gerencia === "admin_geral") return { ...GERENCIAS.obras, nome: "Todas as Gerências", sigla: "ADM", emoji: "🏛️" };
  return GERENCIAS[user.gerencia] || GERENCIAS.obras;
}
