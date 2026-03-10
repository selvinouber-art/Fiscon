import React from "react";
// ═══════════════════════════════════════════════════
//  FISCON — Todas as Telas
// ═══════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from "react";
import { T, Icon, calcPrazo, INFRACOES_Q61, INFRACOES_Q62, maskCPF, maskTelefone, maskMatricula, SUPA_URL, PORTAL_URL, supa, BRASAO_DATA } from "./config.jsx";
import { SigCanvas, gerarPDF, printDoc, imprimirTermica, gerarPDFA4, DocPreview, imprimirDefesaA4 } from "./Impressao";

function Dashboard({ user, records = [], onNav }) {
  const isAdmin = user?.role === "admin";
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();
  const doMes = (r) => {
    if (!r.date) return false;
    const [d, m, a] = r.date.split("/");
    return parseInt(m) - 1 === mesAtual && parseInt(a) === anoAtual;
  };
  const notifs = records.filter((r) => r.type === "notif" && doMes(r)).length;
  const autos = records.filter((r) => r.type === "auto" && doMes(r)).length;
  const embargos = records.filter((r) => r.status === "Embargado").length;
  const regularizados = records.filter(
    (r) => r.status === "Regularizado"
  ).length;
  const vencidos = records.filter((r) => {
    const p = calcPrazo(r);
    return p && p.dias < 0;
  });
  const vencendoHoje = records.filter((r) => {
    const p = calcPrazo(r);
    return p && p.dias === 0;
  });
  const vencendoBreve = records.filter((r) => {
    const p = calcPrazo(r);
    return p && p.dias > 0 && p.dias <= 2;
  });

  // Cards clicáveis — envia filtro para RegistrosScreen via onNav
  const goFilter = (tipo, status) => onNav({ tab: "registros", tipo, status });

  // Modal de detalhe dos recentes
  const [selected, setSelected] = useState(null);
  const statusCfg = {
    Pendente: { color: "#f5a623", emoji: "" },
    Regularizado: { color: "#2ed573", emoji: "" },
    Embargado: { color: "#ff4757", emoji: "" },
    "Em recurso": { color: "#00c2ff", emoji: "" },
    Autuado: { color: "#e84393", emoji: "" },
    "Multa Encaminhada": { color: "#9B59B6", emoji: "" },
    Cancelado: { color: "#666", emoji: "" },
  };

  return (
    <div className="dashboard">
      {/* Admin: painel de gestão */}
      {isAdmin ? (
        <div
          style={{
            background: `${T.accent}10`,
            border: `1px solid ${T.accent}30`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}></div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1,
              color: T.accent,
            }}
          >
            Painel Administrativo
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Gerencie usuários, visualize logs e configure o sistema na aba
            Admin.
          </div>
        </div>
      ) : (
        <>
          <div className="stat-row">
            <button
              className="stat-card blue"
              onClick={() => goFilter("notif", "all")}
              style={{ cursor: "pointer", border: "none", textAlign: "center" }}
            >
              <div className="stat-num blue">{notifs}</div>
              <div className="stat-label">Notificações (mês)</div>
            </button>
            <button
              className="stat-card gold"
              onClick={() => goFilter("auto", "all")}
              style={{ cursor: "pointer", border: "none", textAlign: "center" }}
            >
              <div className="stat-num gold">{autos}</div>
              <div className="stat-label">Autos de Infração</div>
            </button>
            <button
              className="stat-card danger"
              onClick={() => goFilter("all", "Embargado")}
              style={{ cursor: "pointer", border: "none", textAlign: "center" }}
            >
              <div className="stat-num danger">{embargos}</div>
              <div className="stat-label">Embargos ativos</div>
            </button>
            <button
              className="stat-card success"
              onClick={() => goFilter("all", "Regularizado")}
              style={{ cursor: "pointer", border: "none", textAlign: "center" }}
            >
              <div className="stat-num success">{regularizados}</div>
              <div className="stat-label">Regularizados</div>
            </button>
          </div>

          <div className="section-title">Nova Fiscalização</div>
          <div className="action-cards">
            <button className="action-card" onClick={() => onNav("form-notif")}>
              <div className="action-icon gold"></div>
              <div>
                <div className="action-title">Notificação Preliminar</div>
                <div className="action-sub">
                  Advertência com prazo para regularizar
                </div>
              </div>
              <div className="action-arrow">
                <Icon name="arrow" size={16} />
              </div>
            </button>
            <button className="action-card" onClick={() => onNav("form-auto")}>
              <div className="action-icon danger"></div>
              <div>
                <div className="action-title">Auto de Infração</div>
                <div className="action-sub">
                  Lavratura com penalidade e multa
                </div>
              </div>
              <div className="action-arrow">
                <Icon name="arrow" size={16} />
              </div>
            </button>
          </div>

          {/* Alertas de prazo */}
          {(vencidos.length > 0 ||
            vencendoHoje.length > 0 ||
            vencendoBreve.length > 0) && (
            <div
              style={{
                background: `${T.danger}10`,
                border: `1.5px solid ${T.danger}40`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: T.danger,
                  marginBottom: 10,
                }}
              >
                Atenção — Prazos
              </div>
              {vencidos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    onNav({ tab: "registros", tipo: "all", status: "Pendente" })
                  }
                >
                  <span style={{ fontSize: 18 }}></span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#c0392b",
                      }}
                    >
                      {vencidos.length} registro(s) com prazo VENCIDO
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {vencidos.map((r) => r.num).join(", ")}
                    </div>
                  </div>
                </div>
              )}
              {vencendoHoje.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 18 }}></span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#e67e22",
                      }}
                    >
                      {vencendoHoje.length} registro(s) vencem HOJE
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {vencendoHoje.map((r) => r.num).join(", ")}
                    </div>
                  </div>
                </div>
              )}
              {vencendoBreve.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}></span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#f39c12",
                      }}
                    >
                      {vencendoBreve.length} registro(s) vencem em até 2 dias
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {vencendoBreve.map((r) => r.num).join(", ")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="section-title">Recentes</div>
          <div className="record-list">
            {records.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Nenhuma fiscalização registrada ainda.
              </div>
            )}
            {records
              .slice(-3)
              .reverse()
              .map((r) => (
                <div
                  key={r.id}
                  className={`record-item ${r.type}`}
                  onClick={() => setSelected(r)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="record-header">
                    <div className="record-num">{r.num}</div>
                    <div className="record-date">{r.date}</div>
                    {(() => {
                      const p = calcPrazo(r);
                      return p ? (
                        <span
                          style={{
                            fontSize: 10,
                            background: p.color + "18",
                            color: p.color,
                            border: "1px solid " + p.color + "40",
                            borderRadius: 6,
                            padding: "1px 6px",
                            marginLeft: 4,
                            fontWeight: 700,
                          }}
                        >
                          {p.emoji} {p.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="record-owner">{r.owner}</div>
                  <div className="record-addr">{r.addr}</div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <span
                      className={`badge ${
                        r.status === "Pendente"
                          ? "badge-gold"
                          : r.status === "Regularizado"
                          ? "badge-success"
                          : r.status === "Embargado"
                          ? "badge-danger"
                          : "badge-blue"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span style={{ fontSize: 10, color: T.muted }}>
                      toque para detalhes →
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Modal detalhe — Recentes */}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-sheet"
            style={{ maxHeight: "94vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background:
                    selected.type === "auto" ? `${T.danger}18` : `${T.gold}18`,
                  border: `1.5px solid ${
                    selected.type === "auto" ? T.danger : T.gold
                  }`,
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: T.font,
                  fontSize: 13,
                  fontWeight: 800,
                  color: selected.type === "auto" ? T.danger : T.gold,
                }}
              >
                {selected.type === "auto" ? "AUTO" : "NOTIF."}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800 }}
                >
                  {selected.num}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {selected.date} · {selected.fiscal} · Mat.{" "}
                  {selected.matricula}
                </div>
              </div>
              {(() => {
                const cfg = statusCfg[selected.status] || {
                  color: T.muted,
                  emoji: "•",
                };
                return (
                  <span
                    style={{
                      fontSize: 11,
                      background: `${cfg.color}18`,
                      color: cfg.color,
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontWeight: 700,
                    }}
                  >
                    {cfg.emoji} {selected.status}
                  </span>
                );
              })()}
            </div>

            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            >
              {[
                { l: "Proprietário/Infrator", v: selected.owner },
                { l: "CPF/CNPJ", v: selected.cpf || "—" },
                { l: "Endereço", v: selected.addr },
                { l: "Bairro", v: selected.bairro || "—" },
                { l: "Descrição", v: selected.descricao || "—" },
                ...(selected.type === "auto"
                  ? [{ l: "Multa", v: `R$ ${selected.multa || "—"}` }]
                  : []),
                {
                  l: "Prazo",
                  v:
                    selected.type === "auto"
                      ? "10 dias corridos"
                      : `${selected.prazo || 1} dia(s)`,
                },
              ].map((row) => (
                <div
                  key={row.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <span style={{ color: T.muted, flexShrink: 0 }}>{row.l}</span>
                  <span style={{ color: T.text, textAlign: "right" }}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>

            {selected.infracoes?.length > 0 && (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: T.accent,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Infrações / Irregularidades ({selected.infracoes.length})
                </div>
                {selected.infracoes.map((inf, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "4px 0",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    • {inf}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                onNav({ tab: "registros", tipo: selected.type, status: "all" })
              }
              style={{
                width: "100%",
                marginBottom: 8,
                background: `${T.accent}15`,
                border: `1px solid ${T.accent}40`,
                borderRadius: 12,
                color: T.accent,
                padding: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ver todos os registros →
            </button>
            <button
              onClick={() => setSelected(null)}
              className="btn-outline"
              style={{ width: "100%" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function FormScreen({ type, prefill, onPreview, onBack, user }) {
  const isAuto = type === "auto";
  const [gps, setGps] = useState(null);
  const [infracoesSel, setInfracoesSel] = useState([]);
  const [infTab, setInfTab] = useState("q61");
  const [signed, setSigned] = useState(false);
  const [photos, setPhotos] = useState([null, null, null, null]); // null | {file, preview, url}
  const [photoUploading, setPhotoUploading] = useState(false);
  const [data, setData] = useState({
    proprietario: prefill?.proprietario || "",
    cpf: prefill?.cpf || "",
    endereco: prefill?.endereco || "",
    bairro: prefill?.bairro || "",
    loteamento: prefill?.loteamento || "",
    descricao: prefill?.descricao || "",
    prazo: isAuto ? "10" : "1",
    multa: "",
    fiscal: user?.name || "",
    matricula: user?.matricula || "",
    obsRecusa: "",
    testemunha1: "",
    testemunha2: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const validateForm = () => {
    const e = {};
    if (!data.proprietario.trim())
      e.proprietario = "Nome completo é obrigatório";
    if (!data.endereco.trim()) e.endereco = "Endereço da obra é obrigatório";
    if (!data.bairro.trim()) e.bairro = "Bairro é obrigatório";
    if (isAuto && !data.cpf.trim())
      e.cpf = "CPF/CNPJ obrigatório para Auto de Infração";
    if (isAuto && infracoesSel.length === 0)
      e.infracoes = "Selecione ao menos 1 infração";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleInfracao = (inf) => {
    setInfracoesSel((prev) => {
      const exists = prev.find((x) => x.id === inf.id);
      const next = exists
        ? prev.filter((x) => x.id !== inf.id)
        : [...prev, inf];
      // auto-fill multa with sum
      const total = next.reduce((s, x) => s + x.valor, 0);
      setData((d) => ({
        ...d,
        multa:
          total > 0
            ? total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
            : "",
      }));
      return next;
    });
  };
  const handlePhotoSelect = async (i, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotos((prev) => {
      const n = [...prev];
      n[i] = { file, preview, url: null };
      return n;
    });
  };
  const removePhoto = (i) =>
    setPhotos((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
  const currentList = infTab === "q61" ? INFRACOES_Q61 : INFRACOES_Q62;

  return (
    <div className="form-screen">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            padding: 4,
          }}
        >
          <svg
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            {isAuto ? "Auto de Infração" : "Notificação Preliminar"}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            Preencha todos os campos obrigatórios
          </div>
        </div>
      </div>

      {/* Localização */}
      <div className="form-section">
        <div className="form-section-title">Localização</div>
        <button
          className="gps-btn"
          onClick={() => {
            if (!navigator.geolocation) {
              alert("Geolocalização não suportada neste navegador.");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                setGps(
                  `${pos.coords.latitude.toFixed(
                    6
                  )}, ${pos.coords.longitude.toFixed(6)}`
                ),
              (err) => {
                const msgs = {
                  1: "Permissão negada. Ative a localização.",
                  2: "Posição indisponível.",
                  3: "Tempo esgotado.",
                };
                alert(msgs[err.code] || "Erro ao obter localização.");
              },
              { enableHighAccuracy: true, timeout: 15000 }
            );
          }}
        >
          <Icon name="gps" size={16} color={T.accent} />
          {gps ? `GPS capturado: ${gps}` : "Capturar GPS automaticamente"}
        </button>
        <div style={{ marginTop: 12 }} />
        <div className="form-group">
          <label className="input-label">Endereço da obra *</label>
          <input
            className="input-field"
            placeholder="Rua, número"
            value={data.endereco}
            onChange={(e) => setData({ ...data, endereco: e.target.value })}
            style={formErrors.endereco ? { borderColor: T.danger } : {}}
          />
          {formErrors.endereco && (
            <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
              {formErrors.endereco}
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Bairro *</label>
            <select
              className="input-field"
              value={data.bairro}
              onChange={(e) => setData({ ...data, bairro: e.target.value })}
              style={formErrors.bairro ? { borderColor: T.danger } : {}}
            >
              <option value="">Selecione o bairro</option>
              {(user?.bairros || []).length > 0 && (
                <option disabled>-- Meus bairros --</option>
              )}
              {(user?.bairros || []).map((b) => (
                <option key={"my-" + b} value={b}>
                  {b}
                </option>
              ))}
              {(user?.bairros || []).length > 0 && (
                <option disabled>-- Outros bairros --</option>
              )}
              {[
                "Alto Maron",
                "Ayrton Senna",
                "Bateias",
                "Boa Vista",
                "Brasil",
                "Campinhos",
                "Candeias",
                "Centro",
                "Cruzeiro",
                "Distrito Industrial",
                "Espírito Santo",
                "Felícia",
                "Guarani",
                "Ibirapuera",
                "Jatobá",
                "Jurema",
                "Lagoa das Flores",
                "Nossa Senhora Aparecida",
                "Patagônia",
                "Primavera",
                "Recreio",
                "São Pedro",
                "Universidade",
                "Zabelê",
                "Zona Rural",
              ]
                .filter((b) => !(user?.bairros || []).includes(b))
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
            {formErrors.bairro && (
              <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
                {formErrors.bairro}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="input-label">CEP</label>
            <input className="input-field" placeholder="45000-000" />
          </div>
        </div>
        <div className="form-group">
          <label className="input-label">
            Loteamento{" "}
            <span style={{ color: T.muted, fontSize: 10 }}>(opcional)</span>
          </label>
          <input
            className="input-field"
            placeholder="Nome do loteamento, condomínio ou setor"
            value={data.loteamento}
            onChange={(e) => setData({ ...data, loteamento: e.target.value })}
          />
        </div>
      </div>

      {/* Proprietário */}
      <div className="form-section">
        <div className="form-section-title">Proprietário / Responsável</div>
        <div className="form-group">
          <label className="input-label">
            Nome completo{" "}
            <span style={{ color: T.danger, fontSize: 10 }}>*</span>
          </label>
          <input
            className="input-field"
            placeholder="Nome do proprietário ou responsável"
            value={data.proprietario}
            onChange={(e) => setData({ ...data, proprietario: e.target.value })}
            style={formErrors.proprietario ? { borderColor: T.danger } : {}}
          />
          {formErrors.proprietario && (
            <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
              {formErrors.proprietario}
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="input-label">CPF / CNPJ *</label>
            <input
              className="input-field"
              placeholder="CPF ou CNPJ"
              value={data.cpf}
              onChange={(e) =>
                setData({ ...data, cpf: maskCPF(e.target.value) })
              }
            />
          </div>
          <div className="form-group">
            <label className="input-label">Telefone</label>
            <input
              className="input-field"
              placeholder="(77) 9 0000-0000"
              value={data.telefone || ""}
              onChange={(e) =>
                setData({ ...data, telefone: maskTelefone(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* Infrações */}
      <div className="form-section">
        <div className="form-section-title">
          {isAuto ? "Infrações Cometidas" : "Irregularidades Identificadas"} —
          Lei nº 1.481/2007
        </div>

        {/* Tabs */}
        <div className="inf-tabs">
          <button
            className={`inf-tab inf-tab-blue ${
              infTab === "q61" ? "active" : ""
            }`}
            onClick={() => setInfTab("q61")}
          >
            Quadro 6.1 — Obras ({INFRACOES_Q61.length})
          </button>
          <button
            className={`inf-tab inf-tab-gold ${
              infTab === "q62" ? "active" : ""
            }`}
            onClick={() => setInfTab("q62")}
          >
            Quadro 6.2 — Urbanização ({INFRACOES_Q62.length})
          </button>
        </div>

        {/* Summary of selected */}
        {infracoesSel.length > 0 && (
          <div className="inf-summary">
            <div className="inf-summary-title">
              {infracoesSel.length} infração(ões) selecionada(s)
            </div>
            {infracoesSel.map((inf) => (
              <div key={inf.id} className="inf-summary-item">
                <span style={{ flex: 1 }}>
                  {inf.id} — {inf.desc.slice(0, 55)}
                  {inf.desc.length > 55 ? "…" : ""}
                </span>
                {isAuto && (
                  <span style={{ color: "#C62828", fontWeight: 700 }}>
                    R${" "}
                    {inf.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>
            ))}
            {isAuto && (
              <div className="inf-total">
                <span>Total de multas</span>
                <span>
                  R${" "}
                  {infracoesSel
                    .reduce((s, x) => s + x.valor, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* List */}
        <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
          {currentList.map((inf) => {
            const sel = infracoesSel.find((x) => x.id === inf.id);
            return (
              <div
                key={inf.id}
                className="inf-item"
                onClick={() => toggleInfracao(inf)}
              >
                <div
                  className="inf-check"
                  style={{
                    border: `2px solid ${sel ? T.accent : T.border}`,
                    background: sel ? T.accent : "transparent",
                  }}
                >
                  {sel && <Icon name="check" size={12} color="#fff" />}
                </div>
                <div className="inf-desc">
                  <div className="inf-id">
                    Item {inf.id} — {inf.penalidade}
                  </div>
                  <div>{inf.desc}</div>
                  {isAuto && (
                    <div
                      className="inf-valor"
                      style={{ color: sel ? T.danger : T.muted }}
                    >
                      R${" "}
                      {inf.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Observação livre */}
        <div style={{ marginTop: 16 }}>
          <label className="input-label">
            Observação / Descrição adicional
          </label>
          <textarea
            className="input-field"
            placeholder="Descreva detalhes adicionais da irregularidade observada, situação encontrada, nome do responsável presente, etc."
            value={data.descricao}
            onChange={(e) => setData({ ...data, descricao: e.target.value })}
          />
        </div>
        {isAuto && (
          <div style={{ marginTop: 12 }}>
            <label className="input-label">
              Obs. de recusa / ausência de assinatura{" "}
              <span style={{ color: T.muted, fontSize: 10 }}>(opcional)</span>
            </label>
            <textarea
              className="input-field"
              style={{ minHeight: 60, resize: "none" }}
              placeholder='Ex: "O infrator recusou-se a assinar o presente auto, na presença das testemunhas abaixo identificadas."'
              value={data.obsRecusa}
              onChange={(e) => setData({ ...data, obsRecusa: e.target.value })}
            />
          </div>
        )}
        {isAuto && (
          <div
            style={{
              marginTop: 12,
              background: "#FFFBEB",
              border: "1.5px solid #FCD34D",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 12,
                fontWeight: 800,
                color: T.gold,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Testemunhas (caso o infrator se recuse a assinar)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label className="input-label">Testemunha 1</label>
                <input
                  className="input-field"
                  placeholder="Nome completo"
                  value={data.testemunha1}
                  onChange={(e) =>
                    setData({ ...data, testemunha1: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="input-label">Testemunha 2</label>
                <input
                  className="input-field"
                  placeholder="Nome completo"
                  value={data.testemunha2}
                  onChange={(e) =>
                    setData({ ...data, testemunha2: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fotos */}
      <div className="form-section">
        <div className="form-section-title">Fotos da Fiscalização</div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
          Até 4 fotos · máx. 5 MB cada · comprimidas automaticamente antes do
          envio
        </div>
        <div className="photo-grid">
          {photos.map((slot, i) =>
            slot ? (
              <div
                key={i}
                className="photo-filled"
                style={{ position: "relative" }}
              >
                <img
                  src={slot.preview}
                  alt={`Foto ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 10,
                    display: "block",
                  }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: T.danger,
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    color: "#fff",
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                key={i}
                className="photo-slot"
                style={{ cursor: "pointer" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handlePhotoSelect(i, e.target.files[0])}
                />
                <Icon name="camera" size={24} color={T.muted} />
                <span>Adicionar foto</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Penalidade / Prazo */}
      <div className="form-section">
        {isAuto ? (
          <>
            <div className="form-section-title">Penalidade Aplicada</div>
            {infracoesSel.length > 0 ? (
              <div
                style={{
                  background: `${T.danger}12`,
                  border: `1px solid ${T.danger}40`,
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: T.muted }}>
                    Total calculado automaticamente
                  </span>
                  <span
                    style={{
                      fontFamily: T.font,
                      fontSize: 22,
                      fontWeight: 800,
                      color: T.danger,
                    }}
                  >
                    R${" "}
                    {infracoesSel
                      .reduce((s, x) => s + x.valor, 0)
                      .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  Baseado nas {infracoesSel.length} infração(ões) selecionada(s)
                  — Lei nº 1.481/2007
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: T.surface,
                  border: `1px dashed ${T.border}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: T.muted,
                  textAlign: "center",
                }}
              >
                Selecione as infrações acima para calcular o valor da multa.
              </div>
            )}
            <div
              style={{
                marginTop: 10,
                background: `${T.danger}08`,
                border: `1px solid ${T.danger}25`,
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16 }}></span>
              <div style={{ fontSize: 12, color: T.muted }}>
                Prazo fixo para regularização/recurso:{" "}
                <strong style={{ color: T.text }}>10 dias corridos</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-section-title">Prazo de Regularização</div>
            <div
              style={{
                background: `${T.gold}10`,
                border: `1px solid ${T.gold}30`,
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 10,
                fontSize: 12,
                color: T.muted,
              }}
            >
              A notificação é uma advertência —{" "}
              <strong style={{ color: T.gold }}>sem valor de multa</strong>. O
              contribuinte deve paralisar a obra e procurar o setor de
              fiscalização para regularizar.
            </div>
            <div className="form-group">
              <label className="input-label">
                Prazo para comparecer / regularizar
              </label>
              <select
                className="input-field"
                value={data.prazo}
                onChange={(e) => setData({ ...data, prazo: e.target.value })}
              >
                <option value="1">1 dia</option>
                <option value="2">2 dias</option>
                <option value="3">3 dias</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Identificação do Fiscal */}
      <div className="form-section">
        <div className="form-section-title">Identificação do Fiscal</div>
        <div
          style={{
            background: T.surface,
            border: `1.5px solid ${T.border}`,
            borderRadius: 12,
            padding: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Fiscal Responsável pela Autuação
          </div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: T.text,
            }}
          >
            {user?.name || "—"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: T.accent,
              marginTop: 4,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            Mat. {user?.matricula || "—"}
          </div>
          <div
            style={{
              marginTop: 12,
              borderTop: `1px solid ${T.border}`,
              paddingTop: 8,
              fontSize: 11,
              color: T.muted,
            }}
          >
            {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {(formErrors.proprietario ||
        formErrors.endereco ||
        formErrors.bairro ||
        formErrors.cpf ||
        formErrors.infracoes) && (
        <div
          style={{
            margin: "0 0 10px",
            padding: "10px 14px",
            background: `${T.danger}10`,
            border: `1px solid ${T.danger}40`,
            borderRadius: 10,
          }}
        >
          {formErrors.proprietario && (
            <div style={{ fontSize: 12, color: T.danger, marginBottom: 4 }}>
              ⚠️ {formErrors.proprietario}
            </div>
          )}
          {formErrors.endereco && (
            <div style={{ fontSize: 12, color: T.danger, marginBottom: 4 }}>
              ⚠️ {formErrors.endereco}
            </div>
          )}
          {formErrors.bairro && (
            <div style={{ fontSize: 12, color: T.danger, marginBottom: 4 }}>
              ⚠️ {formErrors.bairro}
            </div>
          )}
          {formErrors.cpf && (
            <div style={{ fontSize: 12, color: T.danger, marginBottom: 4 }}>
              {formErrors.cpf}
            </div>
          )}
          {formErrors.infracoes && (
            <div style={{ fontSize: 12, color: T.danger }}>
              {formErrors.infracoes}
            </div>
          )}
        </div>
      )}
      <div className="submit-row">
        <button
          className="btn-outline"
          onClick={() => {
            if (!validateForm()) return;
            onPreview(type, {
              ...data,
              photos: photos.filter(Boolean),
              infracoes: infracoesSel.map((x) =>
                isAuto
                  ? `${x.id} — ${x.desc} (R$ ${x.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })})`
                  : `${x.id} — ${x.desc}`
              ),
            });
          }}
        >
          <Icon name="file" size={16} />
          Preview
        </button>
        <button
          className={`btn-submit ${!isAuto ? "notif-btn" : ""}`}
          onClick={() => {
            if (!validateForm()) return;
            onPreview(type, {
              ...data,
              photos: photos.filter(Boolean),
              infracoes: infracoesSel.map((x) =>
                isAuto
                  ? `${x.id} — ${x.desc} (R$ ${x.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })})`
                  : `${x.id} — ${x.desc}`
              ),
            });
          }}
        >
          <Icon name="printer" size={16} />
          {isAuto ? "Lavrar Auto" : "Emitir Notificação"}
        </button>
      </div>
    </div>
  );
}

// --- Registros Screen --------------------------------------------------------

// --- PrazosScreen — Cronologia e controle de prazos -------------------------

function PrazosScreen({ records = [], user, onNav }) {
  const [filtro, setFiltro] = useState("todos"); // todos | vencidos | hoje | breve | ok
  const [tipo, setTipo] = useState("all"); // all | auto | notif
  const [search, setSearch] = useState("");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const enriched = records
    .filter((r) => r.status !== "Cancelado" && r.status !== "Regularizado")
    .map((r) => {
      const p = calcPrazo(r);
      return { ...r, prazoInfo: p };
    })
    .sort((a, b) => {
      const da = a.prazoInfo?.dias ?? 9999;
      const db = b.prazoInfo?.dias ?? 9999;
      return da - db;
    });

  const filtered = enriched.filter((r) => {
    if (tipo !== "all" && r.type !== tipo) return false;
    if (filtro === "vencidos" && !(r.prazoInfo?.dias < 0)) return false;
    if (filtro === "hoje" && !(r.prazoInfo?.dias === 0)) return false;
    if (
      filtro === "breve" &&
      !(r.prazoInfo?.dias > 0 && r.prazoInfo?.dias <= 5)
    )
      return false;
    if (filtro === "ok" && !(r.prazoInfo?.dias > 5)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.num || "").toLowerCase().includes(q) ||
        (r.owner || "").toLowerCase().includes(q) ||
        (r.addr || "").toLowerCase().includes(q) ||
        (r.bairro || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    todos: enriched.length,
    vencidos: enriched.filter((r) => r.prazoInfo?.dias < 0).length,
    hoje: enriched.filter((r) => r.prazoInfo?.dias === 0).length,
    breve: enriched.filter(
      (r) => r.prazoInfo?.dias > 0 && r.prazoInfo?.dias <= 5
    ).length,
    ok: enriched.filter((r) => r.prazoInfo?.dias > 5).length,
  };

  const chips = [
    { id: "todos", label: `Todos (${counts.todos})`, color: T.accent },
    {
      id: "vencidos",
      label: `Vencidos (${counts.vencidos})`,
      color: "#c0392b",
    },
    { id: "hoje", label: `Vencem hoje (${counts.hoje})`, color: "#e67e22" },
    { id: "breve", label: `Em até 5d (${counts.breve})`, color: "#f39c12" },
    { id: "ok", label: `No prazo (${counts.ok})`, color: "#27ae60" },
  ];

  return (
    <div style={{ padding: "0 16px 90px" }}>
      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 4,
          paddingTop: 8,
        }}
      >
        Controle de Prazos
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
        Autos e notificações ativos ordenados por vencimento
      </div>

      {/* Resumo rápido */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Vencidos",
            val: counts.vencidos,
            color: "#c0392b",
            bg: "#FEE2E2",
          },
          {
            label: "Vencem hoje",
            val: counts.hoje,
            color: "#e67e22",
            bg: "#FEF3C7",
          },
          {
            label: "Em até 5d",
            val: counts.breve,
            color: "#f39c12",
            bg: "#FEF9C3",
          },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() =>
              setFiltro(
                s.label === "Vencidos"
                  ? "vencidos"
                  : s.label === "Vencem hoje"
                  ? "hoje"
                  : "breve"
              )
            }
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 26,
                fontWeight: 800,
                color: s.color,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: s.color,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtro tipo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          ["all", "Todos"],
          ["auto", "Autos"],
          ["notif", "Notificações"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTipo(v)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1.5px solid ${tipo === v ? T.accent : T.border}`,
              background: tipo === v ? T.accent : "transparent",
              color: tipo === v ? "#fff" : T.muted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Chips de prazo */}
      <div className="filter-row" style={{ marginBottom: 12 }}>
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={`filter-chip ${filtro === c.id ? "active" : ""}`}
            style={
              filtro === c.id
                ? { background: c.color, borderColor: c.color }
                : {}
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <input
        className="input-field"
        placeholder="Buscar por número, proprietário ou endereço..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {/* Lista cronológica */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14 }}>Nenhum registro com este filtro</div>
        </div>
      ) : (
        filtered.map((r) => {
          const p = r.prazoInfo;
          const isVenc = p && p.dias < 0;
          const isHoje = p && p.dias === 0;
          const isBreve = p && p.dias > 0 && p.dias <= 2;
          const borderColor = isVenc
            ? "#c0392b"
            : isHoje
            ? "#e67e22"
            : isBreve
            ? "#f39c12"
            : T.border;
          return (
            <div
              key={r.id}
              onClick={() => onNav({ tab: "registros", openRecord: r })}
              style={{
                background: T.card,
                border: `2px solid ${borderColor}`,
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: T.font,
                      fontWeight: 800,
                      fontSize: 14,
                      color: r.type === "auto" ? T.danger : T.accent,
                    }}
                  >
                    {r.num}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      background:
                        r.type === "auto" ? `${T.danger}15` : `${T.accent}15`,
                      color: r.type === "auto" ? T.danger : T.accent,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontWeight: 700,
                    }}
                  >
                    {r.type === "auto" ? "AUTO" : "NOTIF"}
                  </span>
                </div>
                {p && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: p.color,
                      background: `${p.color}18`,
                      borderRadius: 8,
                      padding: "3px 10px",
                    }}
                  >
                    {p.emoji} {p.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                {r.owner}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>{r.addr}</div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 6,
                  fontSize: 11,
                  color: T.muted,
                }}
              >
                <span>📅 Emitido: {r.date}</span>
                <span>👤 {r.fiscal}</span>
                <span
                  style={{ marginLeft: "auto", fontWeight: 700, color: T.text }}
                >
                  {r.status}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


function RegistrosScreen({
  records = [],
  setRecords,
  user,
  initialFiltro,
  onClearFiltro,
  onEncaminharAuto,
  onAddLog,
}) {
  const [cancelando, setCancelando] = useState(null);
  const [motivoCancelFiscal, setMotivoCancelFiscal] = useState("");
  const [confirmAutoModal, setConfirmAutoModal] = useState(null); // record notif p/ confirmar reautuação
  const BAIRROS_VDC = [
    "Zabelê",
    "Brasil",
    "Jatobá",
    "Candeias",
    "Centro",
    "Universidade",
    "Boa Vista",
    "Felícia",
    "Ayrton Senna",
    "Espírito Santo",
    "Alto Maron",
    "Guarani",
    "Cruzeiro",
    "Nossa Senhora Aparecida",
    "Patagônia",
    "Campinhos",
    "Distrito Industrial",
    "São Pedro",
    "Ibirapuera",
    "Lagoa das Flores",
    "Primavera",
    "Recreio",
    "Jurema",
    "Bateias",
  ];
  const isAdmin = user?.role === "admin" || user?.role === "supervisor";

  // Tab principal: "notif" | "auto"
  const [tabPrincipal, setTabPrincipal] = useState(() =>
    initialFiltro?.tipo === "auto" ? "auto" : "notif"
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => initialFiltro?.status || "all");
  const [bairro, setBairro] = useState("");
  const [dataInicio, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [selected, setSelected] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [reprint, setReprint] = useState(null); // record a reimprimir

  // Sync quando filtro externo muda (clique nos cards do dashboard)
  useEffect(() => {
    if (initialFiltro) {
      if (initialFiltro.tipo === "auto") setTabPrincipal("auto");
      else if (initialFiltro.tipo === "notif") setTabPrincipal("notif");
      setStatus(initialFiltro.status || "all");
    }
  }, [initialFiltro]);

  // Filtro de tipo vem da tab principal agora
  const tipo = tabPrincipal;

  const parseDate = (str) => {
    if (!str) return null;
    const [d, m, a] = str.split("/");
    return new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
  };

  const filtered = records
    .filter((r) => {
      if (tipo !== "all" && r.type !== tipo) return false;
      if (status !== "all" && r.status !== status) return false;
      if (bairro && r.bairro !== bairro) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          (r.owner || "").toLowerCase().includes(q) ||
          (r.num || "").toLowerCase().includes(q) ||
          (r.addr || "").toLowerCase().includes(q) ||
          (r.fiscal || "").toLowerCase().includes(q) ||
          (r.cpf || "").includes(q);
        if (!match) return false;
      }
      if (dataInicio) {
        const d = parseDate(r.date);
        const ini = new Date(dataInicio);
        if (!d || d < ini) return false;
      }
      if (dataFim) {
        const d = parseDate(r.date);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59);
        if (!d || d > fim) return false;
      }
      return true;
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const updateStatus = (id, s) => {
    if (setRecords)
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: s } : r))
      );
    setSelected((prev) => (prev?.id === id ? { ...prev, status: s } : prev));
  };

  const statusCfg = {
    Pendente: { color: T.gold, emoji: "" },
    Regularizado: { color: T.success, emoji: "" },
    Embargado: { color: T.danger, emoji: "" },
    "Em recurso": { color: T.accent, emoji: "" },
    Autuado: { color: "#e84393", emoji: "" },
    "Multa Encaminhada": { color: "#9B59B6", emoji: "" },
    Cancelado: { color: T.muted, emoji: "" },
  };

  const temFiltro =
    tipo !== "all" || status !== "all" || bairro || dataInicio || dataFim;

  return (
    <div className="history-screen">
      {/* Detail modal */}

      {/* Modal confirmação de reautuação */}
      {confirmAutoModal && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmAutoModal(null)}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div
              style={{
                fontFamily: T.font,
                fontSize: 17,
                fontWeight: 800,
                color: T.gold,
                marginBottom: 8,
              }}
            >
              Auto já existente
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
              Já existe o{" "}
              <strong style={{ color: T.danger }}>
                {confirmAutoModal.autoNum}
              </strong>{" "}
              gerado a partir desta notificação.
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              Deseja encaminhar para uma <strong>nova autuação</strong> mesmo
              assim?
            </div>
            <div className="submit-row">
              <button
                className="btn-outline"
                onClick={() => setConfirmAutoModal(null)}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onEncaminharAuto(confirmAutoModal.rec);
                  setSelected(null);
                  setConfirmAutoModal(null);
                }}
                style={{
                  flex: 1,
                  background: T.danger,
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sim, gerar novo auto
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de cancelamento pelo fiscal */}
      {cancelando && (
        <div
          className="modal-overlay"
          onClick={() => {
            setCancelando(null);
            setMotivoCancelFiscal("");
          }}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div
              style={{
                fontFamily: T.font,
                fontSize: 17,
                fontWeight: 800,
                color: T.danger,
                marginBottom: 6,
              }}
            >
              Cancelar / Anular Registro
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              {cancelando.num} — {cancelando.owner}
            </div>
            <div
              style={{
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}30`,
                borderRadius: 10,
                padding: 10,
                marginBottom: 14,
                fontSize: 11,
                color: T.danger,
              }}
            >
              ⚠️ Esta ação é irreversível e ficará registrada no log do sistema.
            </div>
            <div className="form-group">
              <label className="input-label">Motivo / Justificativa *</label>
              <textarea
                className="input-field"
                style={{ minHeight: 80, resize: "none" }}
                placeholder="Descreva o motivo do cancelamento..."
                value={motivoCancelFiscal}
                onChange={(e) => setMotivoCancelFiscal(e.target.value)}
              />
            </div>
            <div className="submit-row">
              <button
                className="btn-outline"
                onClick={() => {
                  setCancelando(null);
                  setMotivoCancelFiscal("");
                }}
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!motivoCancelFiscal.trim()) return;
                  if (onAddLog)
                    onAddLog(
                      "Registro cancelado pelo fiscal",
                      `${cancelando.num} — ${cancelando.owner} — Motivo: ${motivoCancelFiscal}`,
                      user?.name
                    );
                  setRecords((prev) =>
                    prev.map((r) =>
                      r.id === cancelando.id
                        ? {
                            ...r,
                            status: "Cancelado",
                            motivoCancel: motivoCancelFiscal,
                            canceladoEm: new Date().toLocaleDateString("pt-BR"),
                          }
                        : r
                    )
                  );
                  setSelected(null);
                  setCancelando(null);
                  setMotivoCancelFiscal("");
                }}
                style={{
                  flex: 1,
                  background: T.danger,
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: motivoCancelFiscal.trim() ? 1 : 0.5,
                }}
              >
                ✔ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-sheet"
            style={{ maxHeight: "94vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background:
                    selected.type === "auto" ? `${T.danger}18` : `${T.gold}18`,
                  border: `1.5px solid ${
                    selected.type === "auto" ? T.danger : T.gold
                  }`,
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: T.font,
                  fontSize: 13,
                  fontWeight: 800,
                  color: selected.type === "auto" ? T.danger : T.gold,
                }}
              >
                {selected.type === "auto" ? "AUTO" : "NOTIF."}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800 }}
                >
                  {selected.num}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {selected.date} · {selected.fiscal} · Mat.{" "}
                  {selected.matricula}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  background: `${
                    (statusCfg[selected.status] || statusCfg["Pendente"]).color
                  }18`,
                  color: (statusCfg[selected.status] || statusCfg["Pendente"])
                    .color,
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontWeight: 700,
                }}
              >
                {selected.status}
              </span>
            </div>

            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            >
              {[
                { l: "Proprietário/Infrator", v: selected.owner },
                { l: "CPF/CNPJ", v: selected.cpf || "—" },
                { l: "Endereço", v: selected.addr },
                { l: "Bairro", v: selected.bairro || "—" },
                { l: "Descrição", v: selected.descricao || "—" },
                ...(selected.type === "auto"
                  ? [{ l: "Multa", v: `R$ ${selected.multa || "—"}` }]
                  : []),
                {
                  l: "Prazo",
                  v:
                    selected.type === "auto"
                      ? "10 dias corridos"
                      : `${selected.prazo || 1} dia(s) corrido(s)`,
                },
              ].map((row) => (
                <div
                  key={row.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <span style={{ color: T.muted, flexShrink: 0 }}>{row.l}</span>
                  <span style={{ color: T.text, textAlign: "right" }}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>

            {selected.infracoes?.length > 0 && (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: T.accent,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Infrações / Irregularidades ({selected.infracoes.length})
                </div>
                {selected.infracoes.map((inf, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "4px 0",
                      borderBottom: `1px solid ${T.border}`,
                      color: T.muted,
                    }}
                  >
                    • {inf}
                  </div>
                ))}
              </div>
            )}

            {/* Fotos da Fiscalização */}
            {selected.fotoUrls?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: T.accent,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  Fotos da Fiscalização ({selected.fotoUrls.length})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {selected.fotoUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        borderRadius: 10,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                      }}
                    >
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: T.accent,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Atualizar Situação
              </div>
              {(() => {
                const btnsNotif = [
                  "Pendente",
                  "Regularizado",
                  "Em recurso",
                  "Autuado",
                ];
                const btnsAuto = [
                  "Pendente",
                  "Regularizado",
                  "Embargado",
                  "Em recurso",
                  "Multa Encaminhada",
                ];
                const visíveis =
                  selected.type === "notif" ? btnsNotif : btnsAuto;
                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {visíveis.map((s) => {
                      const cfg = statusCfg[s] || statusCfg["Pendente"];
                      const ativo = selected.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(selected.id, s)}
                          style={{
                            background: ativo ? `${cfg.color}22` : T.surface,
                            border: `2px solid ${ativo ? cfg.color : T.border}`,
                            borderRadius: 10,
                            padding: "10px 6px",
                            cursor: "pointer",
                            color: ativo ? cfg.color : T.muted,
                            fontSize: 12,
                            fontWeight: 700,
                            transition: "all 0.15s",
                            gridColumn:
                              s === "Multa Encaminhada" ? "1 / -1" : undefined,
                          }}
                        >
                          {cfg.emoji} {s}
                          {ativo && (
                            <span
                              style={{ marginLeft: 4, fontSize: 10 }}
                            ></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {selected.type === "notif" && selected.status === "Autuado" && (
                <div
                  style={{
                    marginTop: 8,
                    background: `${"#e84393"}10`,
                    border: `1px solid ${"#e84393"}30`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#e84393",
                  }}
                >
                  Esta notificação evoluiu para Auto de Infração.
                </div>
              )}
              {selected.type === "auto" &&
                selected.status === "Multa Encaminhada" && (
                  <div
                    style={{
                      marginTop: 8,
                      background: `${"#9B59B6"}10`,
                      border: `1px solid ${"#9B59B6"}30`,
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#9B59B6",
                    }}
                  >
                    Multa encaminhada para cobrança. O embargo pode ser aplicado
                    separadamente caso a obra continue.
                  </div>
                )}
            </div>

            {selected?.type === "notif" &&
              onEncaminharAuto &&
              user?.role !== "supervisor" &&
              user?.role !== "admin" &&
              (() => {
                const jaAuto = records.some(
                  (r) => r.type === "auto" && r._notifId === selected.id
                );
                return (
                  <button
                    onClick={() => {
                      if (jaAuto) {
                        const autoRef = records.find(
                          (r) => r.type === "auto" && r._notifId === selected.id
                        );
                        setConfirmAutoModal({
                          rec: selected,
                          autoNum: autoRef?.num || "Auto de Infração",
                        });
                      } else {
                        onEncaminharAuto(selected);
                        setSelected(null);
                      }
                    }}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      background: T.danger,
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                      padding: 14,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {jaAuto
                      ? "↑ Gerar novo auto (já existe um)"
                      : "↑ Encaminhar para Autuação"}
                  </button>
                );
              })()}
            <button
              onClick={() => {
                setReprint(selected);
                setSelected(null);
              }}
              style={{
                width: "100%",
                marginBottom: 8,
                background: T.surface,
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                color: T.text,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Reimprimir documento
            </button>
            {selected.status !== "Cancelado" && (
              <button
                onClick={() => setCancelando(selected)}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  background: "none",
                  border: `1px solid ${T.danger}50`,
                  borderRadius: 12,
                  color: T.danger,
                  padding: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✕ Cancelar / Anular registro
              </button>
            )}
            <button
              onClick={() => setSelected(null)}
              className="btn-outline"
              style={{ width: "100%" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de reimpressão */}
      {reprint && (
        <div className="modal-overlay" onClick={() => setReprint(null)}>
          <div
            className="modal-sheet"
            style={{ maxHeight: "94vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <p
              style={{
                fontFamily: T.font,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 14,
                color: reprint.type === "auto" ? T.danger : T.gold,
              }}
            >
              {reprint.type === "auto"
                ? "Auto de Infração"
                : "Notificação Preliminar"}{" "}
              — Reimpressão
            </p>

            <div className="doc-preview" id="reprint-doc-content">
              <div className="doc-header">
                <h2>Prefeitura Municipal de Vitória da Conquista</h2>
                <p>Secretaria Municipal de Infraestrutura Urbana</p>
                <p>Gerência de Fiscalização de Obras</p>
              </div>
              <div className="doc-num">
                {reprint.type === "auto"
                  ? "AUTO DE INFRAÇÃO"
                  : "NOTIFICAÇÃO PRELIMINAR"}{" "}
                Nº {reprint.num}
              </div>
              <div className="doc-section-title">Dados da Obra / Infrator</div>
              <div className="doc-field">
                <span className="doc-field-label">Proprietário:</span>
                <span>{reprint.owner || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">CPF/CNPJ:</span>
                <span>{reprint.cpf || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">Endereço:</span>
                <span>{reprint.addr || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">Bairro:</span>
                <span>{reprint.bairro || "—"}</span>
              </div>
              {reprint.loteamento && (
                <div className="doc-field">
                  <span className="doc-field-label">Loteamento:</span>
                  <span>{reprint.loteamento}</span>
                </div>
              )}

              <div className="doc-section-title">
                {reprint.type === "auto"
                  ? "Infrações Cometidas"
                  : "Irregularidade Identificada"}
              </div>
              <div className="doc-infracoes">
                {reprint.infracoes?.length > 0 ? (
                  reprint.infracoes.map((inf, i) => <div key={i}>• {inf}</div>)
                ) : (
                  <div style={{ color: "#aaa" }}>— Não informado —</div>
                )}
              </div>
              {reprint.descricao && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <strong>Obs:</strong> {reprint.descricao}
                </div>
              )}

              {reprint.type === "auto" && reprint.multa && (
                <>
                  <div className="doc-section-title">Penalidade</div>
                  <div className="doc-field">
                    <span className="doc-field-label">Valor da multa:</span>
                    <span style={{ color: "#c0392b", fontWeight: 700 }}>
                      R$ {reprint.multa}
                    </span>
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">
                      Prazo para regularização:
                    </span>
                    <span>10 (dez) dias corridos</span>
                  </div>
                </>
              )}
              {reprint.type === "notif" && (
                <>
                  <div className="doc-section-title">
                    Prazo para Regularização
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Prazo:</span>
                    <span>
                      {reprint.prazo || "1"} dia(s) corrido(s) a partir da data
                      de emissão
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                    Acesse o portal para enviar sua defesa ou regularizar a
                    situação.
                  </div>
                </>
              )}

              {reprint.type === "auto" ? (
                <>
                  <div className="doc-section-title">Assinaturas</div>
                  <div className="doc-sig-area">
                    <div className="doc-sig-box">
                      <strong>Agente de Fiscalização</strong>
                      <br />
                      {reprint.fiscal || "—"}
                      <br />
                      Mat. {reprint.matricula || "—"}
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                  </div>
                  <div className="doc-sig-area" style={{ marginTop: 8 }}>
                    <div className="doc-sig-box">
                      <strong>Testemunha 1</strong>
                      <br />
                      Nome: ___________________
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                    <div className="doc-sig-box">
                      <strong>Testemunha 2</strong>
                      <br />
                      Nome: ___________________
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="doc-section-title">
                    Identificação do Agente
                  </div>
                  <div
                    className="doc-sig-area"
                    style={{ justifyContent: "center" }}
                  >
                    <div
                      className="doc-sig-box"
                      style={{ textAlign: "center" }}
                    >
                      Agente de Fiscalização
                      <br />
                      <strong>{reprint.fiscal || "—"}</strong>
                      <br />
                      Mat. {reprint.matricula || "—"}
                    </div>
                  </div>
                </>
              )}
              <div
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 10,
                  color: "#888",
                }}
              >
                Vitória da Conquista — Emitido em {reprint.date} — FISCON
              </div>
              <div
                style={{
                  marginTop: 4,
                  textAlign: "center",
                  fontSize: 9,
                  color: "#bbb",
                  fontStyle: "italic",
                }}
              >
                2ª via / Reimpressão
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-print"
                onClick={() =>
                  reprint &&
                  gerarPDFA4(
                    reprint.type,
                    {
                      num: reprint.num,
                      proprietario: reprint.owner,
                      cpf: reprint.cpf,
                      endereco: reprint.addr,
                      bairro: reprint.bairro,
                      loteamento: reprint.loteamento,
                      infracoes: reprint.infracoes,
                      descricao: reprint.descricao,
                      multa: reprint.multa,
                      prazo: reprint.prazo,
                      fiscal: reprint.fiscal,
                      matricula: reprint.matricula,
                      codigoAcesso: reprint.codigo_acesso,
                      testemunha1: reprint.testemunha1 || "",
                      testemunha2: reprint.testemunha2 || "",
                      obsRecusa: reprint.obsRecusa || "",
                    },
                    PORTAL_URL
                  )
                }
              >
                PDF A4 — Modelo Oficial
              </button>
              <button
                onClick={() =>
                  reprint &&
                  imprimirTermica(reprint.type, {
                    num: reprint.num,
                    proprietario: reprint.owner,
                    cpf: reprint.cpf,
                    endereco: reprint.addr,
                    bairro: reprint.bairro,
                    loteamento: reprint.loteamento,
                    infracoes: reprint.infracoes,
                    descricao: reprint.descricao,
                    multa: reprint.multa,
                    prazo: reprint.prazo,
                    fiscal: reprint.fiscal,
                    matricula: reprint.matricula,
                  })
                }
                style={{
                  flex: 1,
                  background: "#1a1a1a",
                  border: "1.5px dashed #555",
                  borderRadius: 10,
                  color: "#ccc",
                  padding: "10px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Térmica 58mm
              </button>
              <button
                className="btn-outline"
                style={{ flex: 1 }}
                onClick={() => setReprint(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header + tabs principais */}
      <div style={{ padding: "0 16px 0" }}>
        <div
          style={{
            fontFamily: T.font,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          Registros
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            {
              id: "notif",
              label: "Notificações",
              count: records.filter((r) => r.type === "notif").length,
              color: T.gold,
            },
            {
              id: "auto",
              label: "Autos de Infração",
              count: records.filter((r) => r.type === "auto").length,
              color: T.danger,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTabPrincipal(t.id);
                setStatus("all");
              }}
              style={{
                flex: 1,
                background: tabPrincipal === t.id ? `${t.color}18` : T.surface,
                border: `2px solid ${
                  tabPrincipal === t.id ? t.color : T.border
                }`,
                borderRadius: 12,
                padding: "10px 8px",
                cursor: "pointer",
                color: tabPrincipal === t.id ? t.color : T.muted,
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.15s",
              }}
            >
              <div>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                {t.count}
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            style={{
              background: temFiltro ? `${T.accent}18` : T.surface,
              border: `1px solid ${temFiltro ? T.accent : T.border}`,
              borderRadius: 10,
              padding: "6px 12px",
              cursor: "pointer",
              color: temFiltro ? T.accent : T.muted,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Filtros {temFiltro ? "(ativos)" : ""}
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="search-bar">
        <input
          placeholder="Nome, número, endereço, CPF, fiscal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros avançados */}
      {showFiltros && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            margin: "0 16px 12px",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.accent,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Filtros avançados
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                Situação
              </div>
              <select
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="all">Todas</option>
                <option value="Pendente">Pendente</option>
                <option value="Regularizado">Regularizado</option>
                <option value="Embargado">Embargado</option>
                <option value="Em recurso">Em recurso</option>
                <option value="Autuado">Autuado (notif. evoluída)</option>
                <option value="Multa Encaminhada">Multa Encaminhada</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
              Bairro
            </div>
            <select
              className="input-field"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Todos os bairros</option>
              {BAIRROS_VDC.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                Data início
              </div>
              <input
                type="date"
                className="input-field"
                value={dataInicio}
                onChange={(e) => setDataIni(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                Data fim
              </div>
              <input
                type="date"
                className="input-field"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          {temFiltro && (
            <button
              onClick={() => {
                setTipo("all");
                setStatus("all");
                setBairro("");
                setDataIni("");
                setDataFim("");
              }}
              style={{
                width: "100%",
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}30`,
                color: T.danger,
                borderRadius: 8,
                padding: "8px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Contadores rápidos */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 16px 12px",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: "Notificações",
            val: records.filter((r) => r.type === "notif").length,
            color: T.gold,
          },
          {
            label: "Autos",
            val: records.filter((r) => r.type === "auto").length,
            color: T.danger,
          },
          {
            label: "Pendentes",
            val: records.filter((r) => r.status === "Pendente").length,
            color: T.gold,
          },
          {
            label: "Resolvidos",
            val: records.filter((r) => r.status === "Regularizado").length,
            color: T.success,
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: `${c.color}12`,
              border: `1px solid ${c.color}30`,
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              color: c.color,
              fontWeight: 700,
            }}
          >
            {c.val} {c.label}
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="record-list">
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: T.muted,
              fontSize: 13,
            }}
          >
            {records.length === 0
              ? "Nenhum registro ainda."
              : "Nenhum resultado para os filtros aplicados."}
          </div>
        )}
        {filtered.map((r) => {
          const sc = statusCfg[r.status] || statusCfg["Pendente"];
          return (
            <div
              key={r.id}
              className={`record-item ${r.type}`}
              onClick={() => setSelected(r)}
              style={{ cursor: "pointer" }}
            >
              <div className="record-header">
                <div className="record-num">{r.num}</div>
                <div className="record-date">{r.date}</div>
              </div>
              <div className="record-owner">{r.owner}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                {r.addr}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 6,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    background:
                      r.type === "notif" ? `${T.gold}18` : `${T.danger}18`,
                    color: r.type === "notif" ? T.gold : T.danger,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontWeight: 700,
                  }}
                >
                  {r.type === "notif" ? "Notif." : "Auto"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: `${sc.color}18`,
                    color: sc.color,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontWeight: 700,
                  }}
                >
                  {sc.emoji} {r.status}
                </span>
                {r.type === "auto" && r.multa && (
                  <span
                    style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}
                  >
                    R$ {r.multa}
                  </span>
                )}
                <span
                  style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}
                >
                  {r.fiscal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function HistoryScreen({ records = [], setRecords, user }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [reprint, setReprint] = useState(null);

  const filters = [
    { id: "all", label: `Todos (${records.length})` },
    {
      id: "notif",
      label: `Notificações (${
        records.filter((r) => r.type === "notif").length
      })`,
    },
    {
      id: "auto",
      label: `Autos (${records.filter((r) => r.type === "auto").length})`,
    },
    {
      id: "Pendente",
      label: `Pendentes (${
        records.filter((r) => r.status === "Pendente").length
      })`,
    },
    {
      id: "Regularizado",
      label: `Resolvidos (${
        records.filter((r) => r.status === "Regularizado").length
      })`,
    },
  ];

  const filtered = records.filter((r) => {
    const matchF = filter === "all" || r.type === filter || r.status === filter;
    const matchS =
      !search ||
      (r.owner || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.num || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.addr || "").toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const updateStatus = (id, status) => {
    if (setRecords)
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev
    );
  };

  const statusCfg = {
    Pendente: { color: T.gold, label: "Pendente" },
    Regularizado: { color: T.success, label: "Regularizado" },
    Embargado: { color: T.danger, label: "Embargado" },
    "Em recurso": { color: T.accent, label: "Em recurso" },
    Autuado: { color: "#e84393", label: "Autuado" },
    "Multa Encaminhada": { color: "#9B59B6", label: "Multa Encaminhada" },
  };

  return (
    <div className="history-screen">
      {/* Detail Modal */}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-sheet"
            style={{ maxHeight: "94vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background:
                    selected.type === "auto" ? `${T.danger}18` : `${T.gold}18`,
                  border: `1.5px solid ${
                    selected.type === "auto" ? T.danger : T.gold
                  }`,
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: T.font,
                  fontSize: 13,
                  fontWeight: 800,
                  color: selected.type === "auto" ? T.danger : T.gold,
                }}
              >
                {selected.type === "auto" ? "AUTO" : "NOTIF."}
              </div>
              <div>
                <div
                  style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800 }}
                >
                  {selected.num}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {selected.date} · Fiscal: {selected.fiscal}
                </div>
              </div>
            </div>

            {/* Dados */}
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              {[
                { l: "Proprietário", v: selected.owner },
                { l: "CPF/CNPJ", v: selected.cpf || "—" },
                { l: "Endereço", v: selected.addr },
                { l: "Descrição", v: selected.descricao || "—" },
                ...(selected.type === "auto"
                  ? [{ l: "Multa", v: `R$ ${selected.multa || "—"}` }]
                  : []),
                {
                  l: "Prazo",
                  v:
                    selected.type === "auto"
                      ? "10 dias corridos"
                      : `${selected.prazo || 1} dia(s) corrido(s)`,
                },
              ].map((row) => (
                <div
                  key={row.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: T.muted }}>{row.l}</span>
                  <span
                    style={{
                      color: T.text,
                      maxWidth: "60%",
                      textAlign: "right",
                    }}
                  >
                    {row.v}
                  </span>
                </div>
              ))}
            </div>

            {/* Infrações */}
            {selected.infracoes?.length > 0 && (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: T.accent,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Infrações / Irregularidades
                </div>
                {selected.infracoes.map((inf, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "4px 0",
                      borderBottom: `1px solid ${T.border}`,
                      color: T.muted,
                    }}
                  >
                    • {inf}
                  </div>
                ))}
              </div>
            )}

            {/* Alterar status */}
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: T.accent,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Atualizar Situação
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {Object.entries(statusCfg).map(([s, cfg]) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    style={{
                      background:
                        selected.status === s ? `${cfg.color}22` : T.surface,
                      border: `1.5px solid ${
                        selected.status === s ? cfg.color : T.border
                      }`,
                      borderRadius: 10,
                      padding: "10px 8px",
                      cursor: "pointer",
                      color: selected.status === s ? cfg.color : T.muted,
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                  >
                    {selected.status === s ? "? " : ""}
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setReprint(selected);
                setSelected(null);
              }}
              style={{
                width: "100%",
                marginBottom: 8,
                background: T.surface,
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                color: T.text,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Reimprimir documento
            </button>
            {selected.status !== "Cancelado" && (
              <button
                onClick={() => setCancelando(selected)}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  background: "none",
                  border: `1px solid ${T.danger}50`,
                  borderRadius: 12,
                  color: T.danger,
                  padding: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✕ Cancelar / Anular registro
              </button>
            )}
            <button
              onClick={() => setSelected(null)}
              className="btn-outline"
              style={{ width: "100%" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Reimpressão HistoryScreen */}
      {reprint && (
        <div className="modal-overlay" onClick={() => setReprint(null)}>
          <div
            className="modal-sheet"
            style={{ maxHeight: "94vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <p
              style={{
                fontFamily: T.font,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 14,
                color: reprint.type === "auto" ? T.danger : T.gold,
              }}
            >
              {reprint.type === "auto"
                ? "Auto de Infração"
                : "Notificação Preliminar"}{" "}
              — Reimpressão
            </p>
            <div className="doc-preview" id="reprint-doc-content">
              <div className="doc-header">
                <h2>Prefeitura Municipal de Vitória da Conquista</h2>
                <p>Secretaria Municipal de Infraestrutura Urbana</p>
                <p>Gerência de Fiscalização de Obras</p>
              </div>
              <div className="doc-num">
                {reprint.type === "auto"
                  ? "AUTO DE INFRAÇÃO"
                  : "NOTIFICAÇÃO PRELIMINAR"}{" "}
                Nº {reprint.num}
              </div>
              <div className="doc-section-title">Dados da Obra / Infrator</div>
              <div className="doc-field">
                <span className="doc-field-label">Proprietário:</span>
                <span>{reprint.owner || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">CPF/CNPJ:</span>
                <span>{reprint.cpf || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">Endereço:</span>
                <span>{reprint.addr || "—"}</span>
              </div>
              <div className="doc-field">
                <span className="doc-field-label">Bairro:</span>
                <span>{reprint.bairro || "—"}</span>
              </div>
              {reprint.loteamento && (
                <div className="doc-field">
                  <span className="doc-field-label">Loteamento:</span>
                  <span>{reprint.loteamento}</span>
                </div>
              )}
              <div className="doc-section-title">
                {reprint.type === "auto"
                  ? "Infrações Cometidas"
                  : "Irregularidade Identificada"}
              </div>
              <div className="doc-infracoes">
                {reprint.infracoes?.length > 0 ? (
                  reprint.infracoes.map((inf, i) => <div key={i}>• {inf}</div>)
                ) : (
                  <div style={{ color: "#aaa" }}>— Não informado —</div>
                )}
              </div>
              {reprint.descricao && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <strong>Obs:</strong> {reprint.descricao}
                </div>
              )}
              {reprint.type === "auto" && reprint.multa && (
                <>
                  <div className="doc-section-title">Penalidade</div>
                  <div className="doc-field">
                    <span className="doc-field-label">Multa:</span>
                    <span style={{ color: "#c0392b", fontWeight: 700 }}>
                      R$ {reprint.multa}
                    </span>
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Prazo:</span>
                    <span>10 (dez) dias corridos</span>
                  </div>
                </>
              )}
              {reprint.type === "notif" && (
                <>
                  <div className="doc-section-title">
                    Prazo para Regularização
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Prazo:</span>
                    <span>
                      {reprint.prazo || "1"} dia(s) corrido(s) a partir da data
                      de emissão
                    </span>
                  </div>
                </>
              )}
              {reprint.type === "auto" ? (
                <>
                  <div className="doc-section-title">Assinaturas</div>
                  <div className="doc-sig-area">
                    <div className="doc-sig-box">
                      <strong>Agente de Fiscalização</strong>
                      <br />
                      {reprint.fiscal || "—"}
                      <br />
                      Mat. {reprint.matricula || "—"}
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                  </div>
                  <div className="doc-sig-area" style={{ marginTop: 8 }}>
                    <div className="doc-sig-box">
                      <strong>Testemunha 1</strong>
                      <br />
                      Nome: ___________________
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                    <div className="doc-sig-box">
                      <strong>Testemunha 2</strong>
                      <br />
                      Nome: ___________________
                      <br />
                      <br />
                      Ass. _____________
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="doc-section-title">
                    Identificação do Agente
                  </div>
                  <div
                    className="doc-sig-area"
                    style={{ justifyContent: "center" }}
                  >
                    <div
                      className="doc-sig-box"
                      style={{ textAlign: "center" }}
                    >
                      Agente de Fiscalização
                      <br />
                      <strong>{reprint.fiscal || "—"}</strong>
                      <br />
                      Mat. {reprint.matricula || "—"}
                    </div>
                  </div>
                </>
              )}
              <div
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 10,
                  color: "#888",
                }}
              >
                Vitória da Conquista — Emitido em {reprint.date} — 2ª via /
                Reimpressão
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-print"
                onClick={() =>
                  reprint &&
                  gerarPDFA4(
                    reprint.type,
                    {
                      num: reprint.num,
                      proprietario: reprint.owner,
                      cpf: reprint.cpf,
                      endereco: reprint.addr,
                      bairro: reprint.bairro,
                      loteamento: reprint.loteamento,
                      infracoes: reprint.infracoes,
                      descricao: reprint.descricao,
                      multa: reprint.multa,
                      prazo: reprint.prazo,
                      fiscal: reprint.fiscal,
                      matricula: reprint.matricula,
                      codigoAcesso: reprint.codigo_acesso,
                      testemunha1: reprint.testemunha1 || "",
                      testemunha2: reprint.testemunha2 || "",
                      obsRecusa: reprint.obsRecusa || "",
                    },
                    PORTAL_URL
                  )
                }
              >
                PDF A4 — Modelo Oficial
              </button>
              <button
                onClick={() =>
                  reprint &&
                  imprimirTermica(reprint.type, {
                    num: reprint.num,
                    proprietario: reprint.owner,
                    cpf: reprint.cpf,
                    endereco: reprint.addr,
                    bairro: reprint.bairro,
                    loteamento: reprint.loteamento,
                    infracoes: reprint.infracoes,
                    descricao: reprint.descricao,
                    multa: reprint.multa,
                    prazo: reprint.prazo,
                    fiscal: reprint.fiscal,
                    matricula: reprint.matricula,
                  })
                }
                style={{
                  flex: 1,
                  background: "#1a1a1a",
                  border: "1.5px dashed #555",
                  borderRadius: 10,
                  color: "#ccc",
                  padding: "10px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Térmica 58mm
              </button>
              <button
                className="btn-outline"
                style={{ flex: 1 }}
                onClick={() => setReprint(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          fontFamily: T.font,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 14,
          padding: "0 16px",
        }}
      >
        Histórico
      </div>

      <div className="search-bar">
        <input
          placeholder="Buscar por nome, número, endereço"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="record-list">
        {filtered.map((r) => {
          const sc = statusCfg[r.status] || statusCfg["Pendente"];
          return (
            <div
              key={r.id}
              className={`record-item ${r.type}`}
              onClick={() => setSelected(r)}
              style={{ cursor: "pointer" }}
            >
              <div className="record-header">
                <div className="record-num">{r.num}</div>
                <div className="record-date">{r.date}</div>
              </div>
              <div className="record-owner">{r.owner}</div>
              <div className="record-addr">{r.addr}</div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 6,
                  alignItems: "center",
                }}
              >
                <span
                  className={`badge ${
                    r.type === "notif" ? "badge-gold" : "badge-danger"
                  }`}
                >
                  {r.type === "notif" ? "Notif." : "Auto"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: `${sc.color}18`,
                    color: sc.color,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontWeight: 700,
                  }}
                >
                  {r.status}
                </span>
                <span
                  style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}
                >
                  {r.fiscal}
                </span>
              </div>
              {r.type === "auto" && r.multa && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.danger,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Multa: R$ {r.multa}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: T.muted,
              fontSize: 13,
            }}
          >
            {records.length === 0
              ? "Nenhum documento registrado ainda."
              : "Nenhum registro encontrado."}
          </div>
        )}
      </div>
    </div>
  );
}


// --- Modal de Confirmação de Exclusão ----------------------------------------
function ConfirmDeleteModal({ user, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-sheet"
        style={{ maxHeight: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}></div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Remover Usuário?
          </div>
          <div style={{ fontSize: 14, color: T.muted, marginBottom: 6 }}>
            Esta ação não pode ser desfeita.
          </div>
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "10px 14px",
              margin: "16px 0",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{user.email}</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 10,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                background: T.danger,
                border: "none",
                color: "#fff",
                borderRadius: 10,
                padding: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sim, remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Modal de Criar / Editar Usuário -----------------------------------------

function UserFormModal({ user, onSave, onCancel }) {
  const isEdit = !!user;
  const BAIRROS_VDC = [
    "Zabelê",
    "Brasil",
    "Jatobá",
    "Candeias",
    "Centro",
    "Universidade",
    "Boa Vista",
    "Felícia",
    "Ayrton Senna",
    "Espírito Santo",
    "Alto Maron",
    "Guarani",
    "Cruzeiro",
    "Nossa Senhora Aparecida",
    "Patagônia",
    "Campinhos",
    "Distrito Industrial",
    "São Pedro",
    "Ibirapuera",
    "Lagoa das Flores",
    "Primavera",
    "Recreio",
    "Jurema",
    "Bateias",
  ];
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
    endereco: user?.endereco || "",
    role: user?.role || "fiscal",
    matricula: user?.matricula || "",
    bairros: user?.bairros || [],
    ativo: user?.ativo !== undefined ? user.ativo : true,
    senha: "",
    senhaConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleBairro = (b) => {
    setForm((p) => ({
      ...p,
      bairros: p.bairros.includes(b)
        ? p.bairros.filter((x) => x !== b)
        : [...p.bairros, b],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Obrigatório";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido";
    if (!isEdit && !form.senha) e.senha = "Obrigatório";
    if (form.senha && form.senha !== form.senhaConfirm)
      e.senhaConfirm = "Senhas não coincidem";
    if (form.senha && form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (!form.matricula.trim()) e.matricula = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: user?.id });
  };

  const roleLabel = {
    admin: "Gerência",
    supervisor: "Administração",
    fiscal: "Fiscal",
    atendente: "Balcão",
  };
  const roleColors = {
    admin: T.danger,
    supervisor: T.gold,
    fiscal: T.accent,
    atendente: T.success,
  };
  const Err = ({ k }) =>
    errors[k] ? (
      <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
        {errors[k]}
      </div>
    ) : null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-sheet"
        style={{ maxHeight: "94vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
              background: isEdit ? `${T.gold}20` : `${T.accent}20`,
              border: `1.5px solid ${isEdit ? T.gold : T.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            {isEdit ? "Editar" : "Novo"}
          </div>
          <div>
            <div
              style={{
                fontFamily: T.font,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              {isEdit ? "Editar Usuário" : "Novo Usuário"}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              {isEdit
                ? `Editando: ${user.name}`
                : "Preencha os dados do novo servidor"}
            </div>
          </div>
        </div>

        {/* Perfil de acesso */}
        <div className="form-section">
          <div className="form-section-title">Perfil de Acesso</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {Object.entries(roleLabel).map(([k, v]) => (
              <button
                key={k}
                onClick={() => f("role", k)}
                style={{
                  background:
                    form.role === k ? `${roleColors[k]}18` : T.surface,
                  border: `1.5px solid ${
                    form.role === k ? roleColors[k] : T.border
                  }`,
                  borderRadius: 10,
                  padding: "10px 8px",
                  cursor: "pointer",
                  color: form.role === k ? roleColors[k] : T.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Dados + Acesso unificados */}
        <div className="form-section">
          <div className="form-section-title">Dados do Usuário</div>
          <div className="form-group">
            <label className="input-label">Nome completo *</label>
            <input
              className="input-field"
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => f("name", e.target.value)}
              style={errors.name ? { borderColor: T.danger } : {}}
            />
            <Err k="name" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Matrícula *</label>
              <input
                className="input-field"
                placeholder="00000-0"
                value={form.matricula}
                onChange={(e) => f("matricula", maskMatricula(e.target.value))}
                style={errors.matricula ? { borderColor: T.danger } : {}}
              />
              <Err k="matricula" />
            </div>
            <div className="form-group">
              <label className="input-label">Telefone</label>
              <input
                className="input-field"
                placeholder="(77) 9 0000-0000"
                value={form.telefone}
                onChange={(e) => f("telefone", maskTelefone(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">E-mail</label>
            <input
              className="input-field"
              placeholder="exemplo@email.com"
              type="email"
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
              style={errors.email ? { borderColor: T.danger } : {}}
            />
            <Err k="email" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">
                {isEdit ? "Nova senha" : "Senha *"}
              </label>
              <input
                className="input-field"
                placeholder={
                  isEdit ? "Deixe vazio p/ manter" : "Mín. 6 caracteres"
                }
                type="password"
                value={form.senha}
                onChange={(e) => f("senha", e.target.value)}
                style={errors.senha ? { borderColor: T.danger } : {}}
              />
              <Err k="senha" />
            </div>
            <div className="form-group">
              <label className="input-label">Confirmar senha</label>
              <input
                className="input-field"
                placeholder="Repita a senha"
                type="password"
                value={form.senhaConfirm}
                onChange={(e) => f("senhaConfirm", e.target.value)}
                style={errors.senhaConfirm ? { borderColor: T.danger } : {}}
              />
              <Err k="senhaConfirm" />
            </div>
          </div>
        </div>

        {/* Bairros — apenas para fiscal */}
        {form.role === "fiscal" && (
          <div className="form-section">
            <div className="form-section-title">Bairros Atribuídos</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
              Selecione os bairros que este fiscal irá cobrir (
              {form.bairros.length} selecionado
              {form.bairros.length !== 1 ? "s" : ""})
            </div>
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {[
                "Alto Maron",
                "Ayrton Senna",
                "Bateias",
                "Boa Vista",
                "Brasil",
                "Campinhos",
                "Candeias",
                "Centro",
                "Cruzeiro",
                "Distrito Industrial",
                "Espírito Santo",
                "Felícia",
                "Guarani",
                "Ibirapuera",
                "Jatobá",
                "Jurema",
                "Lagoa das Flores",
                "Nossa Senhora Aparecida",
                "Patagônia",
                "Primavera",
                "Recreio",
                "São Pedro",
                "Universidade",
                "Zabelê",
              ].map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBairro(b)}
                  style={{
                    background: form.bairros.includes(b)
                      ? `${T.accent}20`
                      : T.surface,
                    border: `1px solid ${
                      form.bairros.includes(b) ? T.accent : T.border
                    }`,
                    color: form.bairros.includes(b) ? T.accent : T.muted,
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {form.bairros.includes(b) && "? "}
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="form-section">
          <div className="form-section-title">Status da Conta</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {form.ativo ? "Conta ativa" : "Conta bloqueada"}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>
                {form.ativo
                  ? "Usuário pode acessar o sistema"
                  : "Usuário não consegue fazer login"}
              </div>
            </div>
            <button
              onClick={() => f("ativo", !form.ativo)}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: form.ativo ? T.success : T.border,
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.ativo ? 26 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Botões */}
        <div className="submit-row">
          <button className="btn-outline" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-submit notif-btn" onClick={handleSave}>
            <Icon name="save" size={16} />{" "}
            {isEdit ? "Salvar Alterações" : "Criar Usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modal Meu Perfil ---------------------------------------------------------

function PerfilModal({ user, onSave, onClose }) {
  const isAdmin = user?.isMaster;
  const roleLabel = {
    admin: "Gerência",
    supervisor: "Administração",
    fiscal: "Fiscal",
    atendente: "Balcão",
  };
  const roleColors = {
    admin: T.danger,
    supervisor: T.gold,
    fiscal: T.accent,
    atendente: T.success,
  };
  const cor = roleColors[user?.role] || T.accent;

  const [form, setForm] = useState({
    email: user?.email || "",
    telefone: user?.telefone || "",
    endereco: user?.endereco || "",
    senhaAtual: "",
    novaSenha: "",
    novaSenhaConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.novaSenha) {
      if (!isAdmin && !form.senhaAtual) e.senhaAtual = "Informe a senha atual";
      if (
        !isAdmin &&
        form.senhaAtual &&
        form.senhaAtual !== (user?.senha || "")
      )
        e.senhaAtual = "Senha atual incorreta";
      if (form.novaSenha.length < 6) e.novaSenha = "Mínimo 6 caracteres";
      if (form.novaSenha !== form.novaSenhaConfirm)
        e.novaSenhaConfirm = "As senhas não coincidem";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const updated = {
      ...user,
      email: form.email,
      telefone: form.telefone,
      endereco: form.endereco,
    };
    if (form.novaSenha) updated.senha = form.novaSenha;
    onSave(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const Err = ({ k }) =>
    errors[k] ? (
      <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
        {errors[k]}
      </div>
    ) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ maxHeight: "94vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Avatar + nome */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              margin: "0 auto 12px",
              background: `${cor}22`,
              border: `2px solid ${cor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: T.font,
              fontSize: 28,
              fontWeight: 800,
              color: cor,
            }}
          >
            {user?.name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            {user?.name}
          </div>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                background: `${cor}18`,
                color: cor,
                borderRadius: 6,
                padding: "2px 10px",
                fontWeight: 700,
              }}
            >
              {roleLabel[user?.role] || user?.role}
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>
              Mat. {user?.matricula}
            </span>
          </div>
        </div>

        {/* Aviso campos bloqueados */}
        <div
          style={{
            background: `${T.gold}12`,
            border: `1px solid ${T.gold}30`,
            borderRadius: 10,
            padding: "8px 12px",
            marginBottom: 16,
            fontSize: 12,
            color: T.gold,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          Nome e matrícula só podem ser alterados pela Gerência.
        </div>

        {/* Dados bloqueados */}
        <div className="form-section">
          <div className="form-section-title">Identificação</div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Nome completo</label>
              <input
                className="input-field"
                value={user?.name || ""}
                disabled
                style={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                  background: T.surface,
                }}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Matrícula</label>
              <input
                className="input-field"
                value={user?.matricula || ""}
                disabled
                style={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                  background: T.surface,
                }}
              />
            </div>
          </div>
        </div>

        {/* Dados editáveis */}
        <div className="form-section">
          <div className="form-section-title">Dados de Contato</div>
          <div className="form-group">
            <label className="input-label">E-mail institucional</label>
            <input
              className="input-field"
              type="email"
              placeholder="seu.email@pmvc.ba.gov.br"
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Telefone</label>
              <input
                className="input-field"
                placeholder="(77) 9 0000-0000"
                value={form.telefone}
                onChange={(e) => f("telefone", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Endereço residencial</label>
            <input
              className="input-field"
              placeholder="Rua, número, bairro"
              value={form.endereco}
              onChange={(e) => f("endereco", e.target.value)}
            />
          </div>
        </div>

        {/* Alteração de senha */}
        <div className="form-section">
          <div className="form-section-title">Alterar Senha</div>
          {!isAdmin && (
            <div className="form-group">
              <label className="input-label">Senha atual</label>
              <input
                className="input-field"
                type="password"
                placeholder="Digite sua senha atual"
                value={form.senhaAtual}
                onChange={(e) => f("senhaAtual", e.target.value)}
                style={errors.senhaAtual ? { borderColor: T.danger } : {}}
              />
              <Err k="senhaAtual" />
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Nova senha</label>
              <input
                className="input-field"
                type="password"
                placeholder="Mín. 6 caracteres"
                value={form.novaSenha}
                onChange={(e) => f("novaSenha", e.target.value)}
                style={errors.novaSenha ? { borderColor: T.danger } : {}}
              />
              <Err k="novaSenha" />
            </div>
            <div className="form-group">
              <label className="input-label">Confirmar</label>
              <input
                className="input-field"
                type="password"
                placeholder="Repita"
                value={form.novaSenhaConfirm}
                onChange={(e) => f("novaSenhaConfirm", e.target.value)}
                style={errors.novaSenhaConfirm ? { borderColor: T.danger } : {}}
              />
              <Err k="novaSenhaConfirm" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            Deixe em branco para manter a senha atual.
          </div>
        </div>

        {saved && (
          <div
            style={{
              background: `${T.success}18`,
              border: `1px solid ${T.success}50`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 8,
              fontSize: 13,
              color: T.success,
              textAlign: "center",
            }}
          >
            ✔ Perfil atualizado com sucesso!
          </div>
        )}

        <div className="submit-row">
          <button className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-submit notif-btn" onClick={handleSave}>
            <Icon name="save" size={16} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Admin Screen -------------------------------------------------------------
// --- AdministracaoScreen ------------------------------------------------------

// --- RelatorioAvancado -------------------------------------------------------

function RelatorioAvancado({ records = [], fiscais = [], reclamacoes = [] }) {
  const mesesNomes = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const anoAtual = new Date().getFullYear();

  const [filtFiscal, setFiltFiscal] = useState("");
  const [filtTipo, setFiltTipo] = useState("all");
  const [filtStatus, setFiltStatus] = useState("all");
  const [filtMesIni, setFiltMesIni] = useState("");
  const [filtMesFim, setFiltMesFim] = useState("");
  const [filtAno, setFiltAno] = useState(String(anoAtual));

  const parseDate = (str) => {
    if (!str) return null;
    const [d, m, a] = str.split("/").map(Number);
    if (!d || !m || !a) return null;
    return new Date(a, m - 1, d);
  };

  const applyFilters = (recs) =>
    recs.filter((r) => {
      if (filtTipo !== "all" && r.type !== filtTipo) return false;
      if (filtStatus !== "all" && r.status !== filtStatus) return false;
      if (filtFiscal && r.fiscal !== filtFiscal) return false;
      const d = parseDate(r.date);
      if (!d) return true;
      const ano = d.getFullYear();
      const mes = d.getMonth();
      if (filtAno && ano !== Number(filtAno)) return false;
      if (filtMesIni !== "" && mes < Number(filtMesIni)) return false;
      if (filtMesFim !== "" && mes > Number(filtMesFim)) return false;
      return true;
    });

  const filtered = applyFilters(records);

  const totalMulvas = filtered
    .filter((r) => r.type === "auto" && r.multa)
    .reduce((s, r) => {
      const v = parseFloat(
        (r.multa || "0").replace(/\./g, "").replace(",", ".")
      );
      return s + (isNaN(v) ? 0 : v);
    }, 0);

  const porFiscal = fiscais
    .map((f) => {
      const fRecs = filtered.filter((r) => r.fiscal === f.name);
      const fNotif = fRecs.filter((r) => r.type === "notif").length;
      const fAuto = fRecs.filter((r) => r.type === "auto").length;
      const fMulta = fRecs
        .filter((r) => r.type === "auto" && r.multa)
        .reduce((s, r) => {
          const v = parseFloat(
            (r.multa || "0").replace(/\./g, "").replace(",", ".")
          );
          return s + (isNaN(v) ? 0 : v);
        }, 0);
      return {
        ...f,
        notif: fNotif,
        auto: fAuto,
        total: fNotif + fAuto,
        multa: fMulta,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Gráfico de barras mensal (contagem por mês)
  const porMes = Array.from({ length: 12 }, (_, m) => {
    const recsMes = records.filter((r) => {
      const d = parseDate(r.date);
      if (!d) return false;
      if (filtAno && d.getFullYear() !== Number(filtAno)) return false;
      if (filtFiscal && r.fiscal !== filtFiscal) return false;
      return d.getMonth() === m;
    });
    return {
      mes: mesesNomes[m],
      notif: recsMes.filter((r) => r.type === "notif").length,
      auto: recsMes.filter((r) => r.type === "auto").length,
    };
  });
  const maxBar = Math.max(...porMes.map((m) => m.notif + m.auto), 1);

  const handleImprimir = () => {
    const nomeFiscal = filtFiscal || "Todos os Fiscais";
    const periodo =
      filtMesIni !== "" && filtMesFim !== ""
        ? `${mesesNomes[Number(filtMesIni)]} a ${
            mesesNomes[Number(filtMesFim)]
          } ${filtAno}`
        : filtMesIni !== ""
        ? `${mesesNomes[Number(filtMesIni)]} ${filtAno}`
        : `Ano ${filtAno}`;
    const rows = filtered
      .map(
        (r) =>
          `<tr><td>${r.date || ""}</td><td>${
            r.type === "auto" ? "Auto" : "Notif"
          }</td><td>${r.num || ""}</td><td>${r.owner || ""}</td><td>${
            r.bairro || ""
          }</td><td>${r.fiscal || ""}</td><td>${r.status || ""}</td><td>${
            r.type === "auto" ? `R$ ${r.multa || "0"}` : "—"
          }</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório FISCON</title><style>
      body{font-family:Arial,sans-serif;font-size:10px;color:#111;margin:20mm}
      h1{font-size:16px;margin:0 0 4px}h2{font-size:11px;color:#555;font-weight:400;margin:0 0 12px}
      table{width:100%;border-collapse:collapse}th{background:#0d3b7a;color:#fff;padding:5px;text-align:left;font-size:9px}
      td{padding:4px 5px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f8fafc}
      .tot{margin-top:12px;display:flex;gap:20px}.tot-item{background:#f0f4ff;border-radius:6px;padding:8px 14px;font-size:11px}
      .tot-item strong{font-size:16px;display:block;color:#0d3b7a}
      @media print{@page{margin:15mm}}
    </style></head><body>
      <h1>Relatório de Fiscalização — FISCON</h1>
      <h2>Fiscal: ${nomeFiscal} | Período: ${periodo} | Tipo: ${
      filtTipo === "all"
        ? "Todos"
        : filtTipo === "auto"
        ? "Autos"
        : "Notificações"
    }</h2>
      <div class="tot">
        <div class="tot-item"><strong>${
          filtered.length
        }</strong>Documentos</div>
        <div class="tot-item"><strong>${
          filtered.filter((r) => r.type === "notif").length
        }</strong>Notificações</div>
        <div class="tot-item"><strong>${
          filtered.filter((r) => r.type === "auto").length
        }</strong>Autos</div>
        <div class="tot-item"><strong>R$ ${totalMulvas.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}</strong>Total Multas</div>
      </div>
      <br>
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Número</th><th>Proprietário</th><th>Bairro</th><th>Fiscal</th><th>Status</th><th>Multa</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div style={{ padding: "0 0 16px" }}>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
        Filtre por fiscal, período, tipo e status para gerar relatórios
        personalizados.
      </div>

      {/* Filtros */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: T.accent,
            marginBottom: 12,
          }}
        >
          Filtros do Relatório
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div>
            <label className="input-label">Fiscal</label>
            <select
              className="input-field"
              value={filtFiscal}
              onChange={(e) => setFiltFiscal(e.target.value)}
            >
              <option value="">Todos os fiscais</option>
              {fiscais.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Tipo</label>
            <select
              className="input-field"
              value={filtTipo}
              onChange={(e) => setFiltTipo(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="notif">Notificações</option>
              <option value="auto">Autos de Infração</option>
            </select>
          </div>
          <div>
            <label className="input-label">Status</label>
            <select
              className="input-field"
              value={filtStatus}
              onChange={(e) => setFiltStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              {[
                "Pendente",
                "Regularizado",
                "Embargado",
                "Em recurso",
                "Autuado",
                "Multa Encaminhada",
                "Cancelado",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Ano</label>
            <select
              className="input-field"
              value={filtAno}
              onChange={(e) => setFiltAno(e.target.value)}
            >
              {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Mês inicial</label>
            <select
              className="input-field"
              value={filtMesIni}
              onChange={(e) => setFiltMesIni(e.target.value)}
            >
              <option value="">Todos</option>
              {mesesNomes.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Mês final</label>
            <select
              className="input-field"
              value={filtMesFim}
              onChange={(e) => setFiltMesFim(e.target.value)}
            >
              <option value="">Todos</option>
              {mesesNomes.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleImprimir}
          style={{
            marginTop: 14,
            width: "100%",
            background: T.accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: T.font,
            letterSpacing: 1,
          }}
        >
          🖨️ Gerar / Imprimir Relatório
        </button>
      </div>

      {/* Cards resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { l: "Documentos", v: filtered.length, c: T.accent },
          {
            l: "Notificações",
            v: filtered.filter((r) => r.type === "notif").length,
            c: T.gold,
          },
          {
            l: "Autos",
            v: filtered.filter((r) => r.type === "auto").length,
            c: T.danger,
          },
          {
            l: "Total Multas",
            v: `R$ ${totalMulvas.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
            c: "#9B59B6",
          },
          {
            l: "Regularizados",
            v: filtered.filter((r) => r.status === "Regularizado").length,
            c: T.success,
          },
          {
            l: "Embargados",
            v: filtered.filter((r) => r.status === "Embargado").length,
            c: "#e67e22",
          },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>
              {s.v}
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras mensal */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: T.accent,
            marginBottom: 12,
          }}
        >
          Emissões por Mês — {filtAno}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            height: 100,
          }}
        >
          {porMes.map((m, i) => {
            const tot = m.notif + m.auto;
            const h =
              tot > 0 ? Math.max(4, Math.round((tot / maxBar) * 90)) : 0;
            const hN = m.notif > 0 ? Math.round((m.notif / tot) * h) : 0;
            const hA = h - hN;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: 90,
                  }}
                >
                  {m.auto > 0 && (
                    <div
                      style={{
                        width: "80%",
                        height: hA,
                        background: T.danger,
                        borderRadius: "3px 3px 0 0",
                        minHeight: 2,
                      }}
                      title={`${m.auto} autos`}
                    ></div>
                  )}
                  {m.notif > 0 && (
                    <div
                      style={{
                        width: "80%",
                        height: hN,
                        background: T.gold,
                        borderRadius: m.auto > 0 ? "0" : "3px 3px 0 0",
                        minHeight: 2,
                      }}
                      title={`${m.notif} notif`}
                    ></div>
                  )}
                  {tot === 0 && (
                    <div
                      style={{
                        width: "80%",
                        height: 3,
                        background: T.border,
                        borderRadius: 3,
                      }}
                    ></div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: T.muted,
                    marginTop: 3,
                    textAlign: "center",
                  }}
                >
                  {m.mes}
                </div>
                {tot > 0 && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.text }}>
                    {tot}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 10,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 11, color: T.muted }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                background: T.gold,
                borderRadius: 2,
                marginRight: 4,
              }}
            ></span>
            Notificações
          </span>
          <span style={{ fontSize: 11, color: T.muted }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                background: T.danger,
                borderRadius: 2,
                marginRight: 4,
              }}
            ></span>
            Autos
          </span>
        </div>
      </div>

      {/* Ranking de fiscais */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: T.accent,
          marginBottom: 10,
        }}
      >
        Ranking por Fiscal
      </div>
      {porFiscal.filter((f) => f.total > 0).length === 0 ? (
        <div
          style={{
            color: T.muted,
            fontSize: 13,
            textAlign: "center",
            padding: 24,
          }}
        >
          Nenhum dado no período.
        </div>
      ) : (
        porFiscal.map((f, idx) => (
          <div
            key={f.id}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 20,
                fontWeight: 800,
                color:
                  idx === 0
                    ? "#f59e0b"
                    : idx === 1
                    ? "#94a3b8"
                    : idx === 2
                    ? "#b45309"
                    : T.muted,
                width: 28,
                textAlign: "center",
              }}
            >
              {idx === 0
                ? "🥇"
                : idx === 1
                ? "🥈"
                : idx === 2
                ? "🥉"
                : `${idx + 1}°`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>
                {f.notif} notif · {f.auto} autos
                {f.multa > 0 &&
                  ` · R$ ${f.multa.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`}
              </div>
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: f.total > 0 ? T.accent : T.muted,
              }}
            >
              {f.total}
            </div>
          </div>
        ))
      )}
    </div>
  );
}


function AdministracaoScreen({
  usuarios = [],
  records = [],
  setRecords,
  reclamacoes = [],
  setReclamacoesGlobal,
  addLog,
  currentUser,
  cancelPending = [],
  setCancelPending,
  onAcaoReclamacao,
}) {
  const [subTab, setSubTab] = useState("fiscais"); // fiscais | reclamacoes | agenda | contribuinte | relatorio
  const [fiscalSel, setFiscalSel] = useState(null);
  const [busca, setBusca] = useState("");
  const [cpfBusca, setCpfBusca] = useState("");
  const [showCancelar, setShowCancelar] = useState(null); // record a cancelar
  const [motivoCancel, setMotivoCancel] = useState("");
  const [toast, setToast] = useState(null);
  const [viewRecord, setViewRecord] = useState(null); // record aberto para visualizar/imprimir
  const [viewReclamacao, setViewReclamacao] = useState(null); // reclamação aberta
  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const fiscais = usuarios.filter((u) => u.role === "fiscal" && u.ativo);
  const roleLabel = {
    admin: "Gerência",
    supervisor: "Administração",
    fiscal: "Fiscal",
    atendente: "Balcão",
  };

  // -- Agenda: status dos fiscais ---------------------------------------------
  const STATUS_AGENDA = [
    "Disponível",
    "Em campo",
    "Férias",
    "Afastado",
    "Folga",
  ];
  const STATUS_COR = {
    Disponível: T.success,
    "Em campo": T.accent,
    Férias: T.gold,
    Afastado: T.danger,
    Folga: T.muted,
  };
  const [agenda, setAgenda] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fo_agenda") || "{}");
    } catch {
      return {};
    }
  });
  const setAgendaFiscal = (id, status) => {
    const next = { ...agenda, [id]: status };
    setAgenda(next);
    try {
      localStorage.setItem("fo_agenda", JSON.stringify(next));
    } catch {}
  };

  // -- Cancelar registro (2 etapas: Administração solicita ? fiscal confirma) -
  const handleCancelar = () => {
    if (!motivoCancel.trim()) return;
    const rec = showCancelar;
    // Cria solicitação pendente para o fiscal confirmar
    const solicitacao = {
      id: Date.now(),
      recordId: rec.id,
      recordNum: rec.num,
      recordOwner: rec.owner,
      recordFiscal: rec.fiscal,
      motivo: motivoCancel,
      solicitadoPor: currentUser?.name || "Administração",
      data: new Date().toLocaleDateString("pt-BR"),
    };
    if (setCancelPending) setCancelPending((prev) => [...prev, solicitacao]);
    if (addLog)
      addLog(
        "Cancelamento solicitado",
        `${rec.num} — ${rec.owner} — aguardando confirmação do fiscal ${rec.fiscal}`,
        currentUser?.name || "Administração"
      );
    setShowCancelar(null);
    setMotivoCancel("");
    showToast(
      "✔ Solicitação enviada! O fiscal será notificado ao fazer login."
    );
  };

  // -- Redesignar reclamação --------------------------------------------------
  const handleRedesignar = (reclId, novoFiscal) => {
    if (setReclamacoesGlobal) {
      setReclamacoesGlobal((prev) =>
        prev.map((r) =>
          r.id === reclId
            ? {
                ...r,
                fiscal: novoFiscal,
                status: "designada",
                dataDesig: new Date().toLocaleDateString("pt-BR"),
              }
            : r
        )
      );
    }
    showToast(`✔ Reclamação redesignada para ${novoFiscal}.`);
  };

  const tabs = [
    { id: "fiscais", label: "Fiscais" },
    { id: "agenda", label: "Agenda" },
    { id: "reclamacoes", label: "Reclamações" },
    { id: "contribuinte", label: "Contribuinte" },
    { id: "relatorio", label: "Relatório" },
  ];

  return (
    <div style={{ padding: "0 16px 80px" }}>
      {toast && (
        <div className="toast">
          <Icon name="check" size={16} /> {toast}
        </div>
      )}

      {/* Modal cancelar */}
      {showCancelar && (
        <div className="modal-overlay" onClick={() => setShowCancelar(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div
              style={{
                fontFamily: T.font,
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 6,
                color: T.danger,
              }}
            >
              Cancelar / Anular Registro
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
              {showCancelar.num} — {showCancelar.owner}
            </div>
            <div
              style={{
                background: `${T.danger}10`,
                border: `1px solid ${T.danger}30`,
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                fontSize: 12,
                color: T.danger,
              }}
            >
              ⚠️ Esta ação é irreversível. O registro ficará marcado como{" "}
              <strong>Cancelado</strong> e não poderá ser editado.
            </div>
            <div className="form-group">
              <label className="input-label">Motivo / Justificativa *</label>
              <textarea
                className="input-field"
                style={{ minHeight: 90, resize: "none" }}
                placeholder="Descreva o motivo do cancelamento ou anulação..."
                value={motivoCancel}
                onChange={(e) => setMotivoCancel(e.target.value)}
              />
            </div>
            <div className="submit-row" style={{ marginTop: 8 }}>
              <button
                className="btn-outline"
                onClick={() => {
                  setShowCancelar(null);
                  setMotivoCancel("");
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                style={{
                  flex: 1,
                  background: T.danger,
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: motivoCancel.trim() ? 1 : 0.5,
                }}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 16,
        }}
      >
        Administração
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSubTab(t.id);
              setFiscalSel(null);
            }}
            style={{
              background: subTab === t.id ? `${T.accent}18` : T.surface,
              border: `1.5px solid ${subTab === t.id ? T.accent : T.border}`,
              borderRadius: 20,
              padding: "7px 14px",
              cursor: "pointer",
              color: subTab === t.id ? T.accent : T.muted,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* -- ABA: FISCAIS ------------------------------------------------ */}
      {subTab === "fiscais" && !fiscalSel && (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            Clique em um fiscal para ver toda sua atividade.
          </div>
          {fiscais.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13 }}>
              Nenhum fiscal cadastrado.
            </div>
          )}
          {fiscais.map((f) => {
            const minhasNotifs = records.filter(
              (r) => r.fiscal === f.name && r.type === "notif"
            );
            const meusAutos = records.filter(
              (r) => r.fiscal === f.name && r.type === "auto"
            );
            const statusAg = agenda[f.id] || "Disponível";
            const cor = STATUS_COR[statusAg] || T.muted;
            return (
              <div
                key={f.id}
                onClick={() => setFiscalSel(f)}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${T.accent}18`,
                    border: `1.5px solid ${T.accent}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                ></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    Mat. {f.matricula} ·{" "}
                    {(f.bairros || []).slice(0, 2).join(", ")}
                    {(f.bairros || []).length > 2
                      ? ` +${f.bairros.length - 2}`
                      : ""}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 3 }}>
                    <span style={{ color: T.gold }}>
                      {minhasNotifs.length} notif.
                    </span>
                    <span style={{ color: T.danger, marginLeft: 8 }}>
                      {meusAutos.length} autos
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    background: `${cor}18`,
                    color: cor,
                    border: `1px solid ${cor}40`,
                    borderRadius: 8,
                    padding: "3px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {statusAg}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* -- DETALHE FISCAL ---------------------------------------------- */}
      {/* -- Modal: visualizar/reimprimir documento -- */}
      {viewRecord &&
        (() => {
          const r = viewRecord;
          const isAuto = r.type === "auto";
          const printData = {
            num: r.num,
            proprietario: r.owner,
            cpf: r.cpf || "",
            endereco: r.addr || "",
            bairro: r.bairro || "",
            loteamento: r.loteamento || "",
            descricao: r.descricao || "",
            fiscal: r.fiscal || "",
            matricula: r.matricula || "",
            prazo: r.prazo || "1",
            multa: r.multa || null,
            infracoes: (r.infracoes || []).map((inf) =>
              typeof inf === "object"
                ? `${inf.id} — ${inf.desc} (R$ ${inf.valor?.toFixed(2) || ""})`
                : inf
            ),
          };
          return (
            <div className="modal-overlay" onClick={() => setViewRecord(null)}>
              <div
                className="modal-sheet"
                style={{ maxHeight: "94vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-handle" />
                <p
                  style={{
                    fontFamily: T.font,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 16,
                    color: isAuto ? T.danger : T.gold,
                  }}
                >
                  {isAuto ? "Auto de Infração" : "Notificação Preliminar"}
                </p>
                <div className="doc-preview" id="admin-doc-preview">
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 10,
                      color: "#c00",
                      fontWeight: 700,
                      marginBottom: 6,
                      border: "1px dashed #c00",
                      padding: "3px 0",
                      borderRadius: 4,
                    }}
                  >
                    2ª VIA / REIMPRESSÃO
                  </div>
                  <div className="doc-header">
                    <h2>Prefeitura Municipal de Vitória da Conquista</h2>
                    <p>Secretaria Municipal de Infraestrutura Urbana</p>
                    <p>Gerência de Fiscalização de Obras</p>
                  </div>
                  <div className="doc-num">
                    {isAuto ? "AUTO DE INFRAÇÃO" : "NOTIFICAÇÃO PRELIMINAR"} Nº{" "}
                    {r.num}
                  </div>
                  <div className="doc-section-title">
                    Dados da Obra / Infrator
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Proprietário:</span>
                    <span>{printData.proprietario || "—"}</span>
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">CPF/CNPJ:</span>
                    <span>{printData.cpf || "—"}</span>
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Endereço:</span>
                    <span>{printData.endereco || "—"}</span>
                  </div>
                  <div className="doc-field">
                    <span className="doc-field-label">Bairro:</span>
                    <span>{printData.bairro || "—"}</span>
                  </div>
                  {printData.loteamento && (
                    <div className="doc-field">
                      <span className="doc-field-label">Loteamento:</span>
                      <span>{printData.loteamento}</span>
                    </div>
                  )}
                  <div className="doc-field">
                    <span className="doc-field-label">Data:</span>
                    <span>{r.date}</span>
                  </div>
                  <div className="doc-section-title">
                    {isAuto
                      ? "Infrações Cometidas"
                      : "Irregularidade Identificada"}
                  </div>
                  <div className="doc-infracoes">
                    {printData.infracoes.length > 0 ? (
                      printData.infracoes.map((inf, i) => (
                        <div key={i}>• {inf}</div>
                      ))
                    ) : (
                      <div style={{ color: "#aaa" }}>—</div>
                    )}
                  </div>
                  {printData.descricao && (
                    <div style={{ marginTop: 8, fontSize: 11 }}>
                      <strong>Obs:</strong> {printData.descricao}
                    </div>
                  )}
                  {isAuto && printData.multa && (
                    <>
                      <div className="doc-section-title">Penalidade</div>
                      <div className="doc-field">
                        <span className="doc-field-label">Valor da multa:</span>
                        <span style={{ color: "#c0392b", fontWeight: 700 }}>
                          R$ {printData.multa}
                        </span>
                      </div>
                      <div className="doc-field">
                        <span className="doc-field-label">Prazo:</span>
                        <span>10 (dez) dias corridos</span>
                      </div>
                    </>
                  )}
                  {!isAuto && (
                    <>
                      <div className="doc-section-title">
                        Prazo para Regularização
                      </div>
                      <div className="doc-field">
                        <span className="doc-field-label">Prazo:</span>
                        <span>{printData.prazo} dia(s) corrido(s)</span>
                      </div>
                    </>
                  )}
                  <div className="doc-section-title">
                    {isAuto ? "Assinaturas" : "Identificação do Agente"}
                  </div>
                  <div
                    className="doc-sig-area"
                    style={!isAuto ? { justifyContent: "center" } : {}}
                  >
                    <div className="doc-sig-box">
                      {isAuto ? (
                        <>
                          <strong>Agente de Fiscalização</strong>
                          <br />
                        </>
                      ) : (
                        <>
                          Agente de Fiscalização
                          <br />
                        </>
                      )}
                      <strong>{printData.fiscal}</strong>
                      <br />
                      Mat. {printData.matricula}
                      {isAuto && (
                        <>
                          <br />
                          <br />
                          Ass. _____________
                        </>
                      )}
                    </div>
                  </div>
                  {isAuto && (
                    <div className="doc-sig-area" style={{ marginTop: 10 }}>
                      <div className="doc-sig-box">
                        <strong>Testemunha 1</strong>
                        <br />
                        Nome: ___________________
                        <br />
                        <br />
                        Ass. _____________
                      </div>
                      <div className="doc-sig-box">
                        <strong>Testemunha 2</strong>
                        <br />
                        Nome: ___________________
                        <br />
                        <br />
                        Ass. _____________
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 12,
                      textAlign: "center",
                      fontSize: 10,
                      color: "#777",
                    }}
                  >
                    Vitória da Conquista,{" "}
                    {new Date().toLocaleDateString("pt-BR")} — FISCON
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-print"
                    onClick={() => gerarPDF("admin-doc-preview", r.num)}
                  >
                    <Icon name="printer" size={18} /> 2ª Via / Imprimir
                  </button>
                  <button
                    onClick={() =>
                      imprimirTermica(r.type, {
                        num: r.num,
                        proprietario: r.owner,
                        cpf: r.cpf,
                        endereco: r.addr,
                        bairro: r.bairro,
                        loteamento: r.loteamento,
                        infracoes: r.infracoes,
                        descricao: r.descricao,
                        multa: r.multa,
                        prazo: r.prazo,
                        fiscal: r.fiscal,
                        matricula: r.matricula,
                      })
                    }
                    style={{
                      flex: 1,
                      background: "#1a1a1a",
                      border: "1.5px dashed #555",
                      borderRadius: 10,
                      color: "#ccc",
                      padding: "10px 0",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Térmica 58mm
                  </button>
                  <button
                    className="btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setViewRecord(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {subTab === "fiscais" &&
        fiscalSel &&
        (() => {
          const fRecords = records.filter((r) => r.fiscal === fiscalSel.name);
          const notifs = fRecords.filter((r) => r.type === "notif");
          const autos = fRecords.filter((r) => r.type === "auto");
          const ativos = fRecords.filter(
            (r) => !["Cancelado", "Regularizado"].includes(r.status)
          );
          const statusCfg = {
            Pendente: { color: T.gold },
            Regularizado: { color: T.success },
            Embargado: { color: T.danger },
            "Em recurso": { color: T.accent },
            Autuado: { color: "#9333ea" },
            "Multa Encaminhada": { color: "#7c3aed" },
            Cancelado: { color: T.muted },
          };
          return (
            <div>
              <button
                onClick={() => setFiscalSel(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.accent,
                  cursor: "pointer",
                  fontSize: 13,
                  marginBottom: 12,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ← Voltar para lista
              </button>
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                  {fiscalSel.name}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  Mat. {fiscalSel.matricula} · {fiscalSel.email || "sem e-mail"}
                </div>
                {(fiscalSel.bairros || []).length > 0 && (
                  <div style={{ fontSize: 11, color: T.accent, marginTop: 6 }}>
                    {fiscalSel.bairros.join(", ")}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: "Notificações", val: notifs.length, color: T.gold },
                  { label: "Autos", val: autos.length, color: T.danger },
                  { label: "Pendentes", val: ativos.length, color: T.accent },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: "12px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: 22, fontWeight: 800, color: s.color }}
                    >
                      {s.val}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: T.text,
                }}
              >
                Registros — clique para abrir e imprimir 2ª via
              </div>
              {fRecords.length === 0 && (
                <div style={{ color: T.muted, fontSize: 13 }}>
                  Nenhum registro.
                </div>
              )}
              {fRecords
                .slice()
                .reverse()
                .map((r) => {
                  const cancelado = r.status === "Cancelado";
                  const stCfg = statusCfg[r.status] || statusCfg["Pendente"];
                  return (
                    <div
                      key={r.id}
                      onClick={() => !cancelado && setViewRecord(r)}
                      style={{
                        background: T.card,
                        border: `1.5px solid ${
                          cancelado ? T.danger + "50" : T.border
                        }`,
                        borderLeft: `4px solid ${
                          cancelado
                            ? T.muted
                            : r.type === "auto"
                            ? T.danger
                            : T.gold
                        }`,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                        opacity: cancelado ? 0.6 : 1,
                        cursor: cancelado ? "default" : "pointer",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!cancelado)
                          e.currentTarget.style.boxShadow =
                            "0 4px 16px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: r.type === "auto" ? T.danger : T.gold,
                          }}
                        >
                          {r.num}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            background: `${stCfg.color}15`,
                            color: stCfg.color,
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontWeight: 700,
                          }}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: T.muted }}>
                        {r.owner || "—"} · {r.bairro || "—"} · {r.date}
                      </div>
                      {cancelado && r.motivoCancel && (
                        <div
                          style={{
                            fontSize: 11,
                            color: T.danger,
                            marginTop: 3,
                          }}
                        >
                          Motivo: {r.motivoCancel}
                        </div>
                      )}
                      {!cancelado && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewRecord(r);
                            }}
                            style={{
                              background: `${T.accent}10`,
                              border: `1px solid ${T.accent}40`,
                              borderRadius: 7,
                              color: T.accent,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Ver / Imprimir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCancelar(r);
                            }}
                            style={{
                              background: "none",
                              border: `1px solid ${T.danger}40`,
                              borderRadius: 7,
                              color: T.danger,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })()}

      {/* -- ABA: AGENDA ------------------------------------------------- */}
      {subTab === "agenda" && (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
            Defina a disponibilidade de cada fiscal.
          </div>
          {fiscais.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13 }}>
              Nenhum fiscal cadastrado.
            </div>
          )}
          {fiscais.map((f) => {
            const statusAtual = agenda[f.id] || "Disponível";
            return (
              <div
                key={f.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontSize: 20 }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      Mat. {f.matricula}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {STATUS_AGENDA.map((s) => {
                    const cor = STATUS_COR[s] || T.muted;
                    const ativo = statusAtual === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setAgendaFiscal(f.id, s)}
                        style={{
                          background: ativo ? `${cor}20` : T.surface,
                          border: `1.5px solid ${ativo ? cor : T.border}`,
                          borderRadius: 8,
                          padding: "5px 10px",
                          cursor: "pointer",
                          color: ativo ? cor : T.muted,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {ativo ? "? " : ""}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- Modal: reclamação completa (Administração) -- */}
      {viewReclamacao && (
        <ReclamacaoModal
          rec={viewReclamacao}
          isAdmin={true}
          userRole={currentUser?.role || "supervisor"}
          fiscais={fiscais}
          onClose={() => setViewReclamacao(null)}
          onDesignar={(id, novoFiscal, encerrar) => {
            handleRedesignar(id, novoFiscal);
            if (encerrar && setReclamacoesGlobal) {
              setReclamacoesGlobal((prev) =>
                prev.map((r) =>
                  r.id === id ? { ...r, status: "encerrada" } : r
                )
              );
            }
            setViewReclamacao((prev) =>
              prev
                ? {
                    ...prev,
                    fiscal: novoFiscal,
                    status: encerrar ? "encerrada" : "designada",
                  }
                : null
            );
          }}
          onSalvarParecer={(id, parecer, parecerStatus) => {
            if (setReclamacoesGlobal) {
              setReclamacoesGlobal((prev) =>
                prev.map((r) =>
                  r.id === id
                    ? {
                        ...r,
                        parecer,
                        parecerStatus,
                        parecerData: new Date().toLocaleDateString("pt-BR"),
                        status:
                          parecerStatus === "sem_irregularidade"
                            ? "sem_irregularidade"
                            : r.status,
                      }
                    : r
                )
              );
            }
            setViewReclamacao((prev) =>
              prev ? { ...prev, parecer, parecerStatus } : null
            );
          }}
          onAcao={(tipo, rec) => {
            setViewReclamacao(null);
            if (onAcaoReclamacao) onAcaoReclamacao(tipo, rec);
          }}
        />
      )}

      {/* -- ABA: RECLAMAÇÕES -------------------------------------------- */}
      {subTab === "reclamacoes" && (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            Todas as reclamações. Clique para abrir detalhes e redesignar.
          </div>
          <input
            className="input-field"
            placeholder="Buscar reclamação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {reclamacoes.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: T.muted,
                fontSize: 13,
              }}
            >
              Nenhuma reclamação registrada ainda.
            </div>
          )}
          {reclamacoes
            .filter(
              (r) =>
                !busca ||
                r.reclamante?.toLowerCase().includes(busca.toLowerCase()) ||
                r.bairro?.toLowerCase().includes(busca.toLowerCase()) ||
                r.num?.toLowerCase().includes(busca.toLowerCase()) ||
                r.reclamado?.toLowerCase().includes(busca.toLowerCase())
            )
            .map((r) => {
              const statusCor =
                {
                  nova: T.accent,
                  designada: T.gold,
                  sem_irregularidade: T.muted,
                  resolvida: T.success,
                  encerrada: T.success,
                }[r.status] || T.muted;
              const statusLbl =
                {
                  nova: "Nova",
                  designada: "Designada",
                  sem_irregularidade: "Sem Irr.",
                  resolvida: "Resolvida",
                  encerrada: "Encerrada",
                }[r.status] || r.status;
              return (
                <div
                  key={r.id}
                  onClick={() => setViewReclamacao(r)}
                  style={{
                    background: T.card,
                    borderRadius: 12,
                    marginBottom: 8,
                    cursor: "pointer",
                    border: `1.5px solid ${T.border}`,
                    borderLeft: `4px solid ${statusCor}`,
                    padding: 12,
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{ fontWeight: 800, fontSize: 13, color: T.text }}
                      >
                        {r.num}
                      </span>
                      <span style={{ fontSize: 10, color: T.muted }}>
                        {r.data}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        background: `${statusCor}15`,
                        color: statusCor,
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontWeight: 700,
                        border: `1px solid ${statusCor}30`,
                      }}
                    >
                      {statusLbl}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.text,
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {r.reclamado || "—"} · {r.bairro}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Reclamante: {r.reclamante || "Anônimo"}</span>
                    <span
                      style={{
                        color: r.fiscal ? T.gold : T.muted,
                        fontWeight: r.fiscal ? 600 : 400,
                      }}
                    >
                      {r.fiscal ? r.fiscal : "Não designado"}
                    </span>
                  </div>
                  {r.parecerStatus && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: T.success,
                        fontWeight: 600,
                      }}
                    >
                      📋 Parecer: {r.parecerStatus}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* -- ABA: CONTRIBUINTE ------------------------------------------- */}
      {subTab === "contribuinte" && (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            Busque pelo CPF/CNPJ para ver todo o histórico do contribuinte.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              className="input-field"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder="CPF/CNPJ ou nome do proprietário"
              value={cpfBusca}
              onChange={(e) => setCpfBusca(e.target.value)}
            />
            {cpfBusca && (
              <button
                onClick={() => setCpfBusca("")}
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0 12px",
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ?
              </button>
            )}
          </div>
          {cpfBusca.trim().length >= 3 &&
            (() => {
              const q = cpfBusca.trim().toLowerCase();
              const encontrados = records.filter(
                (r) =>
                  (r.cpf || "").toLowerCase().includes(q) ||
                  (r.owner || "").toLowerCase().includes(q)
              );
              const reincidente = encontrados.length > 1;
              if (encontrados.length === 0)
                return (
                  <div style={{ color: T.muted, fontSize: 13 }}>
                    Nenhum registro encontrado.
                  </div>
                );
              const cpfRef = encontrados[0]?.cpf || "—";
              const nomeRef = encontrados[0]?.owner || "—";
              const multas = encontrados.filter(
                (r) => r.type === "auto" && r.multa
              );
              const totalMultas = multas.reduce((s, r) => {
                const v = parseFloat(
                  (r.multa || "0").replace(/\./g, "").replace(",", ".")
                );
                return s + (isNaN(v) ? 0 : v);
              }, 0);
              return (
                <div>
                  <div
                    style={{
                      background: T.card,
                      border: `1.5px solid ${
                        reincidente ? T.danger : T.border
                      }`,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {nomeRef}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      CPF/CNPJ: {cpfRef}
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: `${T.gold}18`,
                          color: T.gold,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {encontrados.filter((r) => r.type === "notif").length}{" "}
                        notif.
                      </span>
                      <span
                        style={{
                          background: `${T.danger}18`,
                          color: T.danger,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {encontrados.filter((r) => r.type === "auto").length}{" "}
                        autos
                      </span>
                      {totalMultas > 0 && (
                        <span
                          style={{
                            background: `${"#9B59B6"}18`,
                            color: "#9B59B6",
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          R${" "}
                          {totalMultas.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      {reincidente && (
                        <span
                          style={{
                            background: `${T.danger}18`,
                            color: T.danger,
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          REINCIDENTE
                        </span>
                      )}
                    </div>
                  </div>
                  {encontrados
                    .slice()
                    .reverse()
                    .map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: T.card,
                          border: `1px solid ${T.border}`,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: r.type === "auto" ? T.danger : T.gold,
                            }}
                          >
                            {r.num}
                          </span>
                          <span style={{ fontSize: 11, color: T.muted }}>
                            {r.date}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: 12, color: T.muted, marginTop: 3 }}
                        >
                          {r.addr} · {r.fiscal} · <strong>{r.status}</strong>
                        </div>
                        {r.type === "auto" && r.multa && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#9B59B6",
                              marginTop: 2,
                            }}
                          >
                            Multa: R$ {r.multa}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              );
            })()}
        </div>
      )}

      {/* -- ABA: RELATÓRIO ---------------------------------------------- */}
      {subTab === "relatorio" && (
        <RelatorioAvancado
          records={records}
          fiscais={fiscais}
          reclamacoes={reclamacoesGlobal}
        />
      )}
    </div>
  );
}


function AdminScreen({ usuarios, setUsuarios, currentUser, addLog }) {
  const users = usuarios;
  const setUsers = setUsuarios;
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [modalForm, setModalForm] = useState(null); // null | "novo" | user obj
  const [confirmDel, setConfirmDel] = useState(null); // null | user obj
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const roleLabel = {
    admin: "Gerência",
    supervisor: "Administração",
    fiscal: "Fiscal",
    atendente: "Balcão",
  };
  const roleColors = {
    admin: T.danger,
    supervisor: T.gold,
    fiscal: T.accent,
    atendente: T.success,
  };
  const roleClass = {
    admin: "role-admin",
    supervisor: "role-supervisor",
    fiscal: "role-fiscal",
    atendente: "role-atendente",
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "todos" || u.role === filterRole;
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.matricula?.includes(search);
    return matchRole && matchSearch;
  });

  const handleSave = (form) => {
    // Verificar matrícula duplicada
    const dupMatr = users.find(
      (u) =>
        u.matricula.trim() === (form.matricula || "").trim() &&
        (form.id === undefined || form.id === null || u.id !== form.id)
    );
    if (dupMatr) {
      showToast(
        `⚠️ Matrícula ${form.matricula} já pertence a ${dupMatr.name}.`,
        "danger"
      );
      return;
    }
    if (form.id) {
      // On edit: only update senha if a new one was typed
      const updated = { ...form };
      if (!form.senha) {
        const existing = users.find((u) => u.id === form.id);
        updated.senha = existing?.senha || "";
      }
      delete updated.senhaConfirm;
      setUsers((prev) => prev.map((u) => (u.id === form.id ? updated : u)));
      if (addLog)
        addLog(
          "Usuário editado",
          `${form.name} (Mat. ${form.matricula}) — perfil: ${
            roleLabel[form.role]
          }`,
          currentUser?.name
        );
      showToast(`? ${form.name} atualizado!`);
    } else {
      const novo = { ...form, id: Date.now() };
      delete novo.senhaConfirm;
      setUsers((prev) => [...prev, novo]);
      if (addLog)
        addLog(
          "Usuário criado",
          `${form.name} (Mat. ${form.matricula}) — perfil: ${
            roleLabel[form.role]
          }`,
          currentUser?.name
        );
      showToast(`? ${form.name} criado com sucesso!`);
    }
    setModalForm(null);
  };

  const handleDelete = () => {
    if (addLog)
      addLog(
        "Usuário removido",
        `${confirmDel.name} (Mat. ${confirmDel.matricula}) — perfil: ${
          roleLabel[confirmDel.role]
        }`,
        currentUser?.name
      );
    setUsers((prev) => prev.filter((u) => u.id !== confirmDel.id));
    showToast(`${confirmDel.name} removido do sistema.`, "danger");
    setConfirmDel(null);
  };

  const contagem = {
    todos: users.length,
    ...Object.fromEntries(
      Object.keys(roleLabel).map((r) => [
        r,
        users.filter((u) => u.role === r).length,
      ])
    ),
  };

  return (
    <div className="admin-screen">
      {toast && (
        <div
          className="toast"
          style={{
            background:
              typeof toast === "object"
                ? toast.type === "danger"
                  ? T.danger
                  : T.success
                : T.success,
          }}
        >
          {typeof toast === "object" ? toast.msg : String(toast)}
        </div>
      )}

      {modalForm && (
        <UserFormModal
          user={modalForm === "novo" ? null : modalForm}
          onSave={handleSave}
          onCancel={() => setModalForm(null)}
        />
      )}

      {confirmDel && (
        <ConfirmDeleteModal
          user={confirmDel}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: T.font,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          Administração
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          Gestão de usuários e permissões do sistema
        </div>
      </div>

      {/* Resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total", val: contagem.todos, color: T.text },
          { label: "Fiscal", val: contagem.fiscal, color: T.accent },
          { label: "Administração", val: contagem.supervisor, color: T.gold },
          { label: "Balcão", val: contagem.atendente, color: T.success },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "10px 6px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 24,
                fontWeight: 800,
                color: s.color,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Busca + Botão novo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            flex: 1,
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: 10,
            padding: "9px 12px",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <input
            style={{
              background: "none",
              border: "none",
              color: T.text,
              fontSize: 13,
              outline: "none",
              width: "100%",
            }}
            placeholder="Nome, e-mail ou matrícula…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModalForm("novo")}
          style={{
            background: `${T.accent}18`,
            border: `1.5px solid ${T.accent}`,
            color: T.accent,
            borderRadius: 10,
            padding: "0 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="plus" size={14} color={T.accent} /> Novo
        </button>
      </div>

      {/* Filtro por perfil */}
      <div className="filter-row" style={{ marginBottom: 16 }}>
        {[
          { id: "todos", label: `Todos (${contagem.todos})` },
          { id: "fiscal", label: `Fiscal (${contagem.fiscal})` },
          { id: "supervisor", label: `Adm. (${contagem.supervisor})` },
          { id: "atendente", label: `Balcão (${contagem.atendente})` },
          { id: "admin", label: `Gerência (${contagem.admin})` },
        ].map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filterRole === f.id ? "active" : ""}`}
            onClick={() => setFilterRole(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de usuários */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: T.muted,
            fontSize: 13,
          }}
        >
          Nenhum usuário encontrado.
        </div>
      )}

      {filtered.map((u) => (
        <div
          key={u.id}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            borderLeft: `3px solid ${roleColors[u.role]}`,
            opacity: u.ativo ? 1 : 0.55,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: `${roleColors[u.role]}22`,
                border: `1.5px solid ${roleColors[u.role]}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.font,
                fontSize: 16,
                fontWeight: 800,
                color: roleColors[u.role],
              }}
            >
              {u.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                  {u.name}
                </div>
                {!u.ativo && (
                  <span
                    style={{
                      fontSize: 9,
                      background: `${T.danger}22`,
                      color: T.danger,
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontWeight: 700,
                    }}
                  >
                    BLOQUEADO
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {u.email}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    background: `${roleColors[u.role]}18`,
                    color: roleColors[u.role],
                    borderRadius: 6,
                    padding: "2px 7px",
                    fontWeight: 700,
                  }}
                >
                  {roleLabel[u.role]}
                </span>
                {u.matricula && (
                  <span style={{ fontSize: 10, color: T.muted }}>
                    Mat. {u.matricula}
                  </span>
                )}
                {u.role === "fiscal" && u.bairros?.length > 0 && (
                  <span style={{ fontSize: 10, color: T.muted }}>
                    {u.bairros.length} bairro{u.bairros.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setModalForm(u)}
                style={{
                  background: `${T.gold}15`,
                  border: `1px solid ${T.gold}50`,
                  color: T.gold,
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Editar
              </button>
              <button
                onClick={() => setConfirmDel(u)}
                style={{
                  background: `${T.danger}15`,
                  border: `1px solid ${T.danger}50`,
                  color: T.danger,
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Remover
              </button>
            </div>
          </div>

          {/* Bairros expandidos para fiscal */}
          {u.role === "fiscal" && u.bairros?.length > 0 && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {u.bairros.map((b) => (
                <span
                  key={b}
                  style={{
                    fontSize: 10,
                    background: `${T.accent}12`,
                    color: T.accent,
                    borderRadius: 6,
                    padding: "2px 7px",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Bloco de segurança */}
      <div
        style={{
          marginTop: 8,
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div
          style={{
            fontFamily: T.font,
            fontSize: 13,
            letterSpacing: 1,
            color: T.gold,
            marginBottom: 10,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {" "}
          Segurança do Sistema
        </div>
        {[
          "Autenticação com login + senha",
          "Sessão com token JWT (expiração 8h)",
          "Logs de acesso e atividade",
          "Backup automático diário",
        ].map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              borderBottom: `1px solid ${T.border}`,
              fontSize: 13,
            }}
          >
            <Icon name="check" size={14} color={T.success} /> {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Reclamação Detail Modal --------------------------------------------------

function ReclamacaoModal({
  rec,
  onClose,
  onDesignar,
  onAcao,
  isAdmin,
  userRole,
  fiscais = [],
  onSalvarParecer,
}) {
  const [fiscalSel, setFiscalSel] = useState(rec.fiscal || "");
  const [parecer, setParecer] = useState(rec.parecer || "");
  const [parecerStatus, setParecerStatus] = useState(rec.parecerStatus || "");
  const [salvandoParecer, setSalvandoParecer] = useState(false);
  const statusColor = {
    nova: T.accent,
    designada: T.gold,
    encerrada: T.success,
    sem_irregularidade: T.muted,
    resolvida: T.success,
  };
  const statusLabel = {
    nova: "Nova",
    designada: "Designada",
    encerrada: "Encerrada",
    sem_irregularidade: "Sem Irregularidade",
    resolvida: "Resolvida",
  };
  const isFiscal = userRole === "fiscal";
  const isAtendente = userRole === "atendente";
  const parecerOpts = [
    {
      id: "sem_irregularidade",
      label: " Sem irregularidade",
      color: T.success,
    },
    { id: "notificado", label: " Notificado", color: T.gold },
    { id: "autuado", label: " Autuado", color: T.danger },
    { id: "em_apuracao", label: " Em apuração", color: T.accent },
  ];
  const parecerCor = {
    sem_irregularidade: T.success,
    notificado: T.gold,
    autuado: T.danger,
    em_apuracao: T.accent,
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet" style={{ maxHeight: "92vh" }}>
        <div className="modal-handle" />

        {/* Header */}
        <div className="recl-modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>
              Reclamação
            </div>
            <div className="recl-modal-num">{rec.num}</div>
          </div>
          <span
            className="badge"
            style={{
              background: `${statusColor[rec.status]}22`,
              color: statusColor[rec.status],
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            {statusLabel[rec.status]}
          </span>
        </div>

        {/* Foto mock */}
        {rec.foto ? (
          <div className="recl-photo-mock"></div>
        ) : (
          <div
            style={{
              background: T.surface,
              border: `1px dashed ${T.border}`,
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              textAlign: "center",
              color: T.muted,
              fontSize: 12,
            }}
          >
            {" "}
            Nenhuma foto anexada
          </div>
        )}

        {/* Detalhes */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Dados da Reclamação
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Data</span>
            <span className="recl-detail-val">{rec.data}</span>
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Reclamante</span>
            <span className="recl-detail-val" style={{ fontWeight: 600 }}>
              {rec.reclamante}
            </span>
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Contato</span>
            <span className="recl-detail-val">{rec.contato}</span>
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Reclamado</span>
            <span
              className="recl-detail-val"
              style={{ fontWeight: 600, color: T.danger }}
            >
              {rec.reclamado}
            </span>
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Endereço</span>
            <span className="recl-detail-val">{rec.endereco}</span>
          </div>
          <div className="recl-detail-row">
            <span className="recl-detail-label">Descrição</span>
            <span className="recl-detail-val" style={{ color: T.muted }}>
              {rec.descricao}
            </span>
          </div>
        </div>

        {/* Designação — apenas admin/supervisor podem designar */}
        <div className="recl-assign-box">
          <div className="recl-assign-title">Fiscal Responsável</div>
          {isAdmin ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select
                className="input-field"
                style={{ flex: 1 }}
                value={fiscalSel}
                onChange={(e) => setFiscalSel(e.target.value)}
              >
                <option value="">Selecione um fiscal</option>
                {fiscais.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name} —{" "}
                    {f.role === "supervisor" ? "Administração" : "Fiscal"}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                style={{
                  flex: "none",
                  width: "auto",
                  padding: "0 16px",
                  marginTop: 0,
                  fontSize: 13,
                }}
                onClick={() => {
                  if (fiscalSel) onDesignar(rec.id, fiscalSel);
                }}
              >
                Designar
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: rec.fiscal ? T.gold : T.muted,
              }}
            >
              {rec.fiscal
                ? rec.fiscal
                : isAtendente
                ? "⏳ Aguardando designação pelo supervisor"
                : "Ainda não designado"}
            </div>
          )}
          {rec.dataDesig && (
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
              Designado em: {rec.dataDesig}
            </div>
          )}
        </div>

        {/* Parecer do fiscal — visível para todos, editável só pelo fiscal */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Parecer / Andamento
          </div>

          {/* Status de andamento */}
          {(isFiscal || isAdmin) && rec.status !== "encerrada" ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {parecerOpts.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setParecerStatus(op.id)}
                    style={{
                      background:
                        parecerStatus === op.id ? `${op.color}20` : T.surface,
                      border: `1.5px solid ${
                        parecerStatus === op.id ? op.color : T.border
                      }`,
                      borderRadius: 8,
                      padding: "5px 10px",
                      cursor: "pointer",
                      color: parecerStatus === op.id ? op.color : T.muted,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <textarea
                className="input-field"
                style={{ minHeight: 80, resize: "none", marginBottom: 8 }}
                placeholder="Descreva o parecer da visita ao local..."
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
              />
              <button
                onClick={() => {
                  if (onSalvarParecer)
                    onSalvarParecer(rec.id, parecer, parecerStatus);
                  setSalvandoParecer(true);
                  setTimeout(() => setSalvandoParecer(false), 1500);
                }}
                style={{
                  width: "100%",
                  background: T.accent,
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {salvandoParecer ? "Salvo!" : "Salvar Parecer"}
              </button>
            </>
          ) : (
            <div>
              {rec.parecerStatus ? (
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      background: `${
                        parecerCor[rec.parecerStatus] || T.muted
                      }18`,
                      color: parecerCor[rec.parecerStatus] || T.muted,
                      borderRadius: 8,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {parecerOpts.find((p) => p.id === rec.parecerStatus)
                      ?.label || rec.parecerStatus}
                  </span>
                </div>
              ) : null}
              {rec.parecer ? (
                <div
                  style={{
                    fontSize: 13,
                    color: T.text,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  "{rec.parecer}"
                </div>
              ) : (
                <div style={{ fontSize: 12, color: T.muted }}>
                  {rec.status === "encerrada"
                    ? "Reclamação encerrada sem parecer registrado."
                    : "Aguardando visita e parecer do fiscal responsável."}
                </div>
              )}
              {rec.parecerData && (
                <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>
                  Registrado em: {rec.parecerData}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações: fiscal e admin podem gerar documentos; atendente só visualiza */}
        {rec.status !== "encerrada" && isFiscal && (
          <>
            <div
              style={{
                fontSize: 12,
                color: T.muted,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Gerar documento a partir desta reclamação
            </div>
            <div className="recl-action-row">
              <button
                className="btn-notif-sm"
                onClick={() => onAcao("notif", rec)}
              >
                Notificação
              </button>
              <button
                className="btn-auto-sm"
                onClick={() => onAcao("auto", rec)}
              >
                Auto de Infração
              </button>
            </div>
            {(isAdmin || isFiscal) && (
              <button
                className="btn-encerrar"
                onClick={() =>
                  onDesignar(rec.id, rec.fiscal, true, "resolvida")
                }
              >
                ✔ Marcar como Resolvida
              </button>
            )}
          </>
        )}

        {isAtendente && rec.status === "sem_irregularidade" && (
          <div
            style={{
              background: `${T.success}10`,
              border: `1.5px solid ${T.success}40`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: T.success,
                marginBottom: 6,
              }}
            >
              Fiscal informou: sem irregularidade no local
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Você pode registrar a resolução desta reclamação.
            </div>
            <button
              onClick={() => {
                if (onDesignar)
                  onDesignar(rec.id, rec.fiscal, true, "resolvida");
              }}
              style={{
                width: "100%",
                background: T.success,
                border: "none",
                borderRadius: 10,
                color: "#fff",
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✔ Dar baixa — marcar como Resolvida
            </button>
          </div>
        )}
        {isAtendente &&
          rec.status !== "sem_irregularidade" &&
          rec.status !== "resolvida" &&
          rec.status !== "encerrada" && (
            <div
              style={{
                background: "rgba(0,194,255,0.06)",
                border: `1px solid rgba(0,194,255,0.2)`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
                fontSize: 12,
                color: T.muted,
              }}
            >
              A geração de documentos e designação são feitas pelo supervisor ou
              pelo fiscal responsável.
            </div>
          )}

        {rec.status === "encerrada" && (
          <div
            style={{
              textAlign: "center",
              padding: 12,
              color: T.success,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✔ Reclamação encerrada
          </div>
        )}
      </div>
    </div>
  );
}

// --- Nova Reclamação ----------------------------------------------------------

function NovaReclamacaoScreen({ onBack, onSalvar, usuarios = [] }) {
  const [step, setStep] = useState(1); // 3 passos
  const fiscais = usuarios.filter((u) => u.role === "fiscal" && u.ativo);

  const getFiscalDoBairro = (bairro) => {
    if (!bairro) return "";
    const f = fiscais.find((u) => (u.bairros || []).includes(bairro));
    return f ? f.name : "";
  };

  const [form, setForm] = useState({
    origem: "telefone",
    reclamante: "",
    telefone: "",
    email: "",
    reclamado: "",
    cpf_cnpj: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    descricao: "",
    prioridade: "normal",
    foto: false,
    fiscal: "",
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const BAIRROS_VDC = [
    "Alto Maron",
    "Ayrton Senna",
    "Bateias",
    "Boa Vista",
    "Brasil",
    "Campinhos",
    "Candeias",
    "Centro",
    "Cruzeiro",
    "Distrito Industrial",
    "Espírito Santo",
    "Felícia",
    "Guarani",
    "Ibirapuera",
    "Jatobá",
    "Jurema",
    "Lagoa das Flores",
    "Nossa Senhora Aparecida",
    "Patagônia",
    "Primavera",
    "Recreio",
    "São Pedro",
    "Universidade",
    "Zabelê",
    "Zona Rural",
  ];

  const origemLabel = {
    telefone: "Telefone",
    balcao: "Balcão",
    supervisor: "Supervisor",
  };
  const prioridadeCfg = {
    baixa: { label: "Baixa", color: T.muted, bg: `${T.muted}22` },
    normal: { label: "Normal", color: T.accent, bg: `${T.accent}22` },
    alta: { label: "Alta", color: T.gold, bg: `${T.gold}22` },
    urgente: { label: "Urgente", color: T.danger, bg: `${T.danger}22` },
  };

  const validate = () => {
    const e = {};
    // Passo 1: reclamante, telefone e email são opcionais
    if (step === 2) {
      if (!form.endereco.trim()) e.endereco = "Obrigatório";
      if (!form.bairro.trim()) e.bairro = "Obrigatório";
    }
    if (step === 3) {
      if (!form.descricao.trim()) e.descricao = "Obrigatório";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const handleSalvar = () => {
    if (!validate()) return;
    onSalvar({ ...form, contato: form.telefone || form.email });
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const Err = ({ k }) =>
    errors[k] ? (
      <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>
        {errors[k]}
      </div>
    ) : null;

  // Barra de progresso
  const Progress = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 4,
            background: n <= step ? T.accent : T.border,
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );

  const stepLabel = ["Reclamante", "Localização", "Irregularidade"];

  return (
    <div className="nova-recl-screen">
      {toast && (
        <div className="toast" style={{ position: "fixed", zIndex: 9999 }}>
          <Icon name="check" size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={step === 1 ? onBack : prevStep}
          style={{
            background: "none",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            padding: 4,
          }}
        >
          <svg
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            Nova Reclamação
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>
            Passo {step} de 3 —{" "}
            <span style={{ color: T.accent }}>{stepLabel[step - 1]}</span>
          </div>
        </div>
        <div
          style={{
            background: `${T.accent}15`,
            border: `1px solid ${T.accent}40`,
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            color: T.accent,
            fontWeight: 700,
          }}
        >
          {step}/3
        </div>
      </div>

      <Progress />

      {/* -- PASSO 1: Reclamante + Origem --------------------------- */}
      {step === 1 && (
        <>
          {/* Origem */}
          <div className="form-section">
            <div className="form-section-title">Como chegou a reclamação?</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {["telefone", "balcao", "supervisor"].map((o) => (
                <button
                  key={o}
                  onClick={() => f("origem", o)}
                  style={{
                    background: form.origem === o ? `${T.accent}18` : T.surface,
                    border: `1.5px solid ${
                      form.origem === o ? T.accent : T.border
                    }`,
                    borderRadius: 10,
                    padding: "10px 6px",
                    cursor: "pointer",
                    color: form.origem === o ? T.accent : T.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {origemLabel[o]}
                </button>
              ))}
            </div>
          </div>

          {/* Dados do reclamante */}
          <div className="form-section">
            <div className="form-section-title">Dados do Reclamante</div>
            <div className="form-group">
              <label className="input-label">
                Nome completo{" "}
                <span style={{ color: T.danger, fontSize: 10 }}>*</span>
              </label>
              <input
                className="input-field"
                placeholder="Nome completo do reclamante"
                value={form.reclamante}
                onChange={(e) => f("reclamante", e.target.value)}
                style={errors.reclamante ? { borderColor: T.danger } : {}}
              />
              <Err k="reclamante" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">
                  Telefone{" "}
                  <span style={{ color: T.muted, fontSize: 10 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  className="input-field"
                  placeholder="(77) 9 0000-0000"
                  value={form.telefone}
                  onChange={(e) => f("telefone", maskTelefone(e.target.value))}
                  style={errors.contato ? { borderColor: T.danger } : {}}
                />
              </div>
              <div className="form-group">
                <label className="input-label">
                  E-mail{" "}
                  <span style={{ color: T.muted, fontSize: 10 }}>
                    (opcional)
                  </span>
                </label>
                <input
                  className="input-field"
                  placeholder="exemplo@email.com"
                  value={form.email}
                  onChange={(e) => f("email", e.target.value)}
                  style={errors.contato ? { borderColor: T.danger } : {}}
                />
              </div>
            </div>
            {errors.contato && (
              <div
                style={{
                  fontSize: 11,
                  color: T.danger,
                  marginTop: -6,
                  marginBottom: 8,
                }}
              >
                {" "}
                {errors.contato}
              </div>
            )}
          </div>

          {/* Dados do reclamado */}
          <div className="form-section">
            <div className="form-section-title" style={{ color: T.danger }}>
              Dados do Reclamado
            </div>
            <div className="form-group">
              <label className="input-label">Nome / Razão social</label>
              <input
                className="input-field"
                placeholder="Proprietário, empresa ou responsável pela obra"
                value={form.reclamado}
                onChange={(e) => f("reclamado", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label">CPF / CNPJ (se souber)</label>
              <input
                className="input-field"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={form.cpf_cnpj}
                onChange={(e) => f("cpf_cnpj", maskCPF(e.target.value))}
              />
            </div>
          </div>
        </>
      )}

      {/* -- PASSO 2: Localização ----------------------------------- */}
      {step === 2 && (
        <div className="form-section">
          <div className="form-section-title">
            Localização da Irregularidade
          </div>

          <div className="form-group">
            <label className="input-label">Endereço / Rua *</label>
            <input
              className="input-field"
              placeholder="Nome da rua, avenida…"
              value={form.endereco}
              onChange={(e) => f("endereco", e.target.value)}
              style={errors.endereco ? { borderColor: T.danger } : {}}
            />
            <Err k="endereco" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Número</label>
              <input
                className="input-field"
                placeholder="Nº da obra"
                value={form.numero}
                onChange={(e) => f("numero", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Complemento</label>
              <input
                className="input-field"
                placeholder="Apto, bloco…"
                value={form.complemento}
                onChange={(e) => f("complemento", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Bairro *</label>
            <select
              className="input-field"
              value={form.bairro}
              onChange={(e) => {
                const b = e.target.value;
                const fDoB = getFiscalDoBairro(b);
                setForm((p) => ({ ...p, bairro: b, fiscal: fDoB || p.fiscal }));
              }}
              style={errors.bairro ? { borderColor: T.danger } : {}}
            >
              <option value="">Selecione o bairro</option>
              {BAIRROS_VDC.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {form.bairro && getFiscalDoBairro(form.bairro) && (
              <div style={{ fontSize: 11, color: T.success, marginTop: 4 }}>
                ✔ Fiscal designado automaticamente:{" "}
                <strong>{getFiscalDoBairro(form.bairro)}</strong>
              </div>
            )}
            <Err k="bairro" />
          </div>

          <div className="form-group">
            <label className="input-label">CEP</label>
            <input
              className="input-field"
              placeholder="45000-000"
              value={form.cep}
              onChange={(e) => f("cep", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Fiscal responsável</label>
            <select
              className="input-field"
              value={form.fiscal}
              onChange={(e) => f("fiscal", e.target.value)}
            >
              <option value="">
                —{" "}
                {form.bairro && getFiscalDoBairro(form.bairro)
                  ? `Auto: ${getFiscalDoBairro(form.bairro)}`
                  : "Nenhum fiscal cadastrado para este bairro"}{" "}
                —
              </option>
              {fiscais.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} (
                  {u.role === "supervisor" ? "Administração" : "Fiscal"})
                  {(u.bairros || []).includes(form.bairro) ? " ?" : ""}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              * = fiscal do bairro. Pode alterar caso o fiscal esteja ausente.
            </div>
          </div>

          {/* Mapa placeholder */}
          <div
            style={{
              background: `${T.accent}08`,
              border: `1.5px dashed ${T.accent}40`,
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>
              Confirmação de localização
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              {form.bairro
                ? `${form.endereco || "Endereço não informado"}, ${
                    form.bairro
                  } — Vitória da Conquista`
                : "Selecione o bairro para ver no mapa"}
            </div>
          </div>
        </div>
      )}

      {/* -- PASSO 3: Irregularidade + Prioridade ------------------- */}
      {step === 3 && (
        <>
          {/* Prioridade */}
          <div className="form-section">
            <div className="form-section-title">Prioridade</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {Object.entries(prioridadeCfg).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => f("prioridade", k)}
                  style={{
                    background: form.prioridade === k ? v.bg : T.surface,
                    border: `1.5px solid ${
                      form.prioridade === k ? v.color : T.border
                    }`,
                    borderRadius: 10,
                    padding: "10px 4px",
                    cursor: "pointer",
                    color: form.prioridade === k ? v.color : T.muted,
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {form.prioridade === "urgente" && (
              <div
                style={{
                  marginTop: 10,
                  background: `${T.danger}12`,
                  border: `1px solid ${T.danger}40`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: T.danger,
                }}
              >
                Reclamações urgentes serão notificadas imediatamente ao
                supervisor de plantão.
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="form-section">
            <div className="form-section-title">
              Descrição da Irregularidade
            </div>
            <div className="form-group">
              <label className="input-label">
                Descreva a situação relatada *
              </label>
              <textarea
                className="input-field"
                style={{
                  minHeight: 120,
                  resize: "none",
                  ...(errors.descricao ? { borderColor: T.danger } : {}),
                }}
                placeholder="Descreva detalhadamente o que o reclamante relatou: tipo de obra, situação irregular observada, horários, equipamentos, riscos, etc."
                value={form.descricao}
                onChange={(e) => f("descricao", e.target.value)}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <Err k="descricao" />
                <div
                  style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}
                >
                  {form.descricao.length} caracteres
                </div>
              </div>
            </div>
          </div>

          {/* Foto */}
          <div className="form-section">
            <div className="form-section-title">Foto (opcional)</div>
            <div
              className="photo-slot"
              style={{ aspectRatio: "16/9" }}
              onClick={() => f("foto", !form.foto)}
            >
              {form.foto ? (
                <>
                  <span style={{ fontSize: 36 }}></span>
                  <div style={{ fontSize: 11, color: T.success, marginTop: 6 }}>
                    {" "}
                    Foto anexada — toque para remover
                  </div>
                </>
              ) : (
                <>
                  <Icon name="camera" size={28} color={T.muted} />
                  <span style={{ fontSize: 12, marginTop: 6 }}>
                    Toque para anexar foto da irregularidade
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Resumo antes de salvar */}
          <div
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: T.accent,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              {" "}
              Resumo da Reclamação
            </div>
            {[
              { label: "Origem", val: origemLabel[form.origem] },
              { label: "Reclamante", val: form.reclamante || "—" },
              { label: "Contato", val: form.telefone || form.email || "—" },
              { label: "Reclamado", val: form.reclamado || "Não informado" },
              {
                label: "Local",
                val: form.bairro
                  ? `${form.endereco}${
                      form.numero ? ", " + form.numero : ""
                    } — ${form.bairro}`
                  : "—",
              },
              {
                label: "Prioridade",
                val: prioridadeCfg[form.prioridade].label,
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: `1px solid ${T.border}`,
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.muted }}>{row.label}</span>
                <span
                  style={{
                    color: T.text,
                    fontWeight: 500,
                    maxWidth: "60%",
                    textAlign: "right",
                  }}
                >
                  {row.val}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Botões de navegação */}
      <div className="submit-row">
        <button
          className="btn-outline"
          onClick={step === 1 ? onBack : prevStep}
        >
          {step === 1 ? "Cancelar" : "← Voltar"}
        </button>
        {step < 3 ? (
          <button className="btn-submit notif-btn" onClick={nextStep}>
            Próximo ?
          </button>
        ) : (
          <button className="btn-submit notif-btn" onClick={handleSalvar}>
            <Icon name="save" size={16} /> Registrar
          </button>
        )}
      </div>
    </div>
  );
}

// --- Reclamações Screen -------------------------------------------------------

function ReclamacoesScreen({
  user,
  usuarios = [],
  reclamacoesGlobal,
  setReclamacoesGlobal,
  onAcao,
  addLog,
  supaInsertReclamacao,
}) {
  const fiscais = usuarios.filter((u) => u.role === "fiscal" && u.ativo);
  // Usa diretamente o estado global — atualiza automaticamente com o polling
  const reclamacoes = reclamacoesGlobal || [];
  const setReclamacoes = (v) => {
    if (setReclamacoesGlobal) setReclamacoesGlobal(v);
  };
  const [filtro, setFiltro] = useState("todas");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNova, setShowNova] = useState(false);
  const [toast, setToast] = useState(null);
  const isAdmin = user?.role === "admin" || user?.role === "supervisor";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDesignar = (id, fiscal, encerrar = false) => {
    setReclamacoes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              fiscal,
              status: encerrar ? "encerrada" : "designada",
              dataDesig: encerrar
                ? r.dataDesig
                : new Date().toLocaleDateString("pt-BR"),
            }
          : r
      )
    );
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            fiscal,
            status: encerrar ? "encerrada" : "designada",
            dataDesig: encerrar
              ? prev.dataDesig
              : new Date().toLocaleDateString("pt-BR"),
          }
        : null
    );
    showToast(
      encerrar
        ? "Reclamação encerrada!"
        : `Reclamação designada para ${fiscal}!`
    );
  };

  const handleSalvar = async (form) => {
    const year = new Date().getFullYear();
    const seq = String(reclamacoes.length + 1).padStart(4, "0");
    const num = `RC-${seq}/${year}`;
    const fiscalDesig = form.fiscal || null;
    const id = String(Date.now());
    const nova = {
      id,
      num,
      status: fiscalDesig ? "designada" : "nova",
      reclamante: form.reclamante || "Anônimo",
      contato: form.telefone || form.email || "",
      reclamado: form.reclamado || "Não informado",
      endereco: [form.endereco, form.numero, form.complemento]
        .filter(Boolean)
        .join(", "),
      bairro: form.bairro || "",
      descricao: form.descricao || "",
      fiscal: fiscalDesig || "",
      parecer: "",
      parecer_status: "",
      parecer_data: "",
      data: new Date().toLocaleDateString("pt-BR"),
    };
    // Salva no Supabase primeiro
    if (supaInsertReclamacao) {
      const saved = await supaInsertReclamacao(nova);
      if (saved) {
        setReclamacoes((prev) => [{ ...nova, id: saved.id }, ...prev]);
      } else {
        showToast("Erro ao salvar. Tente novamente.");
        return;
      }
    } else {
      setReclamacoes((prev) => [nova, ...prev]);
    }
    if (addLog)
      addLog(
        "Reclamação registrada",
        `${num} — ${form.bairro} — Fiscal: ${fiscalDesig || "não designado"}`,
        user?.name
      );
    setShowNova(false);
    showToast(
      `✔ Reclamação ${num} registrada!${
        fiscalDesig ? ` Designada para ${fiscalDesig}.` : ""
      }`
    );
  };

  // Filtros visíveis conforme perfil
  const isAtendente = user?.role === "atendente";
  const myFilter =
    !isAdmin && !isAtendente
      ? reclamacoes.filter((r) => r.fiscal === user?.name)
      : reclamacoes;
  const filtrados = myFilter.filter((r) => {
    if (filtro === "todas") {
      if (r.status === "resolvida" || r.status === "encerrada") return false;
    } else if (filtro === "resolvidas") {
      if (r.status !== "resolvida" && r.status !== "encerrada") return false;
    } else if (r.status !== filtro) return false;
    const matchS =
      !search ||
      r.reclamante.toLowerCase().includes(search.toLowerCase()) ||
      r.reclamado.toLowerCase().includes(search.toLowerCase()) ||
      r.endereco.toLowerCase().includes(search.toLowerCase()) ||
      r.num.toLowerCase().includes(search.toLowerCase());
    return matchS;
  });

  const counts = {
    todas: myFilter.filter(
      (r) => r.status !== "resolvida" && r.status !== "encerrada"
    ).length,
    nova: myFilter.filter((r) => r.status === "nova").length,
    designada: myFilter.filter((r) => r.status === "designada").length,
    sem_irregularidade: myFilter.filter(
      (r) => r.status === "sem_irregularidade"
    ).length,
    resolvidas: myFilter.filter(
      (r) => r.status === "resolvida" || r.status === "encerrada"
    ).length,
  };
  const statusColor = {
    nova: T.accent,
    designada: T.gold,
    encerrada: T.success,
    sem_irregularidade: T.muted,
    resolvida: T.success,
  };
  const statusLabel = {
    nova: "Nova",
    designada: "Designada",
    encerrada: "Encerrada",
    sem_irregularidade: "Sem Irregularidade",
    resolvida: "Resolvida",
  };

  if (showNova)
    return (
      <NovaReclamacaoScreen
        onBack={() => setShowNova(false)}
        onSalvar={handleSalvar}
        usuarios={usuarios}
      />
    );

  return (
    <div className="recl-screen">
      {toast && (
        <div className="toast">
          <Icon name="check" size={16} /> {toast}
        </div>
      )}

      {selected && (
        <ReclamacaoModal
          rec={selected}
          isAdmin={isAdmin}
          userRole={user?.role}
          fiscais={fiscais}
          onClose={() => setSelected(null)}
          onDesignar={handleDesignar}
          onSalvarParecer={(id, parecer, parecerStatus) => {
            setReclamacoesGlobal((prev) =>
              prev.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      parecer,
                      parecerStatus,
                      parecerData: new Date().toLocaleDateString("pt-BR"),
                      status:
                        parecerStatus === "sem_irregularidade"
                          ? "sem_irregularidade"
                          : r.status,
                    }
                  : r
              )
            );
          }}
          onAcao={(tipo, rec) => {
            setSelected(null);
            onAcao(tipo, rec);
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.font,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            Reclamações
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {user?.role === "atendente"
              ? "Registro e acompanhamento"
              : isAdmin
              ? "Gestão e designação"
              : "Minhas reclamações designadas"}
          </div>
        </div>
        {(isAdmin || user?.role === "atendente") && (
          <button
            onClick={() => setShowNova(true)}
            style={{
              background: "rgba(0,194,255,0.1)",
              border: `1px solid ${T.accent}`,
              color: T.accent,
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="plus" size={14} color={T.accent} /> Nova
          </button>
        )}
      </div>

      {/* Stats rápidos */}
      {isAdmin && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Novas", val: counts.nova, color: T.accent },
            { label: "Designadas", val: counts.designada, color: T.gold },
            { label: "Encerradas", val: counts.encerrada, color: T.success },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 10,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: T.font,
                  fontSize: 26,
                  fontWeight: 800,
                  color: s.color,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Busca */}
      <div
        style={{
          background: T.card,
          border: `1.5px solid ${T.border}`,
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          style={{
            background: "none",
            border: "none",
            color: T.text,
            fontSize: 14,
            outline: "none",
            width: "100%",
          }}
          placeholder="Buscar por nome, endereço, número…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="filter-row" style={{ marginBottom: 14 }}>
        {[
          { id: "todas", label: `Todas (${counts.todas})` },
          { id: "nova", label: `Novas (${counts.nova})` },
          {
            id: "sem_irregularidade",
            label: `Sem Irr. (${counts.sem_irregularidade})`,
          },
          { id: "designada", label: `Designadas (${counts.designada})` },
          { id: "resolvidas", label: `Resolvidas (${counts.resolvidas})` },
        ].map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filtro === f.id ? "active" : ""}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: T.muted,
            fontSize: 13,
          }}
        >
          {user?.role === "fiscal"
            ? "Nenhuma reclamação designada para você."
            : "Nenhuma reclamação encontrada."}
        </div>
      )}

      {filtrados.map((r) => {
        const prioCfg = {
          baixa: { color: T.muted },
          normal: { color: T.accent },
          alta: { color: T.gold },
          urgente: { color: T.danger },
        };
        const prioColor = prioCfg[r.prioridade]?.color || T.muted;
        const origemIcon = {
          telefone: "",
          email: "",
          supervisor: "",
          fiscal_campo: "",
        };
        return (
          <div
            key={r.id}
            className={`recl-card ${r.status}`}
            onClick={() => setSelected(r)}
          >
            <div className="recl-header">
              <div className="recl-num">{r.num}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {r.prioridade === "urgente" && (
                  <span
                    style={{
                      fontSize: 10,
                      background: `${T.danger}22`,
                      color: T.danger,
                      padding: "2px 6px",
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  >
                    URGENTE
                  </span>
                )}
                {r.prioridade === "alta" && (
                  <span
                    style={{
                      fontSize: 10,
                      background: `${T.gold}22`,
                      color: T.gold,
                      padding: "2px 6px",
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  >
                    ALTA
                  </span>
                )}
                <div className="recl-date">{r.data}</div>
              </div>
            </div>
            <div className="recl-reclamante">
              <strong>Reclamante:</strong> {r.reclamante}
            </div>
            <div className="recl-reclamante" style={{ color: T.danger }}>
              <strong>Reclamado:</strong> {r.reclamado}
            </div>
            <div className="recl-addr">{r.endereco}</div>
            <div className="recl-desc">
              {r.descricao.slice(0, 80)}
              {r.descricao.length > 80 ? "…" : ""}
            </div>
            <div className="recl-footer">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: T.muted }}>
                  {origemIcon[r.origem] || ""}
                </span>
                <div
                  className={`recl-fiscal-tag ${!r.fiscal ? "unassigned" : ""}`}
                >
                  {r.fiscal ? r.fiscal : "Sem fiscal designado"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="badge"
                  style={{
                    background: `${statusColor[r.status]}22`,
                    color: statusColor[r.status],
                  }}
                >
                  {statusLabel[r.status]}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Log Screen ---------------------------------------------------------------

function LogScreen({ logs = [] }) {
  const [busca, setBusca] = useState("");
  const ICONE = {
    "Usuário criado": "",
    "Usuário editado": "",
    "Usuário removido": "",
    "Notificação emitido": "",
    "Auto de Infração emitido": "",
    "Status alterado": "",
    "Reclamação registrada": "",
    "Cancelamento solicitado": "",
    "Cancelamento confirmado pelo fiscal": "",
    "Cancelamento recusado pelo fiscal": "",
    Login: "",
  };
  const COR = {
    "Usuário criado": T.accent,
    "Usuário editado": T.gold,
    "Usuário removido": T.danger,
    "Notificação emitido": T.gold,
    "Auto de Infração emitido": T.danger,
    "Status alterado": T.muted,
    "Reclamação registrada": T.accent,
    "Cancelamento solicitado": T.danger,
    Login: T.success,
  };
  const filtrados = logs.filter(
    (l) =>
      !busca ||
      (l.acao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (l.detalhe || "").toLowerCase().includes(busca.toLowerCase()) ||
      (l.autor || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: "0 16px 80px" }}>
      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        Log do Sistema
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
        {logs.length} movimentação(ões) registrada(s)
      </div>
      <input
        className="input-field"
        placeholder="Buscar por ação, detalhe ou usuário..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ marginBottom: 14 }}
      />
      {filtrados.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: T.muted,
            fontSize: 13,
          }}
        >
          {logs.length === 0
            ? "Nenhuma movimentação registrada ainda."
            : "Nenhum resultado para a busca."}
        </div>
      )}
      {filtrados.map((l) => {
        const cor = COR[l.acao] || T.muted;
        const icone = ICONE[l.acao] || "•";
        return (
          <div
            key={l.id}
            style={{
              background: T.card,
              border: `1.5px solid ${T.border}`,
              borderLeft: `4px solid ${cor}`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {icone}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: cor }}>
                    {l.acao}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      marginTop: 3,
                      wordBreak: "break-word",
                      lineHeight: 1.4,
                    }}
                  >
                    {l.detalhe}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: T.muted }}>{l.ts}</div>
                {l.autor && (
                  <div
                    style={{
                      fontSize: 10,
                      color: T.accent,
                      marginTop: 2,
                      fontWeight: 600,
                    }}
                  >
                    por {l.autor}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- DefesasScreen ------------------------------------------------------------

// --- Imprimir Defesa A4 -----------------------------------------------------

function DefesasScreen({
  defesas = [],
  records = [],
  user,
  addLog,
  onUpdateDefesa,
}) {
  const [selected, setSelected] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [search, setSearch] = useState("");
  const [julgamento, setJulgamento] = useState({
    veredicto: "",
    justificativa: "",
  });
  const [showJulgar, setShowJulgar] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const statusCfg = {
    pendente: { label: "Pendente", color: "#F59E0B", bg: "#FEF3C7" },
    deferida: { label: "Deferida", color: "#166534", bg: "#D1FAE5" },
    indeferida: { label: "Indeferida", color: "#B91C1C", bg: "#FEE2E2" },
  };

  const filtradas = defesas.filter((d) => {
    if (filtro === "pendente" && d.status !== "pendente") return false;
    if (filtro === "deferida" && d.status !== "deferida") return false;
    if (filtro === "indeferida" && d.status !== "indeferida") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (d.record_num || "").toLowerCase().includes(q) ||
        (d.nome || "").toLowerCase().includes(q) ||
        (d.codigo || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    todas: defesas.length,
    pendente: defesas.filter((d) => d.status === "pendente").length,
    deferida: defesas.filter((d) => d.status === "deferida").length,
    indeferida: defesas.filter((d) => d.status === "indeferida").length,
  };

  const handleJulgar = async () => {
    if (!julgamento.veredicto) {
      showToast("Selecione Deferida ou Indeferida.");
      return;
    }
    if (!julgamento.justificativa.trim()) {
      showToast("Informe a justificativa.");
      return;
    }
    const updated = {
      ...selected,
      status: julgamento.veredicto,
      julgado_por: user?.name,
      julgado_em: new Date().toLocaleDateString("pt-BR"),
      justificativa: julgamento.justificativa,
    };
    if (onUpdateDefesa) await onUpdateDefesa(updated);
    addLog(
      "Defesa julgada",
      `${selected.record_num} — ${julgamento.veredicto} — ${user?.name}`,
      user?.name
    );
    showToast(`✔ Defesa ${julgamento.veredicto}!`);
    setShowJulgar(false);
    setSelected(updated);
    setJulgamento({ veredicto: "", justificativa: "" });
  };

  // Find linked record - matching normalizado (remove pontuação/espaços)
  const norm = (s) => (s || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const getRecord = (d) =>
    records.find(
      (r) =>
        r.num === d.record_num ||
        norm(r.num) === norm(d.record_num) ||
        r.codigoAcesso === d.codigo ||
        norm(r.codigoAcesso) === norm(d.codigo)
    );

  return (
    <div style={{ padding: "0 16px 80px" }}>
      {toast && <div className="toast">{toast}</div>}

      {/* Modal de detalhe */}
      {selected && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelected(null);
            setShowJulgar(false);
          }}
        >
          <div
            className="modal-sheet"
            style={{ maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-handle" />
            <div
              style={{
                fontFamily: T.font,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Defesa — {selected.record_num}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
              Enviada em {selected.data_envio} por {selected.nome}
            </div>

            {/* Status badge */}
            {(() => {
              const s = statusCfg[selected.status] || statusCfg.pendente;
              return (
                <div
                  style={{
                    display: "inline-block",
                    background: s.bg,
                    color: s.color,
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 20,
                    marginBottom: 16,
                  }}
                >
                  {s.label}
                </div>
              );
            })()}

            {/* Info do documento fiscal */}
            {(() => {
              const rec = getRecord(selected);
              return (
                rec && (
                  <div
                    style={{
                      background: "#EFF6FF",
                      border: "1.5px solid #BAE6FD",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: T.accent,
                        fontWeight: 700,
                        letterSpacing: 1,
                        marginBottom: 10,
                        textTransform: "uppercase",
                      }}
                    >
                      📋 Documento Contestado
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px 12px",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <span style={{ color: T.muted, fontSize: 11 }}>
                          Tipo:{" "}
                        </span>
                        <strong>
                          {rec.type === "auto"
                            ? "Auto de Infração"
                            : "Notificação"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: T.muted, fontSize: 11 }}>
                          Nº:{" "}
                        </span>
                        <strong>{rec.num}</strong>
                      </div>
                      <div>
                        <span style={{ color: T.muted, fontSize: 11 }}>
                          Fiscal:{" "}
                        </span>
                        <strong>{rec.fiscal}</strong> Mat. {rec.matricula}
                      </div>
                      <div>
                        <span style={{ color: T.muted, fontSize: 11 }}>
                          Emitido:{" "}
                        </span>
                        <strong>{rec.date}</strong>
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <span style={{ color: T.muted, fontSize: 11 }}>
                          Endereço:{" "}
                        </span>
                        {rec.addr}
                      </div>
                      {rec.multa && (
                        <div
                          style={{
                            gridColumn: "1/-1",
                            color: "#B91C1C",
                            fontWeight: 700,
                          }}
                        >
                          Multa: R$ {rec.multa}
                        </div>
                      )}
                    </div>
                    {rec.infracoes?.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11 }}>
                        <div
                          style={{
                            color: T.muted,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          Infrações:
                        </div>
                        {rec.infracoes.map((inf, i) => (
                          <div
                            key={i}
                            style={{ marginLeft: 8, marginBottom: 2 }}
                          >
                            • {inf}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              );
            })()}

            {/* Info do contribuinte */}
            <div
              style={{
                background: T.bg,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Contribuinte
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {selected.nome}
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{selected.cpf}</div>
              {selected.email && (
                <div style={{ fontSize: 12, color: T.muted }}>
                  {selected.email}
                </div>
              )}
              {selected.telefone && (
                <div style={{ fontSize: 12, color: T.muted }}>
                  {selected.telefone}
                </div>
              )}
            </div>

            {/* Texto da defesa */}
            <div
              style={{
                background: T.bg,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Texto da Defesa
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: T.text,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selected.texto}
              </div>
            </div>

            {/* Argumentos / fundamentos */}
            {selected.fundamentos && (
              <div
                style={{
                  background: T.bg,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    fontWeight: 700,
                    letterSpacing: 1,
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Fundamentos
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {selected.fundamentos}
                </div>
              </div>
            )}

            {/* Fotos do Fiscal */}
            {(() => {
              const rec = getRecord(selected);
              return (
                rec?.fotoUrls?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.accent,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}
                    >
                      📷 Fotos da Fiscalização ({rec.fotoUrls.length})
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      {rec.fotoUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "block",
                            borderRadius: 10,
                            overflow: "hidden",
                            aspectRatio: "4/3",
                          }}
                        >
                          <img
                            src={url}
                            alt={`Foto fiscal ${i + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              );
            })()}

            {/* Fotos do Contribuinte (defesa) */}
            {selected.foto_urls?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: T.gold,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  📎 Documentos / Fotos do Contribuinte (
                  {selected.foto_urls.length})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {selected.foto_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        borderRadius: 10,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                      }}
                    >
                      <img
                        src={url}
                        alt={`Doc contribuinte ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Julgamento anterior */}
            {selected.status !== "pendente" && (
              <div
                style={{
                  background:
                    selected.status === "deferida" ? "#D1FAE5" : "#FEE2E2",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 14,
                  border: `1.5px solid ${
                    selected.status === "deferida" ? "#6EE7B7" : "#FCA5A5"
                  }`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    color:
                      selected.status === "deferida" ? "#166534" : "#B91C1C",
                  }}
                >
                  {selected.status === "deferida"
                    ? "✔ Deferida"
                    : "✕ Indeferida"}{" "}
                  por {selected.julgado_por} em {selected.julgado_em}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {selected.justificativa}
                </div>
              </div>
            )}

            {/* Julgar */}
            {selected.status === "pendente" && (
              <>
                {!showJulgar ? (
                  <button
                    onClick={() => setShowJulgar(true)}
                    style={{
                      width: "100%",
                      background: T.accent,
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                      padding: "14px 0",
                      fontSize: 15,
                      fontWeight: 800,
                      fontFamily: T.font,
                      cursor: "pointer",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    Julgar esta defesa
                  </button>
                ) : (
                  <div
                    style={{
                      background: T.bg,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      Julgamento
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {["deferida", "indeferida"].map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setJulgamento((j) => ({ ...j, veredicto: v }))
                          }
                          style={{
                            flex: 1,
                            padding: "10px 0",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: `2px solid ${
                              v === "deferida" ? "#166534" : "#B91C1C"
                            }`,
                            background:
                              julgamento.veredicto === v
                                ? v === "deferida"
                                  ? "#D1FAE5"
                                  : "#FEE2E2"
                                : "#fff",
                            color: v === "deferida" ? "#166534" : "#B91C1C",
                          }}
                        >
                          {v === "deferida" ? "✔ Deferida" : "✕ Indeferida"}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Justificativa da decisão (obrigatório)..."
                      value={julgamento.justificativa}
                      onChange={(e) =>
                        setJulgamento((j) => ({
                          ...j,
                          justificativa: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        minHeight: 80,
                        borderRadius: 10,
                        border: `1.5px solid ${T.border}`,
                        padding: 10,
                        fontSize: 13,
                        fontFamily: T.body,
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        onClick={handleJulgar}
                        style={{
                          flex: 2,
                          background: T.accent,
                          border: "none",
                          borderRadius: 10,
                          color: "#fff",
                          padding: "12px 0",
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: "pointer",
                          fontFamily: T.font,
                        }}
                      >
                        Confirmar Julgamento
                      </button>
                      <button
                        onClick={() => setShowJulgar(false)}
                        style={{
                          flex: 1,
                          background: "none",
                          border: `1.5px solid ${T.border}`,
                          borderRadius: 10,
                          color: T.muted,
                          padding: "12px 0",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => imprimirDefesaA4(selected, getRecord(selected))}
              style={{
                width: "100%",
                background: T.accent,
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                color: "#fff",
                marginTop: 4,
                fontFamily: T.font,
                letterSpacing: 1,
              }}
            >
              🖨️ Imprimir Defesa (A4)
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setShowJulgar(false);
              }}
              style={{
                width: "100%",
                background: "none",
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                color: T.muted,
                padding: "12px 0",
                fontSize: 14,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        Defesas
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
        Defesas enviadas pelos contribuintes pelo portal
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Pendentes",
            val: counts.pendente,
            color: "#F59E0B",
            bg: "#FEF3C7",
          },
          {
            label: "Deferidas",
            val: counts.deferida,
            color: "#166534",
            bg: "#D1FAE5",
          },
          {
            label: "Indeferidas",
            val: counts.indeferida,
            color: "#B91C1C",
            bg: "#FEE2E2",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 28,
                fontWeight: 800,
                color: s.color,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: s.color,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div
        style={{
          background: "#fff",
          border: `1.5px solid ${T.border}`,
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          style={{
            background: "none",
            border: "none",
            color: T.text,
            fontSize: 14,
            outline: "none",
            width: "100%",
          }}
          placeholder="Buscar por número, código ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="filter-row" style={{ marginBottom: 14 }}>
        {[
          { id: "todas", label: `Todas (${counts.todas})` },
          { id: "pendente", label: `Pendentes (${counts.pendente})` },
          { id: "deferida", label: `Deferidas (${counts.deferida})` },
          { id: "indeferida", label: `Indeferidas (${counts.indeferida})` },
        ].map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filtro === f.id ? "active" : ""}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <div style={{ fontSize: 14 }}>
            Nenhuma defesa{" "}
            {filtro !== "todas" ? "com este filtro" : "recebida ainda"}.
          </div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            As defesas aparecem aqui quando os contribuintes as enviam pelo
            portal.
          </div>
        </div>
      )}

      {filtradas.map((d) => {
        const s = statusCfg[d.status] || statusCfg.pendente;
        const rec = getRecord(d);
        return (
          <div
            key={d.id}
            onClick={() => {
              setSelected(d);
              setShowJulgar(false);
            }}
            style={{
              background: "#fff",
              border: `1.5px solid ${T.border}`,
              borderLeft: `4px solid ${s.color}`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div>
                <div
                  style={{ fontFamily: T.font, fontSize: 16, fontWeight: 800 }}
                >
                  {d.record_num}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  Código: {d.codigo}
                </div>
              </div>
              <div
                style={{
                  background: s.bg,
                  color: s.color,
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {s.label}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nome}</div>
            {rec && (
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                {rec.addr}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                color: T.muted,
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              {(d.texto || "").slice(0, 100)}
              {(d.texto || "").length > 100 ? "…" : ""}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 11, color: T.muted }}>{d.data_envio}</div>
              {d.status === "pendente" && (
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>
                  Aguardando julgamento
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ConfigScreen({ showToast }) {
  const [activeSection, setActiveSection] = useState("bairros");
  const [loading, setLoading] = useState(true);

  const [bairros, setBairros] = useState([]);
  const [infracoes, setInfracoes] = useState([]);
  const [configs, setConfigs] = useState({});
  const [prazos, setPrazos] = useState([]);

  const [novoBairro, setNovoBairro] = useState("");
  const [editBairro, setEditBairro] = useState(null);
  const [editInfracao, setEditInfracao] = useState(null);
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novaInfracao, setNovaInfracao] = useState(null);
  const [infTab, setInfTab] = useState("6.1");
  const [configEditando, setConfigEditando] = useState(null);
  const [configValores, setConfigValores] = useState({});

  // Helper: update por chave (configuracoes usa "chave" como PK, não "id")
  const updateByKey = async (table, keyCol, keyVal, data) => {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/${table}?${keyCol}=eq.${encodeURIComponent(keyVal)}`,
      {
        method: "PATCH",
        headers: { ...supa.headers, Prefer: "return=representation" },
        body: JSON.stringify(data),
      }
    );
    if (!r.ok) {
      console.error("updateByKey error:", await r.text());
      return null;
    }
    return r.json();
  };

  const load = async () => {
    setLoading(true);
    try {
      const [b, i, c, p] = await Promise.all([
        supa.get("bairros", "&order=ordem.asc"),
        supa.get("infracoes", "&order=ordem.asc"),
        supa.get("configuracoes"),
        supa.get("prazos_padrao", "&order=ordem.asc"),
      ]);
      setBairros(b || []);
      setInfracoes(i || []);
      const cfgMap = {};
      (c || []).forEach((r) => {
        cfgMap[r.chave] = r;
      });
      setConfigs(cfgMap);
      setConfigValores(
        Object.fromEntries((c || []).map((r) => [r.chave, r.valor]))
      );
      setPrazos(p || []);
    } catch (e) {
      console.error("Config load error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ─── BAIRROS ────────────────────────────────────────────
  const addBairro = async () => {
    const nome = novoBairro.trim();
    if (!nome) return;
    const id = `b_${Date.now()}`;
    const maxOrdem = bairros.reduce((m, b) => Math.max(m, b.ordem || 0), 0);
    await supa.insert("bairros", {
      id,
      nome,
      ativo: true,
      ordem: maxOrdem + 1,
    });
    setNovoBairro("");
    showToast && showToast(`Bairro "${nome}" adicionado`);
    load();
  };
  const updateBairro = async (id, dados) => {
    await supa.update("bairros", id, dados);
    load();
  };
  const deleteBairro = async (id, nome) => {
    if (!confirm(`Remover o bairro "${nome}"?`)) return;
    await supa.delete("bairros", id);
    showToast && showToast(`Bairro "${nome}" removido`);
    load();
  };

  // ─── INFRAÇÕES ──────────────────────────────────────────
  const saveInfracao = async (inf) => {
    if (inf._isNew) {
      const id = `i-${inf.codigo}`;
      const maxOrdem = infracoes
        .filter((x) => x.quadro === inf.quadro)
        .reduce((m, x) => Math.max(m, x.ordem || 0), 0);
      await supa.insert("infracoes", {
        id,
        quadro: inf.quadro,
        codigo: inf.codigo,
        descricao: inf.descricao,
        penalidade: inf.penalidade,
        valor: Number(inf.valor) || 0,
        ativo: true,
        ordem: maxOrdem + 1,
      });
      showToast && showToast("Infração adicionada");
    } else {
      await supa.update("infracoes", inf.id, {
        codigo: inf.codigo,
        descricao: inf.descricao,
        penalidade: inf.penalidade,
        valor: Number(inf.valor) || 0,
        ativo: inf.ativo,
      });
      showToast && showToast("Infração atualizada");
    }
    setEditInfracao(null);
    setNovaInfracao(null);
    load();
  };

  // ─── CONFIGURAÇÕES (usa chave, não id) ──────────────────
  const saveConfig = async (chave) => {
    const valor = configValores[chave];
    if (valor === undefined) return;
    await updateByKey("configuracoes", "chave", chave, {
      valor,
      updated_at: new Date().toISOString(),
    });
    showToast && showToast("Configuração salva");
    setConfigEditando(null);
    load();
  };

  // ─── PRAZOS ─────────────────────────────────────────────
  const addPrazo = async () => {
    const dias = parseInt(novoPrazo);
    if (!dias || dias < 1) return;
    const id = `p_${Date.now()}`;
    const maxOrdem = prazos.reduce((m, p) => Math.max(m, p.ordem || 0), 0);
    await supa.insert("prazos_padrao", {
      id,
      dias,
      label: `${dias} dia${dias > 1 ? "s" : ""}`,
      tipo: "notif",
      ativo: true,
      ordem: maxOrdem + 1,
    });
    setNovoPrazo("");
    showToast && showToast(`Prazo de ${dias} dias adicionado`);
    load();
  };
  const deletePrazo = async (id) => {
    await supa.delete("prazos_padrao", id);
    load();
  };

  // ─── STYLES ─────────────────────────────────────────────
  const S = {
    card: {
      background: "#fff",
      border: `2px solid ${T.border}`,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: T.font,
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: T.accent,
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: `2px solid ${T.border}`,
    },
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: `2px solid ${T.border}`,
      fontSize: 14,
      fontFamily: T.body,
      outline: "none",
      color: T.text,
      background: "#fff",
    },
    btnPrimary: {
      background: T.accent,
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "10px 20px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: T.font,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    btnDanger: {
      background: "#FEE2E2",
      color: T.danger,
      border: `1.5px solid #FCA5A5`,
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
    },
    btnGhost: {
      background: "none",
      color: T.accent,
      border: `1.5px solid ${T.accent}`,
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
    },
    tab: (active) => ({
      padding: "10px 16px",
      borderRadius: 10,
      border: `2px solid ${active ? T.accent : T.border}`,
      background: active ? "#EBF5FF" : "#fff",
      color: active ? T.accent : T.muted,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      fontFamily: T.font,
      whiteSpace: "nowrap",
    }),
    listItem: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 0",
      borderBottom: `1px solid ${T.border}`,
    },
  };

  const sections = [
    { id: "bairros", label: "Bairros", emoji: "🏘️" },
    { id: "infracoes", label: "Infrações", emoji: "⚖️" },
    { id: "prazos", label: "Prazos", emoji: "📅" },
    { id: "textos", label: "Textos", emoji: "📝" },
    { id: "institucional", label: "Institucional", emoji: "🏛️" },
  ];

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
        Carregando configurações...
      </div>
    );

  return (
    <div className="admin-screen">
      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        Configurações do Sistema
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
        Gerencie bairros, infrações, prazos e textos sem alterar o código.
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            style={S.tab(activeSection === s.id)}
            onClick={() => setActiveSection(s.id)}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* ═══ BAIRROS ═══ */}
      {activeSection === "bairros" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>
            Bairros Cadastrados (
            {bairros.filter((b) => b.ativo !== false).length})
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder="Nome do novo bairro"
              value={novoBairro}
              onChange={(e) => setNovoBairro(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBairro()}
            />
            <button style={S.btnPrimary} onClick={addBairro}>
              + Adicionar
            </button>
          </div>
          {bairros.map((b) => (
            <div key={b.id} style={S.listItem}>
              {editBairro === b.id ? (
                <input
                  style={{ ...S.input, flex: 1 }}
                  defaultValue={b.nome}
                  autoFocus
                  onBlur={(e) => {
                    updateBairro(b.id, { nome: e.target.value });
                    setEditBairro(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateBairro(b.id, { nome: e.target.value });
                      setEditBairro(null);
                    }
                  }}
                />
              ) : (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: b.ativo !== false ? T.text : T.muted,
                      textDecoration:
                        b.ativo === false ? "line-through" : "none",
                    }}
                  >
                    {b.nome}
                  </span>
                  <button
                    style={S.btnGhost}
                    onClick={() => setEditBairro(b.id)}
                  >
                    Editar
                  </button>
                  <button
                    style={{
                      ...S.btnGhost,
                      color: b.ativo !== false ? T.success : T.muted,
                      borderColor: b.ativo !== false ? T.success : T.muted,
                    }}
                    onClick={() =>
                      updateBairro(b.id, { ativo: b.ativo === false })
                    }
                  >
                    {b.ativo !== false ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    style={S.btnDanger}
                    onClick={() => deleteBairro(b.id, b.nome)}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ INFRAÇÕES ═══ */}
      {activeSection === "infracoes" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Infrações — Lei nº 1.481/2007</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              style={S.tab(infTab === "6.1")}
              onClick={() => setInfTab("6.1")}
            >
              Quadro 6.1 — Obras
            </button>
            <button
              style={S.tab(infTab === "6.2")}
              onClick={() => setInfTab("6.2")}
            >
              Quadro 6.2 — Urbanização
            </button>
          </div>
          <button
            style={{ ...S.btnPrimary, marginBottom: 16, width: "100%" }}
            onClick={() =>
              setNovaInfracao({
                _isNew: true,
                quadro: infTab,
                codigo: "",
                descricao: "",
                penalidade: "",
                valor: "",
              })
            }
          >
            + Nova Infração no Quadro {infTab}
          </button>
          {(editInfracao || novaInfracao) && (
            <div
              style={{
                background: "#F8FAFC",
                border: `2px solid ${T.accent}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.accent,
                  marginBottom: 12,
                }}
              >
                {novaInfracao
                  ? "Nova Infração"
                  : `Editando ${editInfracao.codigo}`}
              </div>
              {[
                {
                  key: "codigo",
                  label: "Código (ex: 6.1.32)",
                  placeholder: "6.1.32",
                },
                {
                  key: "descricao",
                  label: "Descrição da infração",
                  placeholder: "Descrição completa",
                },
                {
                  key: "penalidade",
                  label: "Penalidade (artigos)",
                  placeholder: "Art. 137, I,II",
                },
                {
                  key: "valor",
                  label: "Valor da multa (R$)",
                  placeholder: "0.00",
                  type: "number",
                },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    style={S.input}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={(novaInfracao || editInfracao)[f.key] || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (novaInfracao)
                        setNovaInfracao((p) => ({ ...p, [f.key]: v }));
                      else setEditInfracao((p) => ({ ...p, [f.key]: v }));
                    }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={S.btnPrimary}
                  onClick={() => saveInfracao(novaInfracao || editInfracao)}
                >
                  Salvar
                </button>
                <button
                  style={S.btnGhost}
                  onClick={() => {
                    setEditInfracao(null);
                    setNovaInfracao(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {infracoes
            .filter((i) => i.quadro === infTab)
            .map((inf) => (
              <div key={inf.id} style={{ ...S.listItem, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div
                    style={{ fontSize: 12, fontWeight: 800, color: T.accent }}
                  >
                    {inf.codigo}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.text,
                      lineHeight: 1.4,
                      marginTop: 2,
                    }}
                  >
                    {inf.descricao}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {inf.penalidade}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: T.font,
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.danger,
                    whiteSpace: "nowrap",
                  }}
                >
                  R${" "}
                  {Number(inf.valor).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <button
                  style={S.btnGhost}
                  onClick={() => setEditInfracao({ ...inf })}
                >
                  Editar
                </button>
              </div>
            ))}
        </div>
      )}

      {/* ═══ PRAZOS ═══ */}
      {activeSection === "prazos" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Prazos Padrão</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Opções de prazo no formulário de notificação.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              style={{ ...S.input, width: 120 }}
              type="number"
              min="1"
              placeholder="Dias"
              value={novoPrazo}
              onChange={(e) => setNovoPrazo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPrazo()}
            />
            <button style={S.btnPrimary} onClick={addPrazo}>
              + Adicionar prazo
            </button>
          </div>
          {prazos.map((p) => (
            <div key={p.id} style={S.listItem}>
              <span style={{ flex: 1, fontSize: 14 }}>
                {p.label} ({p.tipo})
              </span>
              <button style={S.btnDanger} onClick={() => deletePrazo(p.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TEXTOS DOS DOCUMENTOS ═══ */}
      {activeSection === "textos" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Textos dos Documentos</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Edite os textos que aparecem nos documentos impressos.
          </div>
          {[
            "texto_notif_cabecalho",
            "texto_auto_cabecalho",
            "texto_notif_rodape",
            "texto_auto_rodape",
            "texto_embargo",
          ].map((chave) => {
            const cfg = configs[chave];
            if (!cfg) return null;
            const editing = configEditando === chave;
            return (
              <div
                key={chave}
                style={{
                  marginBottom: 14,
                  padding: 14,
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.accent,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {cfg.descricao}
                </div>
                {editing ? (
                  <div>
                    <textarea
                      style={{ ...S.input, minHeight: 80, resize: "vertical" }}
                      value={configValores[chave] || ""}
                      onChange={(e) =>
                        setConfigValores((p) => ({
                          ...p,
                          [chave]: e.target.value,
                        }))
                      }
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        style={S.btnPrimary}
                        onClick={() => saveConfig(chave)}
                      >
                        Salvar
                      </button>
                      <button
                        style={S.btnGhost}
                        onClick={() => {
                          setConfigEditando(null);
                          setConfigValores((p) => ({
                            ...p,
                            [chave]: cfg.valor,
                          }));
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: T.text,
                        lineHeight: 1.5,
                      }}
                    >
                      {cfg.valor}
                    </div>
                    <button
                      style={S.btnGhost}
                      onClick={() => setConfigEditando(chave)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ INSTITUCIONAL ═══ */}
      {activeSection === "institucional" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Dados Institucionais</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Nomes que aparecem no cabeçalho e nos documentos.
          </div>
          {[
            "prefeitura",
            "secretaria",
            "gerencia",
            "lei_referencia",
            "portal_url",
          ].map((chave) => {
            const cfg = configs[chave];
            if (!cfg) return null;
            const editing = configEditando === chave;
            return (
              <div key={chave} style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {cfg.descricao}
                </label>
                {editing ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...S.input, flex: 1 }}
                      value={configValores[chave] || ""}
                      onChange={(e) =>
                        setConfigValores((p) => ({
                          ...p,
                          [chave]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveConfig(chave);
                      }}
                    />
                    <button
                      style={S.btnPrimary}
                      onClick={() => saveConfig(chave)}
                    >
                      Salvar
                    </button>
                    <button
                      style={S.btnGhost}
                      onClick={() => {
                        setConfigEditando(null);
                        setConfigValores((p) => ({ ...p, [chave]: cfg.valor }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 14, color: T.text }}>
                      {cfg.valor}
                    </span>
                    <button
                      style={S.btnGhost}
                      onClick={() => setConfigEditando(chave)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
//  FISCON — SPRINT 2: AuditoriaScreen
//
//  Cole ANTES da linha "// --- App ---" no Fiscon.jsx
//  (mesmo lugar onde colou o ConfigScreen)
// ═══════════════════════════════════════════════════════════════


function AuditoriaScreen({ logs, records, user }) {
  const [tab, setTab] = useState("log");
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("all");
  const [historico, setHistorico] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordSel, setRecordSel] = useState(null);

  // Carregar histórico e sessões
  const loadAuditoria = async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([
        supa.get("historico_registros", "&order=created_at.desc&limit=200"),
        supa.get("sessoes", "&order=ultimo_ping.desc"),
      ]);
      setHistorico(h || []);
      setSessoes(s || []);
    } catch (e) {
      console.error("Auditoria load:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAuditoria();
  }, []);

  // Ping de presença (registra que o fiscal está online)
  useEffect(() => {
    if (!user?.id) return;
    const ping = async () => {
      const payload = {
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        matricula: user.matricula || "",
        ultimo_ping: new Date().toISOString(),
        online: true,
      };
      // Upsert: insere ou atualiza
      await fetch(`${SUPA_URL}/rest/v1/sessoes`, {
        method: "POST",
        headers: {
          ...supa.headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });
    };
    ping();
    const interval = setInterval(ping, 30000); // ping a cada 30s
    return () => clearInterval(interval);
  }, [user?.id]);

  // Filtrar logs
  const logsFiltrados = (logs || []).filter((l) => {
    if (busca) {
      const q = busca.toLowerCase();
      if (
        !l.acao?.toLowerCase().includes(q) &&
        !l.detalhe?.toLowerCase().includes(q) &&
        !l.autor?.toLowerCase().includes(q)
      )
        return false;
    }
    if (filtroAcao !== "all" && l.acao !== filtroAcao) return false;
    return true;
  });

  // Ações únicas para filtro
  const acoesUnicas = [
    ...new Set((logs || []).map((l) => l.acao).filter(Boolean)),
  ];

  // Histórico de um registro específico
  const histRegistro = recordSel
    ? historico.filter(
        (h) => h.record_id === recordSel.id || h.record_num === recordSel.num
      )
    : [];

  // Sessões: quem está online (pingou nos últimos 2 minutos)
  const agora = Date.now();
  const sessoesOnline = sessoes.filter((s) => {
    const diff = agora - new Date(s.ultimo_ping).getTime();
    return diff < 120000; // 2 minutos
  });
  const sessoesOffline = sessoes.filter((s) => {
    const diff = agora - new Date(s.ultimo_ping).getTime();
    return diff >= 120000;
  });

  const S = {
    card: {
      background: "#fff",
      border: `2px solid ${T.border}`,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
    },
    tab: (active) => ({
      padding: "10px 18px",
      borderRadius: 10,
      border: `2px solid ${active ? T.accent : T.border}`,
      background: active ? "#EBF5FF" : "#fff",
      color: active ? T.accent : T.muted,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      fontFamily: T.font,
      whiteSpace: "nowrap",
    }),
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: `2px solid ${T.border}`,
      fontSize: 14,
      fontFamily: T.body,
      outline: "none",
      color: T.text,
      background: "#fff",
    },
  };

  const roleColors = {
    admin: T.danger,
    supervisor: T.gold,
    fiscal: T.accent,
    atendente: T.success,
  };
  const roleLabels = {
    admin: "Gerência",
    supervisor: "Supervisão",
    fiscal: "Fiscal",
    atendente: "Atendimento",
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("pt-BR");
    } catch {
      return d;
    }
  };

  return (
    <div className="admin-screen">
      <div
        style={{
          fontFamily: T.font,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        Auditoria do Sistema
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
        Log completo, histórico de registros e fiscais online.
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        <button style={S.tab(tab === "log")} onClick={() => setTab("log")}>
          📋 Log Geral
        </button>
        <button
          style={S.tab(tab === "timeline")}
          onClick={() => setTab("timeline")}
        >
          🕐 Timeline por Registro
        </button>
        <button
          style={S.tab(tab === "online")}
          onClick={() => setTab("online")}
        >
          🟢 Fiscais Online ({sessoesOnline.length})
        </button>
      </div>

      {/* ═══ LOG GERAL ═══ */}
      {tab === "log" && (
        <div>
          {/* Busca + Filtro */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                style={S.input}
                placeholder="Buscar no log (ação, detalhe, autor)..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <select
              style={{ ...S.input, width: "auto", minWidth: 150 }}
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
            >
              <option value="all">Todas as ações</option>
              {acoesUnicas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
            {logsFiltrados.length} registro(s) encontrado(s)
          </div>

          {/* Lista */}
          <div style={S.card}>
            {logsFiltrados.length === 0 && (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                Nenhum registro encontrado.
              </div>
            )}
            {logsFiltrados.slice(0, 100).map((l, i) => (
              <div
                key={l.id || i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  alignItems: "flex-start",
                  borderBottom:
                    i < logsFiltrados.length - 1
                      ? `1px solid ${T.border}`
                      : "none",
                }}
              >
                {/* Ícone da ação */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background:
                      l.acao === "Login"
                        ? "#EBF5FF"
                        : l.acao?.includes("Cancel")
                        ? "#FEE2E2"
                        : l.acao?.includes("Registr")
                        ? "#FEF3C7"
                        : l.acao?.includes("Status")
                        ? "#D1FAE5"
                        : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  {l.acao === "Login"
                    ? "🔑"
                    : l.acao?.includes("Cancel")
                    ? "🚫"
                    : l.acao?.includes("Registr")
                    ? "📝"
                    : l.acao?.includes("Status")
                    ? "🔄"
                    : "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: T.text }}
                    >
                      {l.acao}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: T.muted,
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {l.ts}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.muted,
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {l.detalhe}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.accent,
                      fontWeight: 600,
                      marginTop: 3,
                    }}
                  >
                    {l.autor}
                  </div>
                </div>
              </div>
            ))}
            {logsFiltrados.length > 100 && (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  color: T.muted,
                  fontSize: 12,
                }}
              >
                Mostrando 100 de {logsFiltrados.length} registros
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TIMELINE POR REGISTRO ═══ */}
      {tab === "timeline" && (
        <div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Selecione um registro para ver o histórico completo de alterações.
          </div>

          {/* Seletor de registro */}
          <div style={{ marginBottom: 16 }}>
            <select
              style={S.input}
              value={recordSel?.id || ""}
              onChange={(e) => {
                const r = records.find((x) => x.id === e.target.value);
                setRecordSel(r || null);
              }}
            >
              <option value="">Selecione um registro...</option>
              {(records || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.num} — {r.owner} ({r.status})
                </option>
              ))}
            </select>
          </div>

          {recordSel && (
            <div style={S.card}>
              {/* Cabeçalho do registro */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: `2px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontFamily: T.font,
                    fontSize: 12,
                    fontWeight: 800,
                    background:
                      recordSel.type === "auto" ? "#FEE2E2" : "#FEF3C7",
                    color: recordSel.type === "auto" ? T.danger : T.gold,
                  }}
                >
                  {recordSel.type === "auto" ? "AUTO" : "NOTIF."}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: T.font,
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {recordSel.num}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {recordSel.owner} · {recordSel.date} · {recordSel.fiscal}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      background:
                        recordSel.status === "Pendente"
                          ? "#FEF3C7"
                          : recordSel.status === "Regularizado"
                          ? "#D1FAE5"
                          : recordSel.status === "Embargado"
                          ? "#FEE2E2"
                          : "#F3F4F6",
                      color:
                        recordSel.status === "Pendente"
                          ? T.gold
                          : recordSel.status === "Regularizado"
                          ? T.success
                          : recordSel.status === "Embargado"
                          ? T.danger
                          : T.muted,
                    }}
                  >
                    {recordSel.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              {histRegistro.length === 0 ? (
                <div
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: T.muted,
                    fontSize: 13,
                  }}
                >
                  Nenhuma alteração registrada para este documento.
                  <div style={{ fontSize: 11, marginTop: 8, color: T.muted }}>
                    O histórico será gravado a partir de agora para novas ações.
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  {/* Linha vertical */}
                  <div
                    style={{
                      position: "absolute",
                      left: 7,
                      top: 4,
                      bottom: 4,
                      width: 2,
                      background: T.border,
                    }}
                  />

                  {histRegistro.map((h, i) => (
                    <div
                      key={h.id}
                      style={{ position: "relative", paddingBottom: 20 }}
                    >
                      {/* Bolinha */}
                      <div
                        style={{
                          position: "absolute",
                          left: -20,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: i === 0 ? T.accent : T.border,
                          border: `2px solid ${i === 0 ? T.accent : T.border}`,
                        }}
                      />

                      <div
                        style={{
                          fontSize: 10,
                          color: T.muted,
                          marginBottom: 4,
                        }}
                      >
                        {formatDate(h.created_at)}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: T.text,
                          marginBottom: 2,
                        }}
                      >
                        {h.acao}
                      </div>
                      {h.campo && (
                        <div style={{ fontSize: 12, color: T.muted }}>
                          Campo:{" "}
                          <strong style={{ color: T.text }}>{h.campo}</strong>
                          {h.valor_antes && (
                            <>
                              {" "}
                              · De:{" "}
                              <span
                                style={{
                                  color: T.danger,
                                  textDecoration: "line-through",
                                }}
                              >
                                {h.valor_antes}
                              </span>
                            </>
                          )}
                          {h.valor_depois && (
                            <>
                              {" "}
                              · Para:{" "}
                              <span style={{ color: T.success }}>
                                {h.valor_depois}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 11,
                          color: T.accent,
                          fontWeight: 600,
                          marginTop: 3,
                        }}
                      >
                        {h.autor}{" "}
                        {h.autor_matricula ? `(Mat. ${h.autor_matricula})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ FISCAIS ONLINE ═══ */}
      {tab === "online" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <button
              style={{
                background: T.accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: T.font,
              }}
              onClick={loadAuditoria}
            >
              🔄 Atualizar
            </button>
            <span style={{ fontSize: 12, color: T.muted }}>
              {sessoesOnline.length} online agora · {sessoesOffline.length}{" "}
              offline
            </span>
          </div>

          {/* Online */}
          {sessoesOnline.length > 0 && (
            <div
              style={{
                ...S.card,
                border: `2px solid ${T.success}`,
                background: "#F0FDF4",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.success,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: T.success,
                    animation: "pulse 2s infinite",
                  }}
                />
                Online Agora ({sessoesOnline.length})
              </div>
              {sessoesOnline.map((s) => (
                <div
                  key={s.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: `1px solid #BBF7D0`,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${roleColors[s.user_role] || T.accent}18`,
                      border: `2px solid ${
                        roleColors[s.user_role] || T.accent
                      }40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 14,
                      color: roleColors[s.user_role] || T.accent,
                    }}
                  >
                    {s.user_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: T.text }}
                    >
                      {s.user_name}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      Mat. {s.matricula} ·{" "}
                      {roleLabels[s.user_role] || s.user_role}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#D1FAE5",
                        color: T.success,
                        border: "1px solid #6EE7B7",
                      }}
                    >
                      🟢 Online
                    </span>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
                      Ping: {formatDate(s.ultimo_ping)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Offline */}
          {sessoesOffline.length > 0 && (
            <div style={S.card}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.muted,
                  marginBottom: 12,
                }}
              >
                Offline ({sessoesOffline.length})
              </div>
              {sessoesOffline.map((s) => (
                <div
                  key={s.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      color: T.muted,
                    }}
                  >
                    {s.user_name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: T.muted }}
                    >
                      {s.user_name}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      Mat. {s.matricula}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted }}>
                    Último: {formatDate(s.ultimo_ping)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sessoesOnline.length === 0 && sessoesOffline.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 14, color: T.muted }}>
                Nenhuma sessão registrada ainda.
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                Os fiscais aparecerão aqui ao fazer login.
              </div>
            </div>
          )}

          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      )}
    </div>
  );
}


export { Dashboard, FormScreen, PrazosScreen, RegistrosScreen, HistoryScreen, ConfirmDeleteModal, UserFormModal, PerfilModal, RelatorioAvancado, AdministracaoScreen, AdminScreen, ReclamacaoModal, NovaReclamacaoScreen, ReclamacoesScreen, LogScreen, DefesasScreen, ConfigScreen, AuditoriaScreen };
