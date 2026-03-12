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
// ═══════════════════════════════════════════════════

// Prioridade: Variável de ambiente Vite > window global > fallback
export const ENV = {
  SUPA_URL:
    import.meta.env?.VITE_SUPA_URL ||
    window.__FISCON_SUPA_URL__ ||
    "https://wkvgqwsjflcoxgugaais.supabase.co",

  SUPA_KEY:
    import.meta.env?.VITE_SUPA_KEY ||
    window.__FISCON_SUPA_KEY__ ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrdmdxd3NqZmxjb3hndWdhYWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODQ1MjIsImV4cCI6MjA4ODY2MDUyMn0.t-j-S-1JEfI_N-JR-CrNsJ6YoW24nnnHnolURWBy6c0",

  PORTAL_URL:
    import.meta.env?.VITE_PORTAL_URL ||
    window.__FISCON_PORTAL_URL__ ||
    "https://x8z7zd.csb.app",

  ADMIN_PASS:
    import.meta.env?.VITE_ADMIN_PASS ||
    window.__FISCON_ADMIN_PASS__ ||
    "FiscOn@2026!",
};
