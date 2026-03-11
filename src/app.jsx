import React from "react";
// ═══════════════════════════════════════════════════
//  FISCON — App Principal
// ═══════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from "react";
import { T, css, Icon, maskMatricula, calcPrazo, SUPA_URL, SUPA_KEY, PORTAL_URL, supa, ADMIN_MASTER, BRASAO_DATA } from "./config.jsx";
import { DocPreview, imprimirTermica, gerarPDFA4 } from "./Impressao";
import { Dashboard, FormScreen, PrazosScreen, RegistrosScreen, HistoryScreen, PerfilModal, RelatorioAvancado, AdministracaoScreen, AdminScreen, ReclamacoesScreen, LogScreen, DefesasScreen, ConfigScreen, AuditoriaScreen, NovaReclamacaoScreen } from "./Screens";

// --- App ----------------------------------------------------------------------
export default function App() {
  const [loading, setLoading] = useState(true);
  // Portal do Cidadão: se URL tem ?codigo=XXX, abre direto o documento A4
  const [portalCodigo, setPortalCodigo] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("codigo") || null;
    } catch {
      return null;
    }
  });
  const [usuarios, setUsuarios] = useState([]);
  const [records, setRecords] = useState([]);
  const [reclamacoes, setReclamacoes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cancelPending, setCancelPending] = useState([]);
  const [defesas, setDefesas] = useState([]);
  const [screen, setScreen] = useState("login");
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [registrosFiltro, setRegistrosFiltro] = useState({
    tipo: "all",
    status: "all",
  });
  const [showPerfil, setShowPerfil] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // -- Carregar todos os dados do Supabase -----------------------------------
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [u, r, rec, l, cp, def] = await Promise.all([
        supa.get("usuarios_seguros"),
        supa.get("records"),
        supa.get("reclamacoes"),
        supa.get("logs", "&limit=500"),
        supa.get("cancel_pending"),
        supa.get("defesas"),
      ]);
      setUsuarios(u || []);
      setRecords((r || []).map(mapRecord));
      setReclamacoes((rec || []).map(mapReclamacao));
      setLogs(l || []);
      setCancelPending((cp || []).map(mapCancelPending));
      setDefesas(def || []);
    } catch (e) {
      console.error("loadAll error:", e);
    }
    if (!silent) setLoading(false);
  }, []);

  // Carrega ao iniciar e depois a cada 30 segundos silenciosamente
  // Pausa quando a aba está em background para economizar requests
  useEffect(() => {
    loadAll();
    let interval = setInterval(() => loadAll(true), 30000);
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
        interval = null;
      } else {
        loadAll(true);
        interval = setInterval(() => loadAll(true), 30000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
  // Ping de presença — registra que o usuário está online
  useEffect(() => {
    if (!user?.id || screen !== "main") return;
    const ping = async () => {
      await fetch(`${SUPA_URL}/rest/v1/sessoes`, {
        method: "POST",
        headers: {
          ...supa.headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          matricula: user.matricula || "",
          ultimo_ping: new Date().toISOString(),
          online: true,
        }),
      });
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [user?.id, screen]);
  // -- Mapeadores: banco ? app ------------------------------------------------
  const mapRecord = (r) => ({
    id: r.id,
    num: r.num,
    type: r.type,
    owner: r.owner,
    addr: r.addr,
    bairro: r.bairro,
    loteamento: r.loteamento,
    cpf: r.cpf,
    date: r.date,
    fiscal: r.fiscal,
    matricula: r.matricula,
    status: r.status,
    multa: r.multa,
    prazo: r.prazo,
    infracoes: r.infracoes || [],
    descricao: r.descricao,
    motivoCancel: r.motivo_cancel,
    canceladoEm: r.cancelado_em,
    _notifId: r.notif_id,
    _notifNum: r.notif_num,
    codigoAcesso: r.codigo_acesso || "",
    fotoUrls: r.foto_urls || [],
  });

  const mapReclamacao = (r) => ({
    id: r.id,
    num: r.num,
    status: r.status,
    reclamante: r.reclamante,
    contato: r.contato,
    reclamado: r.reclamado,
    endereco: r.endereco,
    bairro: r.bairro,
    descricao: r.descricao,
    fiscal: r.fiscal,
    parecer: r.parecer,
    parecerStatus: r.parecer_status,
    parecerData: r.parecer_data,
    data: r.data,
  });

  const mapCancelPending = (r) => ({
    id: r.id,
    recordId: r.record_id,
    recordNum: r.record_num,
    recordOwner: r.record_owner,
    recordFiscal: r.record_fiscal,
    motivo: r.motivo,
    solicitadoPor: r.solicitado_por,
    data: r.data,
  });

  // -- addLog -----------------------------------------------------------------
  const addLog = useCallback(async (acao, detalhe, autor) => {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toLocaleString("pt-BR"),
      acao,
      detalhe,
      autor: autor || "Sistema",
    };
    setLogs((prev) => [entry, ...prev].slice(0, 500));
    await supa.insert("logs", entry);
  }, []);

  // -- setRecordsGlobal — atualiza localmente e sincroniza no Supabase ---------
  const setRecordsGlobal = useCallback((updater) => {
    setRecords((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Encontrar registros alterados e salvar no banco
      next.forEach((r) => {
        const old = prev.find((o) => o.id === r.id);
        if (
          old &&
          (old.status !== r.status || old.motivoCancel !== r.motivoCancel)
        ) {
          supa.update("records", r.id, {
            status: r.status,
            motivo_cancel: r.motivoCancel || "",
            cancelado_em: r.canceladoEm || "",
          });
        }
      });
      return next;
    });
  }, []);

  // -- setReclamacoesGlobal — atualiza localmente e sincroniza no Supabase ----
  const setReclamacoesGlobal = useCallback((updater) => {
    setReclamacoes((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach((r) => {
        const old = prev.find((o) => o.id === r.id);
        if (old && JSON.stringify(old) !== JSON.stringify(r)) {
          supa.update("reclamacoes", r.id, {
            status: r.status,
            fiscal: r.fiscal || "",
            parecer: r.parecer || "",
            parecer_status: r.parecerStatus || "",
            parecer_data: r.parecerData || "",
          });
        }
      });
      return next;
    });
  }, []);

  // -- setCancelPendingGlobal -------------------------------------------------
  const setCancelPendingGlobal = useCallback((updater) => {
    setCancelPending((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // adições
      next.forEach((cp) => {
        if (!prev.find((o) => o.id === cp.id)) {
          supa.insert("cancel_pending", {
            id: String(cp.id),
            record_id: String(cp.recordId),
            record_num: cp.recordNum,
            record_owner: cp.recordOwner,
            record_fiscal: cp.recordFiscal,
            motivo: cp.motivo,
            solicitado_por: cp.solicitadoPor,
            data: cp.data,
          });
        }
      });
      // remoções
      prev.forEach((cp) => {
        if (!next.find((n) => n.id === cp.id))
          supa.delete("cancel_pending", cp.id);
      });
      return next;
    });
  }, []);

  // -- Login (via RPC com hash no servidor) -----------------------------------
  const handleLogin = async () => {
    const login = (loginData.login || "").trim();
    const senha = (loginData.password || "").trim();
    setLoginError("");
    if (!login || !senha) {
      setLoginError("Preencha login e senha.");
      return;
    }

    // Admin master (credencial configurável — apenas emergência)
    if (login.toLowerCase() === "admin" && senha === ADMIN_MASTER.senha) {
      setUser({ ...ADMIN_MASTER });
      setScreen("main");
      setTab("home");
      addLog(
        "Login",
        "Administrador Master — acesso de emergência",
        "Administrador"
      );
      return;
    }

    // Autenticação segura via RPC (hash verificado no servidor)
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/rpc/autenticar_usuario`, {
        method: "POST",
        headers: supa.headers,
        body: JSON.stringify({ p_matricula: login, p_senha: senha }),
      });
      const result = await r.json();

      if (result?.error) {
        setLoginError(result.error);
        return;
      }

      if (result?.success) {
        const found = {
          id: result.id,
          name: result.name,
          matricula: result.matricula,
          role: result.role,
          email: result.email,
          telefone: result.telefone,
          endereco: result.endereco,
          bairros: result.bairros || [],
          ativo: result.ativo,
        };
        setUser(found);
        setScreen("main");
        const tab_ =
          {
            atendente: "reclamacoes",
            supervisor: "administracao",
            admin: "admin",
          }[found.role] || "home";
        const rlLabel = {
          admin: "Gerência",
          supervisor: "Administração",
          fiscal: "Fiscal",
          atendente: "Balcão",
        };
        addLog(
          "Login",
          `${found.name} (Mat. ${found.matricula}) — perfil: ${
            rlLabel[found.role] || found.role
          }`,
          found.name
        );
        setTab(tab_);
        return;
      }

      setLoginError("Erro inesperado. Tente novamente.");
    } catch (e) {
      console.error("Login error:", e);
      setLoginError("Falha de conexão. Verifique sua internet.");
    }
  };

  // -- handlePreview ----------------------------------------------------------
  const handlePreview = (type, data) => {
    const prefix = type === "auto" ? "AI" : "NP";
    const existing = records.filter((r) => r.type === type).length;
    const seq = String(existing + 1).padStart(4, "0");
    const num = `${prefix}-${seq}/${new Date().getFullYear()}`;
    // Gera o código de acesso já no preview — aparece no QR Code e no doc
    const codigoPreview =
      num.replace(/[^A-Z0-9]/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    setPreview({
      type,
      data: {
        ...data,
        num,
        fiscal: data.fiscal || user?.name,
        matricula: data.matricula || user?.matricula,
        codigoAcesso: codigoPreview,
        photos: data.photos || [],
      },
    });
  };

  // -- handleSaveRecord — salva no Supabase -----------------------------------
  const handleSaveRecord = async () => {
    if (!preview) return;
    const { type, data } = preview;
    const tipoLabel = type === "auto" ? "Auto de Infração" : "Notificação";
    // Reutiliza o código gerado no preview (já exibido no QR Code)
    const ts = Date.now();
    const codigoAcesso =
      data.codigoAcesso ||
      data.num.replace(/[^A-Z0-9]/g, "") +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();

    // Upload das fotos antes de salvar o registro
    let fotoUrls = [];
    const fotosPendentes = (data.photos || []).filter(Boolean);
    if (fotosPendentes.length > 0) {
      showToast("Enviando fotos...");
      const pasta = `records/${codigoAcesso}`;
      const uploaded = await Promise.all(
        fotosPendentes.map((slot) => supa.uploadFoto(slot.file, pasta))
      );
      fotoUrls = uploaded.filter(Boolean);
    }

    const newRecord = {
      id: String(ts),
      num: data.num,
      type,
      owner: data.proprietario || "—",
      addr: `${data.endereco || ""}${data.bairro ? ", " + data.bairro : ""}`,
      bairro: data.bairro || "",
      loteamento: data.loteamento || "",
      cpf: data.cpf || "",
      date: new Date().toLocaleDateString("pt-BR"),
      fiscal: data.fiscal || user?.name || "—",
      matricula: data.matricula || user?.matricula || "—",
      status: "Pendente",
      multa: type === "auto" ? data.multa || "" : "",
      prazo: data.prazo || "1",
      infracoes: data.infracoes || [],
      descricao: data.descricao || "",
      motivo_cancel: "",
      cancelado_em: "",
      notif_id: data._notifId || "",
      notif_num: data._notifNum || "",
      codigo_acesso: codigoAcesso,
      foto_urls: fotoUrls,
    };
    const saved = await supa.insert("records", newRecord);
    if (saved) {
      setRecords((prev) => [...prev, mapRecord(saved)]);
      addLog(
        `${tipoLabel} emitido`,
        `${data.num} — ${data.proprietario || "—"} — Fiscal: ${data.fiscal}`,
        data.fiscal
      );
      showToast(
        `${type === "auto" ? "Auto" : "Notificação"} ${data.num} registrado!`
      );
    } else {
      showToast({
        msg: `Erro ao salvar ${data.num}. Verifique a conexão e tente novamente.`,
        type: "error",
      });
      console.error(
        "handleSaveRecord: insert retornou null. Payload:",
        JSON.stringify(newRecord)
      );
      return; // não fecha o preview para o fiscal poder tentar novamente
    }
    setPreview(null);
    setPrefill(null);
    setScreen("main");
    setTab(
      user?.role === "supervisor"
        ? "administracao"
        : user?.role === "admin"
        ? "admin"
        : "home"
    );
  };

  // -- supaInsertReclamacao — salva reclamação no banco e retorna o objeto ------
  const supaInsertReclamacao = useCallback(async (nova) => {
    const payload = {
      id: nova.id,
      num: nova.num,
      status: nova.status,
      reclamante: nova.reclamante,
      contato: nova.contato || "",
      reclamado: nova.reclamado,
      endereco: nova.endereco,
      bairro: nova.bairro,
      descricao: nova.descricao,
      fiscal: nova.fiscal || "",
      parecer: "",
      parecer_status: "",
      parecer_data: "",
      data: nova.data,
    };
    return await supa.insert("reclamacoes", payload);
  }, []);

  // -- onUpdateDefesa --------------------------------------------------------
  const handleUpdateDefesa = useCallback(async (updated) => {
    await supa.update("defesas", updated.id, {
      status: updated.status,
      julgado_por: updated.julgado_por || "",
      julgado_em: updated.julgado_em || "",
      justificativa: updated.justificativa || "",
    });
    setDefesas((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  // -- handleAcaoReclamacao ---------------------------------------------------
  const handleAcaoReclamacao = (tipo, rec) => {
    setPrefill({
      proprietario: rec.reclamado,
      endereco: rec.endereco,
      bairro: rec.bairro,
      descricao: "",
    });
    setScreen(tipo === "notif" ? "form-notif" : "form-auto");
  };

  // -- handleSavePerfil -------------------------------------------------------
  const handleSavePerfil = async (updated) => {
    if (updated.isMaster) {
      setUser(updated);
      return;
    }
    // Atualizar dados do perfil (sem senha)
    await supa.update("usuarios", updated.id, {
      name: updated.name,
      telefone: updated.telefone || "",
      endereco: updated.endereco || "",
    });
    // Se informou nova senha, usar RPC para hash seguro
    if (updated.novaSenha && updated.novaSenha.length >= 6) {
      await fetch(`${SUPA_URL}/rest/v1/rpc/criar_usuario_seguro`, {
        method: "POST",
        headers: supa.headers,
        body: JSON.stringify({
          p_id: updated.id,
          p_name: updated.name,
          p_matricula: updated.matricula,
          p_senha: updated.novaSenha,
          p_role: updated.role,
          p_email: updated.email || "",
          p_telefone: updated.telefone || "",
          p_endereco: updated.endereco || "",
          p_bairros: updated.bairros || [],
          p_ativo: updated.ativo !== false,
        }),
      });
    }
    setUsuarios((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setUser(updated);
  };

  // -- Wrappers para AdminScreen (CRUD usuários com senha hash) ----------------
  const setUsuariosAdmin = useCallback(async (updater) => {
    setUsuarios((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // detectar adições e edições
      next.forEach(async (u) => {
        const old = prev.find((o) => o.id === u.id);
        if (!old) {
          // novo usuário — usar RPC para hash da senha
          if (u.senha) {
            await fetch(`${SUPA_URL}/rest/v1/rpc/criar_usuario_seguro`, {
              method: "POST",
              headers: supa.headers,
              body: JSON.stringify({
                p_id: u.id,
                p_name: u.name,
                p_matricula: u.matricula,
                p_senha: u.senha,
                p_role: u.role,
                p_email: u.email || "",
                p_telefone: u.telefone || "",
                p_endereco: u.endereco || "",
                p_bairros: u.bairros || [],
                p_ativo: u.ativo !== false,
              }),
            });
          }
        } else if (JSON.stringify(old) !== JSON.stringify(u)) {
          // edição — se tiver nova senha, usar RPC; senão, update normal
          if (u.senha && u.senha.length >= 6) {
            await fetch(`${SUPA_URL}/rest/v1/rpc/criar_usuario_seguro`, {
              method: "POST",
              headers: supa.headers,
              body: JSON.stringify({
                p_id: u.id,
                p_name: u.name,
                p_matricula: u.matricula,
                p_senha: u.senha,
                p_role: u.role,
                p_email: u.email || "",
                p_telefone: u.telefone || "",
                p_endereco: u.endereco || "",
                p_bairros: u.bairros || [],
                p_ativo: u.ativo !== false,
              }),
            });
          } else {
            // Atualizar dados sem alterar senha
            await supa.update("usuarios", u.id, {
              name: u.name,
              matricula: u.matricula,
              role: u.role,
              email: u.email || "",
              telefone: u.telefone || "",
              endereco: u.endereco || "",
              bairros: u.bairros || [],
              ativo: u.ativo !== false,
            });
          }
        }
      });
      // detectar remoções
      prev.forEach(async (u) => {
        if (!next.find((n) => n.id === u.id)) {
          await supa.delete("usuarios", u.id);
        }
      });
      return next;
    });
  }, []);

  // -- setCancelPendingAdmin --------------------------------------------------
  const setCancelPendingAdmin = useCallback(async (updater) => {
    setCancelPending((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // adições
      next.forEach(async (cp) => {
        if (!prev.find((o) => o.id === cp.id)) {
          await supa.insert("cancel_pending", {
            id: String(cp.id),
            record_id: String(cp.recordId),
            record_num: cp.recordNum,
            record_owner: cp.recordOwner,
            record_fiscal: cp.recordFiscal,
            motivo: cp.motivo,
            solicitado_por: cp.solicitadoPor,
            data: cp.data,
          });
        }
      });
      // remoções
      prev.forEach(async (cp) => {
        if (!next.find((n) => n.id === cp.id)) {
          await supa.delete("cancel_pending", cp.id);
        }
      });
      return next;
    });
  }, []);

  // -- Filtro de records por perfil -----------------------------------------
  // Fiscal vê APENAS seus próprios registros em todas as telas
  // Admin/Supervisor vê todos
  // Debug temporário — remover após confirmar funcionamento
  if (user?.role === "fiscal" && records.length > 0) {
    console.log(
      "[FISCON] user.name:",
      JSON.stringify(user.name),
      "| user.matricula:",
      user.matricula
    );
    console.log("[FISCON] fiscais nos records:", [
      ...new Set(records.map((r) => r.fiscal)),
    ]);
  }

  const recordsFiltrados =
    user?.role === "fiscal"
      ? records.filter((r) => {
          const rFiscal = (r.fiscal || "").trim().toLowerCase();
          const uName = (user.name || "").trim().toLowerCase();
          const uMatr = (user.matricula || "").trim();
          const rMatr = (r.matricula || "").trim();
          return rFiscal === uName || (uMatr && rMatr && uMatr === rMatr);
        })
      : records;

  if (user?.role === "fiscal") {
    console.log(
      "[FISCON] records total:",
      records.length,
      "| filtrados:",
      recordsFiltrados.length
    );
  }

  // -- Nav --------------------------------------------------------------------
  const reclamacoesNovas =
    user?.role === "fiscal"
      ? reclamacoes.filter(
          (r) =>
            r.fiscal === user?.name &&
            (r.status === "nova" || r.status === "designada") &&
            !r.parecerStatus
        ).length
      : reclamacoes.filter((r) => r.status === "nova").length;

  const isAdmin = user?.role === "admin" || user?.role === "supervisor";

  const navItems =
    user?.role === "admin"
      ? [
          { id: "admin", label: "Usuários", icon: "users" },
          { id: "defesas", label: "Defesas", icon: "file" },
          { id: "config", label: "Config", icon: "save" },
          { id: "auditoria", label: "Auditoria", icon: "history" },
          { id: "log", label: "Log", icon: "history" },
        ]
      : user?.role === "supervisor"
      ? [
          { id: "administracao", label: "Painel", icon: "home" },
          { id: "registros", label: "Registros", icon: "history" },
          { id: "reclamacoes", label: "Reclamações", icon: "bell" },
          { id: "defesas", label: "Defesas", icon: "file" },
        ]
      : user?.role === "atendente"
      ? [{ id: "reclamacoes", label: "Reclamações", icon: "bell" }]
      : [
          { id: "home", label: "Início", icon: "home" },
          { id: "form", label: "Novo", icon: "file" },
          { id: "reclamacoes", label: "Reclamações", icon: "bell" },
          { id: "prazos", label: "Prazos", icon: "bell" },
          { id: "registros", label: "Registros", icon: "history" },
        ];

  const BellIcon = ({ size = 22, color = "currentColor" }) => (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );

  // ── MODO PORTAL DO CIDADÃO ─────────────────────────────────────────────
  // Quando o contribuinte escaneia o QR Code (URL com ?codigo=XXX),
  // o app abre diretamente a tela do documento sem login.
  if (portalCodigo) {
    const rec = records.find((r) => r.codigo_acesso === portalCodigo);
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "20px 16px",
          fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
        }}
      >
        <style>{css}</style>
        {/* Cabeçalho institucional */}
        <div
          style={{
            width: "100%",
            maxWidth: 600,
            background: "#0d3b7a",
            borderRadius: "12px 12px 0 0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "3px solid #b45309",
          }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
            alt="Brasão PMVC"
            style={{ width: 42, height: "auto", flexShrink: 0 }}
          />
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 0.3,
              }}
            >
              Prefeitura Municipal de Vitória da Conquista
            </div>
            <div style={{ color: "#93c5fd", fontSize: 11, marginTop: 2 }}>
              Secretaria de Infraestrutura Urbana — FISCON
            </div>
          </div>
        </div>
        {/* Conteúdo */}
        <div
          style={{
            width: "100%",
            maxWidth: 600,
            background: "#fff",
            borderRadius: "0 0 12px 12px",
            padding: "24px 20px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          }}
        >
          {rec ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: rec.type === "auto" ? "#fef2f2" : "#eff6ff",
                    border: `1.5px solid ${
                      rec.type === "auto" ? "#fca5a5" : "#93c5fd"
                    }`,
                    borderRadius: 8,
                    padding: "6px 18px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: rec.type === "auto" ? "#b91c1c" : "#1d4ed8",
                    marginBottom: 10,
                  }}
                >
                  {rec.type === "auto"
                    ? "AUTO DE INFRAÇÃO"
                    : "NOTIFICAÇÃO PRELIMINAR"}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#0d3b7a",
                    letterSpacing: 1,
                  }}
                >
                  {rec.num}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Emitido em {rec.date}
                </div>
              </div>
              {/* Dados do registro */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 16,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong>Proprietário:</strong> {rec.owner}
                </div>
                <div>
                  <strong>Endereço:</strong> {rec.addr}
                </div>
                {rec.bairro && (
                  <div>
                    <strong>Bairro:</strong> {rec.bairro}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color:
                        rec.status === "Regularizado"
                          ? "#166534"
                          : rec.status === "Embargado"
                          ? "#991b1b"
                          : "#b45309",
                      fontWeight: 700,
                      background:
                        rec.status === "Regularizado"
                          ? "#dcfce7"
                          : rec.status === "Embargado"
                          ? "#fee2e2"
                          : "#fef3c7",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {rec.status}
                  </span>
                </div>
                {rec.type === "auto" && rec.multa && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Penalidade:</strong>{" "}
                    <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                      R$ {rec.multa}
                    </span>
                  </div>
                )}
              </div>
              {/* Botão principal - abrir documento A4 */}
              <button
                onClick={() =>
                  gerarPDFA4(
                    rec.type,
                    {
                      num: rec.num,
                      proprietario: rec.owner,
                      cpf: rec.cpf || "",
                      endereco: rec.addr || "",
                      bairro: rec.bairro || "",
                      loteamento: rec.loteamento || "",
                      infracoes: rec.infracoes || [],
                      multa: rec.multa || "",
                      prazo: rec.prazo || "10",
                      fiscal: rec.fiscal || "",
                      matricula: rec.matricula || "",
                      codigoAcesso: rec.codigo_acesso || "",
                      testemunha1: rec.testemunha1 || "",
                      testemunha2: rec.testemunha2 || "",
                      obsRecusa: rec.obsRecusa || "",
                    },
                    PORTAL_URL
                  )
                }
                style={{
                  width: "100%",
                  background: "#0d3b7a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "16px 0",
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                  marginBottom: 10,
                  letterSpacing: 0.5,
                  boxShadow: "0 2px 12px rgba(13,59,122,0.3)",
                }}
              >
                Ver / Imprimir Documento Oficial (A4)
              </button>
              <div
                style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}
              >
                O documento será aberto em uma nova aba para impressão ou
                salvamento em PDF.
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 14, color: "#9ca3af" }}>
                ?
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Documento não encontrado
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                O código{" "}
                <strong style={{ fontFamily: "monospace" }}>
                  {portalCodigo}
                </strong>{" "}
                não foi localizado.
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                Verifique o QR Code ou entre em contato com a Prefeitura.
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            FISCON — Sistema de Fiscalização de Obras | PMVC
          </div>
        </div>
      </div>
    );
  }

  // -- Tela de Login ----------------------------------------------------------
  if (screen === "login") {
    return (
      <>
        <style>{css}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #0F172A 0%, #1344B5 50%, #0F172A 100%)",
          }}
        >
          <div
            className="app-shell"
            style={{
              maxWidth: 430,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div className="login-bg" style={{ borderRadius: 20 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
                alt="Brasão PMVC"
                style={{
                  width: 90,
                  height: 90,
                  objectFit: "contain",
                  marginBottom: 8,
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
                }}
              />
              <div className="login-title">FISCON</div>
              <div className="login-sub">
                Prefeitura de Vitória da Conquista
              </div>
              <div className="input-group">
                <label className="input-label">Matrícula</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="00000-0"
                  value={loginData.login}
                  onChange={(e) => {
                    setLoginData({
                      ...loginData,
                      login: maskMatricula(e.target.value),
                    });
                    setLoginError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={loginError ? { borderColor: T.danger } : {}}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Senha</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Digite sua senha"
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData({ ...loginData, password: e.target.value });
                    setLoginError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={loginError ? { borderColor: T.danger } : {}}
                />
              </div>
              {loginError && (
                <div
                  style={{
                    width: "100%",
                    background: "rgba(185,28,28,0.12)",
                    border: "1px solid rgba(185,28,28,0.4)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 8,
                    fontSize: 13,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {loginError}
                </div>
              )}
              {loading && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  Conectando ao servidor...
                </div>
              )}
              <button
                className="btn-primary"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Carregando..." : "Entrar no sistema"}
              </button>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Acesso restrito a servidores autorizados
                <br />
                <span style={{ fontSize: 10, opacity: 0.5 }}>
                  Prefeitura Municipal de Vitória da Conquista
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // -- App principal ----------------------------------------------------------
  const activeTab = screen.startsWith("form") ? "form" : tab;
  const roleLabel = {
    admin: "Gerência",
    supervisor: "Administração",
    fiscal: "Fiscal",
    atendente: "Balcão",
  };

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        {toast && (
          <div className="toast">
            <Icon name="check" size={16} />{" "}
            {typeof toast === "object" ? toast.msg : toast}
          </div>
        )}

        {preview && (
          <DocPreview
            type={preview.type}
            data={preview.data}
            onSave={handleSaveRecord}
            onClose={() => {
              setPreview(null);
              setPrefill(null);
              setScreen("main");
              setTab(
                user?.role === "supervisor"
                  ? "administracao"
                  : user?.role === "admin"
                  ? "admin"
                  : "home"
              );
            }}
          />
        )}
        {showPerfil && (
          <PerfilModal
            user={user}
            onSave={handleSavePerfil}
            onClose={() => setShowPerfil(false)}
          />
        )}

        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
              alt="Brasão PMVC"
              style={{
                width: 36,
                height: 36,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <div className="topbar-title">FISCON</div>
            <div className="topbar-breadcrumb">
              {tab === "home" && "Dashboard"}
              {tab === "registros" && "Registros"}
              {tab === "reclamacoes" && "Reclamações"}
              {tab === "form" && "Nova Fiscalização"}
              {tab === "administracao" && "Painel Administrativo"}
              {tab === "admin" && "Gestão de Usuários"}
              {tab === "defesas" && "Defesas"}
              {tab === "prazos" && "Controle de Prazos"}
              {tab === "log" && "Log do Sistema"}
              {tab === "history" && "Histórico"}
              {screen === "form-notif" && "Nova Notificação"}
              {screen === "form-auto" && "Novo Auto de Infração"}
            </div>
          </div>
          <div className="topbar-user">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.75)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {roleLabel[user?.role] || user?.role}
              </div>
            </div>
            <button
              onClick={() => setShowPerfil(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: "pointer",
                fontFamily: T.font,
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user?.name
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </button>
            <button
              onClick={() => {
                setUser(null);
                setScreen("login");
                setLoginData({ login: "", password: "" });
              }}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                marginLeft: 4,
              }}
              title="Sair"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>

        <div
          className="desktop-content scroll-content"
          style={{ overflowY: "auto", height: "calc(100vh - 56px)" }}
        >
          {/* Alerta de cancelamento pendente para fiscal */}
          {user?.role === "fiscal" &&
            cancelPending.filter((s) => s.recordFiscal === user.name).length >
              0 && (
              <div
                style={{
                  margin: "12px 16px 0",
                  background: "rgba(185,28,28,0.08)",
                  border: "1.5px solid rgba(185,28,28,0.3)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: T.danger,
                    marginBottom: 10,
                  }}
                >
                  {
                    cancelPending.filter((s) => s.recordFiscal === user.name)
                      .length
                  }{" "}
                  solicitação(ões) de cancelamento
                </div>
                {cancelPending
                  .filter((s) => s.recordFiscal === user.name)
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {s.recordNum} — {s.recordOwner}
                      </div>
                      <div
                        style={{ fontSize: 12, color: T.muted, marginTop: 2 }}
                      >
                        Solicitado por {s.solicitadoPor} em {s.data}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        <strong>Motivo:</strong> {s.motivo}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          onClick={async () => {
                            await supa.update("records", s.recordId, {
                              status: "Cancelado",
                              motivo_cancel: s.motivo,
                              cancelado_em: new Date().toLocaleDateString(
                                "pt-BR"
                              ),
                            });
                            setRecords((prev) =>
                              prev.map((r) =>
                                r.id === s.recordId
                                  ? {
                                      ...r,
                                      status: "Cancelado",
                                      motivoCancel: s.motivo,
                                    }
                                  : r
                              )
                            );
                            await supa.delete("cancel_pending", s.id);
                            setCancelPending((prev) =>
                              prev.filter((p) => p.id !== s.id)
                            );
                            addLog(
                              "Cancelamento confirmado pelo fiscal",
                              `${s.recordNum} — Motivo: ${s.motivo}`,
                              user.name
                            );
                          }}
                          style={{
                            flex: 1,
                            background: T.danger,
                            border: "none",
                            borderRadius: 8,
                            color: "#fff",
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✔ Confirmar cancelamento
                        </button>
                        <button
                          onClick={async () => {
                            await supa.delete("cancel_pending", s.id);
                            setCancelPending((prev) =>
                              prev.filter((p) => p.id !== s.id)
                            );
                            addLog(
                              "Cancelamento recusado pelo fiscal",
                              `${s.recordNum}`,
                              user.name
                            );
                          }}
                          style={{
                            flex: 1,
                            background: "none",
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            color: T.muted,
                            padding: "10px 0",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Recusar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

          {screen === "main" && tab === "home" && (
            <Dashboard
              user={user}
              records={recordsFiltrados}
              onNav={(nav) => {
                if (typeof nav === "object") {
                  setRegistrosFiltro({
                    tipo: nav.tipo || "all",
                    status: nav.status || "all",
                  });
                  setTab(nav.tab || "registros");
                  setScreen("main");
                } else {
                  setScreen(nav);
                }
              }}
            />
          )}
          {screen === "main" && tab === "history" && (
            <HistoryScreen
              records={recordsFiltrados}
              setRecords={setRecordsGlobal}
              user={user}
            />
          )}
          {screen === "main" && tab === "registros" && (
            <RegistrosScreen
              records={recordsFiltrados}
              setRecords={setRecordsGlobal}
              user={user}
              initialFiltro={registrosFiltro}
              onClearFiltro={() =>
                setRegistrosFiltro({ tipo: "all", status: "all" })
              }
              onAddLog={addLog}
              onEncaminharAuto={async (rec) => {
                await supa.update("records", rec.id, { status: "Autuado" });
                setRecords((prev) =>
                  prev.map((r) =>
                    r.id === rec.id ? { ...r, status: "Autuado" } : r
                  )
                );
                setPrefill({
                  proprietario: rec.owner,
                  cpf: rec.cpf,
                  endereco:
                    rec.addr.split(", ").slice(0, -1).join(", ") || rec.addr,
                  bairro: rec.bairro,
                  descricao: "",
                  _notifId: rec.id,
                  _notifNum: rec.num,
                });
                setScreen("form-auto");
              }}
            />
          )}
          {screen === "main" && tab === "prazos" && (
            <PrazosScreen
              records={records}
              user={user}
              onNav={(tab) => setTab(tab)}
            />
          )}
          {screen === "main" && tab === "log" && <LogScreen logs={logs} />}
          {screen === "main" && tab === "config" && (
            <ConfigScreen showToast={showToast} />
          )}
          {screen === "main" && tab === "auditoria" && (
            <AuditoriaScreen logs={logs} records={records} user={user} />
          )}
          {screen === "main" && tab === "defesas" && (
            <DefesasScreen
              defesas={defesas}
              records={records}
              user={user}
              addLog={addLog}
              onUpdateDefesa={handleUpdateDefesa}
            />
          )}
          {screen === "main" && tab === "admin" && (
            <AdminScreen
              usuarios={usuarios}
              setUsuarios={setUsuariosAdmin}
              currentUser={user}
              addLog={addLog}
            />
          )}
          {screen === "main" && tab === "administracao" && (
            <AdministracaoScreen
              usuarios={usuarios}
              records={records}
              setRecords={setRecordsGlobal}
              reclamacoes={reclamacoes}
              setReclamacoesGlobal={setReclamacoesGlobal}
              addLog={addLog}
              currentUser={user}
              cancelPending={cancelPending}
              setCancelPending={setCancelPendingAdmin}
              onAcaoReclamacao={handleAcaoReclamacao}
            />
          )}
          {screen === "main" && tab === "reclamacoes" && (
            <ReclamacoesScreen
              user={user}
              usuarios={usuarios}
              reclamacoesGlobal={reclamacoes}
              setReclamacoesGlobal={setReclamacoesGlobal}
              onAcao={handleAcaoReclamacao}
              addLog={addLog}
              supaInsertReclamacao={supaInsertReclamacao}
            />
          )}
          {screen === "form-notif" &&
            user?.role !== "admin" &&
            user?.role !== "supervisor" && (
              <FormScreen
                type="notif"
                prefill={prefill}
                user={user}
                onPreview={handlePreview}
                onBack={() => {
                  setScreen("main");
                  setTab(
                    user?.role === "supervisor"
                      ? "administracao"
                      : prefill
                      ? "reclamacoes"
                      : "home"
                  );
                  setPrefill(null);
                }}
              />
            )}
          {screen === "form-auto" &&
            user?.role !== "admin" &&
            user?.role !== "supervisor" && (
              <FormScreen
                type="auto"
                prefill={prefill}
                user={user}
                onPreview={handlePreview}
                onBack={() => {
                  setScreen("main");
                  setTab(
                    user?.role === "supervisor"
                      ? "administracao"
                      : prefill
                      ? "reclamacoes"
                      : "home"
                  );
                  setPrefill(null);
                }}
              />
            )}
          {screen === "main" &&
            tab === "form" &&
            user?.role !== "admin" &&
            user?.role !== "supervisor" && (
              <div className="dashboard">
                <div
                  style={{
                    fontFamily: T.font,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 1,
                    marginBottom: 20,
                  }}
                >
                  Nova Fiscalização
                </div>
                <div className="action-cards">
                  <button
                    className="action-card"
                    onClick={() => setScreen("form-notif")}
                  >
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
                  <button
                    className="action-card"
                    onClick={() => setScreen("form-auto")}
                  >
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
              </div>
            )}
        </div>

        <div className="bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setTab(item.id);
                setScreen("main");
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                {item.icon === "bell" ? (
                  <BellIcon
                    size={22}
                    color={activeTab === item.id ? "#fff" : "#94A3B8"}
                  />
                ) : (
                  <Icon
                    name={item.icon}
                    size={22}
                    color={activeTab === item.id ? "#fff" : "#94A3B8"}
                  />
                )}
                {item.id === "reclamacoes" && reclamacoesNovas > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -6,
                      background: T.danger,
                      color: "#fff",
                      borderRadius: "50%",
                      minWidth: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                    }}
                  >
                    {reclamacoesNovas > 9 ? "9+" : reclamacoesNovas}
                  </span>
                )}
              </div>
              {item.label}
            </button>
          ))}
          {/* Desktop sidebar footer */}
          <div
            className="sidebar-footer"
            style={{
              marginTop: "auto",
              paddingTop: 16,
              borderTop: "1px solid #334155",
              display: "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                letterSpacing: 1,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              FISCON
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#334155",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              Pref. Mun. Vitória da Conquista
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
