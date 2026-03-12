// ═══════════════════════════════════════════════════
//  FISCON — Módulo de Segurança (auth.js)
//  
//  Gerencia autenticação, sessão e expiração.
//  Importado pelo App.jsx
// ═══════════════════════════════════════════════════

const SESSION_KEY = "fiscon_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inatividade

// ─── Salvar sessão com timestamp ────────────────────
export function saveSession(user) {
  try {
    const session = {
      user,
      loginAt: Date.now(),
      lastActivity: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Erro ao salvar sessão:", e);
  }
}

// ─── Carregar sessão (retorna null se expirou) ──────
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    
    // Verificar expiração por inatividade
    const elapsed = Date.now() - (session.lastActivity || 0);
    if (elapsed > SESSION_TIMEOUT_MS) {
      clearSession();
      return null;
    }
    
    return session.user;
  } catch (e) {
    clearSession();
    return null;
  }
}

// ─── Atualizar timestamp de atividade ───────────────
export function touchSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.lastActivity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // silenciar
  }
}

// ─── Limpar sessão (logout) ─────────────────────────
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("fiscon_user"); // limpa o antigo tb
  } catch (e) {
    // silenciar
  }
}

// ─── Hook: monitorar inatividade ────────────────────
// Retorna true se a sessão expirou
export function checkSessionExpired() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return true;
    const session = JSON.parse(raw);
    const elapsed = Date.now() - (session.lastActivity || 0);
    return elapsed > SESSION_TIMEOUT_MS;
  } catch {
    return true;
  }
}

// ─── Tempo restante da sessão (em minutos) ──────────
export function getSessionTimeLeft() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const session = JSON.parse(raw);
    const elapsed = Date.now() - (session.lastActivity || 0);
    const remaining = SESSION_TIMEOUT_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 60000));
  } catch {
    return 0;
  }
}
