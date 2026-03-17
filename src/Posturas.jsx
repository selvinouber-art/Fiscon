import React from "react";
// ═══════════════════════════════════════════════════
//  FISCON — Componentes de Gerência (Posturas.jsx)
//  Componentes visuais de multi-gerência
// ═══════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { T, Icon, supa } from "./config.jsx";
import { GERENCIAS, getGerenciaConfig } from "./gerencia.js";

// ─── Badge de Gerência (inline) ─────────────────
export function GerenciaBadge({ gerencia, compact }) {
  const ger = GERENCIAS[gerencia];
  if (!ger) return null;
  if (compact) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "2px 8px",
        borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1,
        background: ger.corBg, color: ger.cor, border: `1px solid ${ger.corBorder}`,
      }}>
        {ger.sigla}
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      background: ger.corBg, color: ger.cor, border: `1px solid ${ger.corBorder}`,
    }}>
      {ger.sigla} · {ger.nome}
    </span>
  );
}

// ─── Barra de Gerência no topo ──────────────────
export function GerenciaHeader({ user }) {
  if (!user?.gerencia) return null;
  const isAdmin = user.gerencia === "admin_geral";
  const ger = GERENCIAS[user.gerencia];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 16px",
      background: isAdmin ? "#FEF3C7" : ger?.corBg || "#EBF5FF",
      borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ fontSize: 14 }}>
        {isAdmin ? "🏛️" : ger?.emoji || "🏗️"}
      </span>
      <span style={{ color: T.text }}>
        {isAdmin ? "Admin Geral — Acesso a todas as gerências" : ger?.nome || ""}
      </span>
      {!isAdmin && ger?.lei && (
        <span style={{ fontSize: 9, color: T.muted, marginLeft: "auto" }}>{ger.lei}</span>
      )}
    </div>
  );
}

