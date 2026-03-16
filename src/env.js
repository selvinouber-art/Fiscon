// ═══════════════════════════════════════════════════
//  FISCON — Variáveis de Ambiente (env.js)
//  
//  Em PRODUÇÃO (Vercel), configure estas variáveis em:
//  Vercel Dashboard > Settings > Environment Variables
//  
//  Prefixo VITE_ é obrigatório para Vite expor no frontend.
//  
//  Variáveis necessárias no Vercel:
//    VITE_SUPA_URL=https://xxxxx.supabase.co
//    VITE_SUPA_KEY=eyJ...
//    VITE_PORTAL_URL=https://portal.dominio.com
//    VITE_ADMIN_PASS=SenhaForte123!
//
//  Em DESENVOLVIMENTO (CodeSandbox), use window globals
//  no index.html antes do bundle.
// ═══════════════════════════════════════════════════

// Prioridade: Variável de ambiente Vite > window global > string vazia
export const ENV = {
  SUPA_URL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPA_URL) ||
    window.__FISCON_SUPA_URL__ ||
    "",

  SUPA_KEY:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPA_KEY) ||
    window.__FISCON_SUPA_KEY__ ||
    "",

  PORTAL_URL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PORTAL_URL) ||
    window.__FISCON_PORTAL_URL__ ||
    "",

  ADMIN_PASS:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_PASS) ||
    window.__FISCON_ADMIN_PASS__ ||
    "",
};

// Aviso se variáveis não estão configuradas
if (!ENV.SUPA_URL || !ENV.SUPA_KEY) {
  console.warn(
    "FISCON: Variáveis SUPA_URL e SUPA_KEY não configuradas. " +
    "Configure via VITE_SUPA_URL/VITE_SUPA_KEY no Vercel, " +
    "ou window.__FISCON_SUPA_URL__/window.__FISCON_SUPA_KEY__ no index.html."
  );
}
