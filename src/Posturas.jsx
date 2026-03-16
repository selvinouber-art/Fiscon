// ═══════════════════════════════════════════════════
//  FISCON — Módulo de Posturas (Posturas.jsx)
//  
//  Arquivo separado para a Gerência de Posturas.
//  Importado pelo App.jsx quando o usuário é de posturas.
//  
//  Contém:
//  - GerenciaSelector (admin geral escolhe gerência ao criar user)
//  - PosturasInfracoesSelector (lista de infrações de posturas)
//  - GerenciaGuard (filtra dados por gerência)
//  - Helpers de numeração (prefixos por gerência)
// ═══════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { T, Icon, supa, SUPA_URL } from "./config.jsx";

// ─── Constantes de Gerência ────────────────────────
export const GERENCIAS = {
  obras: { id: "obras", nome: "Fiscalização de Obras", sigla: "OB", prefixNotif: "NP-OB", prefixAuto: "AI-OB" },
  posturas: { id: "posturas", nome: "Fiscalização de Posturas", sigla: "PO", prefixNotif: "NP-PO", prefixAuto: "AI-PO" },
};

// ─── Helper: Gerar número de documento com prefixo da gerência ─────
export function gerarNumDocumento(type, gerencia, recordsExistentes) {
  const ger = GERENCIAS[gerencia] || GERENCIAS.obras;
  const prefix = type === "auto" ? ger.prefixAuto : ger.prefixNotif;
  const existentes = recordsExistentes.filter(
    (r) => r.type === type && r.gerencia === gerencia
  ).length;
  const seq = String(existentes + 1).padStart(4, "0");
  return `${prefix}-${seq}/${new Date().getFullYear()}`;
}

// ─── Helper: Filtrar dados por gerência do usuário ─────
export function filtrarPorGerencia(dados, user) {
  if (!user) return dados;
  // Admin geral vê tudo
  if (user.gerencia === "admin_geral" || user.role === "admin") return dados;
  // Outros veem só da sua gerência
  return dados.filter((d) => d.gerencia === user.gerencia || !d.gerencia);
}

// ─── Componente: Seletor de Gerência (para Admin criar usuário) ────
export function GerenciaSelector({ value, onChange, disabled }) {
  const [gerencias, setGerencias] = useState([]);

  useEffect(() => {
    const load = async () => {
      const g = await supa.get("gerencias", "&order=id.asc");
      setGerencias(g || []);
    };
    load();
  }, []);

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        fontSize: 11, color: T.muted, letterSpacing: 1.5,
        textTransform: "uppercase", marginBottom: 6, display: "block", fontWeight: 600,
      }}>
        Gerência *
      </label>
      <select
        className="input-field"
        value={value || "obras"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <option value="admin_geral">Admin Geral (acesso a todas as gerências)</option>
        {gerencias.filter((g) => g.ativo !== false).map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome} ({g.sigla})
          </option>
        ))}
      </select>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
        {value === "admin_geral" && "Este perfil terá acesso a TODAS as gerências."}
        {value === "obras" && "Este perfil terá acesso apenas à Gerência de Fiscalização de Obras."}
        {value === "posturas" && "Este perfil terá acesso apenas à Gerência de Fiscalização de Posturas."}
      </div>
    </div>
  );
}

// ─── Componente: Badge de Gerência ─────────────────
export function GerenciaBadge({ gerencia, compact }) {
  const ger = GERENCIAS[gerencia];
  if (!ger) return null;
  const cores = {
    obras: { bg: "#EBF5FF", color: "#1A56DB", border: "#93C5FD" },
    posturas: { bg: "#F0FDF4", color: "#166534", border: "#6EE7B7" },
  };
  const c = cores[gerencia] || cores.obras;

  if (compact) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "2px 8px",
        borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1,
        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      }}>
        {ger.sigla}
      </span>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {ger.sigla} · {ger.nome}
    </span>
  );
}

// ─── Componente: Seletor de Infrações de Posturas ──
export function PosturasInfracoesSelector({ selected, onToggle }) {
  const [infracoes, setInfracoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await supa.get("infracoes_posturas", "&order=ordem.asc");
      setInfracoes(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 16, color: T.muted, fontSize: 12 }}>Carregando infrações...</div>;

  return (
    <div>
      <div style={{
        fontFamily: T.font, fontSize: 12, fontWeight: 800, letterSpacing: 1,
        textTransform: "uppercase", color: "#166534", marginBottom: 10,
        paddingBottom: 6, borderBottom: `2px solid ${T.border}`,
      }}>
        Infrações de Posturas ({infracoes.length})
      </div>
      {infracoes.filter((i) => i.ativo !== false).map((inf) => {
        const sel = selected.find((s) => s.id === inf.id);
        return (
          <div
            key={inf.id}
            onClick={() => onToggle(inf)}
            style={{
              display: "flex", alignItems: "flex-start", padding: "10px 0",
              borderBottom: `1px solid ${T.border}`, cursor: "pointer", gap: 10,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: sel ? "#166534" : "transparent",
              border: `2px solid ${sel ? "#166534" : T.border}`,
              transition: "all 0.15s",
            }}>
              {sel && <Icon name="check" size={12} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#166534" }}>{inf.codigo}</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{inf.descricao}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{inf.penalidade}</div>
            </div>
            <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 800, color: T.danger, whiteSpace: "nowrap" }}>
              R$ {Number(inf.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        );
      })}
      {selected.length > 0 && (
        <div style={{
          background: "#F0FDF4", border: "2px solid #6EE7B7", borderRadius: 10,
          padding: "10px 12px", marginTop: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.muted }}>
              {selected.length} infração(ões) selecionada(s)
            </span>
            <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800, color: T.danger }}>
              R$ {selected.reduce((s, x) => s + Number(x.valor), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente: Header com indicador de gerência ──
export function GerenciaHeader({ user }) {
  const ger = GERENCIAS[user?.gerencia];
  if (!ger && user?.gerencia !== "admin_geral") return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 16px",
      background: user.gerencia === "admin_geral" ? "#FEF3C7" : GERENCIAS[user.gerencia]?.id === "posturas" ? "#F0FDF4" : "#EBF5FF",
      borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ fontSize: 14 }}>
        {user.gerencia === "admin_geral" ? "🏛️" : user.gerencia === "posturas" ? "🏪" : "🏗️"}
      </span>
      <span style={{ color: T.text }}>
        {user.gerencia === "admin_geral"
          ? "Admin Geral — Acesso a todas as gerências"
          : ger?.nome || user.gerencia}
      </span>
    </div>
  );
}

// ─── Componente: Filtro de Gerência (para Admin Geral) ─────
export function GerenciaFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {[
        { id: "all", label: "Todas", emoji: "🏛️" },
        { id: "obras", label: "Obras", emoji: "🏗️" },
        { id: "posturas", label: "Posturas", emoji: "🏪" },
      ].map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          style={{
            padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            border: `2px solid ${value === g.id ? T.accent : T.border}`,
            background: value === g.id ? "#EBF5FF" : "#fff",
            color: value === g.id ? T.accent : T.muted,
            fontSize: 12, fontWeight: 700, fontFamily: T.font,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {g.emoji} {g.label}
        </button>
      ))}
    </div>
  );
}