// ─── Seletor de Gerência (ao criar/editar usuário) ─────
export function GerenciaSelector({ value, onChange }) {
  const options = [
    { id: "admin_geral", label: "Admin Geral", emoji: "🏛️", color: "#B45309", desc: "Acesso total a todas as gerências" },
    { id: "obras", label: "Obras", emoji: "🏗️", color: "#1A56DB", desc: "Apenas Fiscalização de Obras" },
    { id: "posturas", label: "Posturas", emoji: "🏪", color: "#166534", desc: "Apenas Fiscalização de Posturas" },
  ];

  return (
    <div className="form-section">
      <div className="form-section-title">Gerência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {options.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            style={{
              background: value === g.id ? `${g.color}18` : T.surface,
              border: `1.5px solid ${value === g.id ? g.color : T.border}`,
              borderRadius: 10, padding: "10px 8px", cursor: "pointer",
              color: value === g.id ? g.color : T.muted,
              fontSize: 11, fontWeight: 700, textAlign: "center", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{g.emoji}</div>
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>
        {options.find((o) => o.id === value)?.desc || ""}
      </div>
    </div>
  );
}

// ─── Seletor de Infrações de Posturas (Lei 695/93) ──
export function PosturasInfracoesSelector({ selected, onToggle }) {
  const [infracoes, setInfracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState("all");

  useEffect(() => {
    const load = async () => {
      const data = await supa.get("infracoes_posturas", "&order=ordem.asc");
      setInfracoes(data || []);
      setLoading(false);
    };
    load();
  }, []);

  // Categorias por prefixo do código
  const categorias = [
    { id: "all", label: "Todas" },
    { id: "HP", label: "Higiene Pública" },
    { id: "HE", label: "Higiene Estab." },
    { id: "CI", label: "Conserv. Imóveis" },
    { id: "PS", label: "Poluição Sonora" },
    { id: "FE", label: "Funcionamento" },
    { id: "FC", label: "Feiras/Ambulantes" },
    { id: "OV", label: "Obstr. Vias" },
    { id: "AV", label: "Animais/Veget." },
    { id: "DP", label: "Diversões" },
  ];

  const filtradas = categoria === "all"
    ? infracoes
    : infracoes.filter((i) => i.codigo?.startsWith(categoria));

  if (loading) return <div style={{ padding: 16, color: T.muted, fontSize: 12 }}>Carregando infrações de posturas...</div>;

  return (
    <div>
      <div style={{
        fontFamily: T.font, fontSize: 12, fontWeight: 800, letterSpacing: 1,
        textTransform: "uppercase", color: "#166534", marginBottom: 10,
        paddingBottom: 6, borderBottom: "2px solid #6EE7B7",
      }}>
        Infrações de Posturas — Lei 695/93 ({infracoes.length})
      </div>

      {/* Filtro por categoria */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {categorias.map((c) => (
          <button key={c.id} onClick={() => setCategoria(c.id)} style={{
            padding: "4px 10px", borderRadius: 8, border: `1px solid ${categoria === c.id ? "#166534" : T.border}`,
            background: categoria === c.id ? "#D1FAE5" : "#fff", color: categoria === c.id ? "#166534" : T.muted,
            fontSize: 10, fontWeight: 700, cursor: "pointer",
          }}>
            {c.label}
          </button>
        ))}
      </div>

      {filtradas.filter((i) => i.ativo !== false).map((inf) => {
        const sel = selected.find((s) => s.id === inf.id);
        return (
          <div key={inf.id} onClick={() => onToggle(inf)} style={{
            display: "flex", alignItems: "flex-start", padding: "10px 0",
            borderBottom: `1px solid ${T.border}`, cursor: "pointer", gap: 10,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: sel ? "#166534" : "transparent",
              border: `2px solid ${sel ? "#166534" : T.border}`,
            }}>
              {sel && <Icon name="check" size={12} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#166534" }}>{inf.codigo}</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{inf.descricao}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{inf.penalidade}</div>
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
            <span style={{ fontSize: 12, color: T.muted }}>{selected.length} infração(ões)</span>
            <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800, color: T.danger }}>
              R$ {selected.reduce((s, x) => s + Number(x.valor), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filtro de Gerência (para Admin Geral ver dados) ─────
export function GerenciaFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {[
        { id: "all", label: "Todas", emoji: "🏛️" },
        { id: "obras", label: "Obras", emoji: "🏗️" },
        { id: "posturas", label: "Posturas", emoji: "🏪" },
      ].map((g) => (
        <button key={g.id} onClick={() => onChange(g.id)} style={{
          padding: "8px 14px", borderRadius: 10, cursor: "pointer",
          border: `2px solid ${value === g.id ? T.accent : T.border}`,
          background: value === g.id ? "#EBF5FF" : "#fff",
          color: value === g.id ? T.accent : T.muted,
          fontSize: 12, fontWeight: 700, fontFamily: T.font,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {g.emoji} {g.label}
        </button>
      ))}
    </div>
  );
}

// ─── Seletor de Função (carrega do banco por gerência) ─────
export function FuncaoSelector({ gerencia, value, onChange }) {
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const ger = gerencia === "admin_geral" ? "" : gerencia || "obras";
      const filtro = ger ? `&gerencia=eq.${ger}` : "";
      const data = await supa.get("funcoes_gerencia", `&order=ordem.asc${filtro}`);
      setFuncoes(data || []);
      setLoading(false);
    };
    load();
  }, [gerencia]);

  // Fallback hardcoded caso tabela esteja vazia
  const fallback = [
    { codigo: "fiscal", nome: "Fiscal", cor: "#1A56DB" },
    { codigo: "atendente", nome: "Balcão", cor: "#166534" },
    { codigo: "admin", nome: "Gerência", cor: "#B91C1C" },
  ];

  const lista = funcoes.length > 0
    ? funcoes.filter((f) => f.ativo !== false)
    : fallback;

  if (gerencia === "admin_geral") {
    return (
      <div className="form-section">
        <div className="form-section-title">Função</div>
        <div style={{ padding: 14, background: "#FEF3C7", borderRadius: 10, border: "1px solid #F59E0B", fontSize: 12, color: "#92400E" }}>
          Admin Geral tem acesso total. A função será definida como <strong>admin</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <div className="form-section-title">Função {gerencia === "posturas" ? "(Posturas)" : "(Obras)"}</div>
      {loading ? (
        <div style={{ padding: 12, color: T.muted, fontSize: 12 }}>Carregando funções...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: lista.length > 2 ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
          {lista.map((fn) => {
            const codigo = fn.codigo;
            const cor = fn.cor || T.accent;
            const ativo = value === codigo;
            return (
              <button
                key={fn.id || codigo}
                onClick={() => onChange(codigo)}
                style={{
                  background: ativo ? `${cor}18` : T.surface,
                  border: `1.5px solid ${ativo ? cor : T.border}`,
                  borderRadius: 10, padding: "12px 8px", cursor: "pointer",
                  color: ativo ? cor : T.muted,
                  fontSize: 12, fontWeight: 700, textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800 }}>{fn.nome}</div>
                {fn.descricao && <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7, fontWeight: 400 }}>{fn.descricao}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
