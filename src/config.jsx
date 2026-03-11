import React from "react";
// ═══════════════════════════════════════════════════
//  FISCON — Configuração (Theme + Supabase + Dados)
//  NÃO EDITAR sem necessidade
// ═══════════════════════════════════════════════════
import { useState, useRef } from "react";

// --- Theme -------------------------------------------------------------------
const T = {
  bg: "#F0F4F8",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#CBD5E0",
  accent: "#1A56DB", // azul vivo, fácil de ver
  accentDim: "#1344B5",
  gold: "#B45309", // âmbar escuro, legível
  danger: "#B91C1C", // vermelho sólido
  success: "#166534", // verde escuro sólido
  text: "#111827", // quase preto
  muted: "#6B7280", // cinza médio
  font: "'Barlow Condensed', sans-serif",
  body: "'Barlow', sans-serif",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${T.bg}; color: ${T.text}; font-family: ${T.body}; min-height: 100vh; }
.app-shell { max-width: 430px; margin: 0 auto; min-height: 100vh; background: ${T.bg}; position: relative; overflow: hidden; }

/* --- Desktop Layout (=900px) ------------------------------------------- */
@media (min-width: 900px) {
  body { background: #0F172A; }
  .app-shell {
    max-width: 100%;
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 60px 1fr;
    min-height: 100vh;
    overflow: visible;
  }
  /* Topbar spans full width */
  .topbar {
    grid-column: 1 / -1;
    grid-row: 1;
    padding: 0 28px;
    height: 60px;
    box-shadow: 0 1px 0 rgba(255,255,255,0.08);
  }
  .topbar-title { font-size: 22px; }
  /* Sidebar replaces bottom nav */
  .bottom-nav {
    position: fixed !important;
    top: 60px !important;
    left: 0 !important;
    bottom: 0 !important;
    transform: none !important;
    width: 240px !important;
    max-width: 240px !important;
    grid-column: 1;
    grid-row: 2;
    flex-direction: column;
    background: #1E293B;
    border-top: none;
    border-right: 1px solid #334155;
    padding: 20px 12px;
    height: calc(100vh - 60px);
    align-items: stretch;
    gap: 4px;
    overflow-y: auto;
    z-index: 200;
  }
  .nav-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 10px;
    font-size: 13px;
    letter-spacing: 0.5px;
    text-align: left;
    color: #94A3B8;
  }
  .nav-item:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
  .nav-item.active { background: #1A56DB; color: #fff; }
  .nav-item.active svg { transform: none; }
  .nav-item svg { flex-shrink: 0; }
  .sidebar-footer { display: flex !important; flex-direction: column; }
  /* Main content area */
  .desktop-content {
    grid-column: 2;
    grid-row: 2;
    overflow-y: auto;
    height: calc(100vh - 60px);
    background: ${T.bg};
    margin-left: 240px;
  }
  /* Dashboard wider */
  .dashboard { padding: 28px 32px 60px; max-width: 1100px; }
  .stat-row { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
  .stat-card { padding: 20px; }
  .stat-num { font-size: 48px; }
  .action-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  /* Forms wider */
  .form-screen { padding: 28px 32px 60px; max-width: 900px; }
  .form-row { grid-template-columns: 1fr 1fr 1fr; }
  /* Record list */
  .history-screen { padding: 28px 32px 60px; max-width: 1100px; }
  .record-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  /* Admin */
  .admin-screen { padding: 28px 32px 60px; max-width: 900px; }
  /* Reclamações */
  .recl-screen { padding: 28px 32px 60px; max-width: 1100px; }
  /* Modals centered on desktop */
  .modal-overlay { align-items: center; background: rgba(0,0,0,0.7); }
  .modal-sheet {
    border-radius: 20px;
    max-width: 560px;
    max-height: 88vh;
    margin: auto;
  }
  .modal-handle { display: none; }
  /* Login */
  .login-bg { background: #0F172A; }
  .app-shell .login-bg { grid-column: 1 / -1; }
  /* Scrollable content wrapper */
  .scroll-content { height: calc(100vh - 60px); overflow-y: auto; }
}

@media (min-width: 900px) and (max-width: 1200px) {
  .stat-row { grid-template-columns: 1fr 1fr; }
  .record-list { grid-template-columns: 1fr; }
}

/* Login */
.login-bg {
  background: #1A56DB;
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 40px 28px;
}
.logo-badge {
  width: 80px; height: 80px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5);
  border-radius: 20px; display: flex; align-items: center; justify-content: center;
  font-size: 38px; margin-bottom: 20px;
}
.login-title { font-family: ${T.font}; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #fff; text-align: center; line-height: 1.1; }
.login-sub { font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-top: 6px; margin-bottom: 40px; }
.input-group { width: 100%; margin-bottom: 16px; }
.input-label { font-size: 11px; color: ${T.muted}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; display: block; font-weight: 600; }
.login-bg .input-label { color: rgba(255,255,255,0.95); }
.login-bg .input-field { background: rgba(255,255,255,0.97); color: #111827; border-color: rgba(255,255,255,0.4); }
.login-bg .input-field:focus { border-color: #fff; box-shadow: 0 0 0 3px rgba(255,255,255,0.25); }
.input-field { width: 100%; background: #fff; border: 2px solid ${T.border}; border-radius: 10px; padding: 13px 16px; color: ${T.text}; font-family: ${T.body}; font-size: 15px; outline: none; transition: border-color 0.2s; }
.input-field:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px rgba(26,86,219,0.15); }
select.input-field { cursor: pointer; }
.btn-primary { width: 100%; background: #fff; color: ${T.accent}; font-family: ${T.font}; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; border: none; border-radius: 12px; padding: 16px; cursor: pointer; margin-top: 8px; transition: opacity 0.15s, transform 0.1s; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
.btn-primary:active { transform: scale(0.98); opacity: 0.92; }

/* Top Bar */
.topbar { background: #1A56DB; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
.topbar-title { font-family: ${T.font}; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #fff; }
.topbar-breadcrumb { display: none; font-size: 12px; color: rgba(255,255,255,0.6); margin-left: 20px; padding-left: 20px; border-left: 1px solid rgba(255,255,255,0.2); letter-spacing: 1px; text-transform: uppercase; }
@media (min-width: 900px) { .topbar-breadcrumb { display: block; } }
.topbar-user { display: flex; align-items: center; gap: 10px; }

/* Bottom Nav */
.bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: #111827; border-top: 2px solid #374151; display: flex; padding: 8px 0 18px; z-index: 100; }
.bottom-nav { left: 50%; }
.nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 6px 0; transition: color 0.2s; color: #9CA3AF; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; border: none; background: none; }
.nav-item.active { color: #60A5FA; }
.nav-item svg { transition: transform 0.2s; }
.nav-item.active svg { transform: translateY(-2px); }

/* Dashboard */
.dashboard { padding: 20px 20px 100px; }
.stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border: 2px solid ${T.border}; border-radius: 16px; padding: 16px; position: relative; overflow: hidden; }
.stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 56px; height: 56px; border-radius: 0 16px 0 56px; opacity: 0.08; }
.stat-card.blue::before { background: ${T.accent}; }
.stat-card.gold::before { background: ${T.gold}; }
.stat-card.danger::before { background: ${T.danger}; }
.stat-card.success::before { background: ${T.success}; }
.stat-num { font-family: ${T.font}; font-size: 40px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.stat-num.blue { color: ${T.accent}; }
.stat-num.gold { color: ${T.gold}; }
.stat-num.danger { color: ${T.danger}; }
.stat-num.success { color: ${T.success}; }
.stat-label { font-size: 11px; color: ${T.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.section-title { font-family: ${T.font}; font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${T.muted}; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.section-title::after { content: ''; flex: 1; height: 1px; background: ${T.border}; }
.action-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.action-card { background: #fff; border: 2px solid ${T.border}; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; border: 2px solid ${T.border}; width: 100%; text-align: left; color: ${T.text}; }
.action-card:active { transform: scale(0.98); }
.action-card:hover { border-color: ${T.accent}; box-shadow: 0 4px 12px rgba(26,86,219,0.12); }
.action-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.action-icon.blue { background: #EBF5FF; }
.action-icon.gold { background: #FEF3C7; }
.action-icon.danger { background: #FEE2E2; }
.action-title { font-weight: 700; font-size: 15px; margin-bottom: 2px; color: ${T.text}; }
.action-sub { font-size: 12px; color: ${T.muted}; }
.action-arrow { margin-left: auto; color: ${T.muted}; font-size: 18px; }

/* Record list */
.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-item { background: #fff; border: 2px solid ${T.border}; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: border-color 0.15s; border-left: 4px solid transparent; }
.record-item:hover { border-color: ${T.accent}; }
.record-item.notif { border-left-color: ${T.gold}; }
.record-item.auto { border-left-color: ${T.danger}; }
.record-item.embargo { border-left-color: ${T.accent}; }
.record-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.record-num { font-family: ${T.font}; font-size: 15px; font-weight: 800; color: ${T.text}; }
.record-date { font-size: 11px; color: ${T.muted}; font-weight: 500; }
.record-owner { font-size: 13px; color: ${T.text}; margin-bottom: 2px; font-weight: 600; }
.record-addr { font-size: 12px; color: ${T.muted}; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px; }
.badge-gold { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; }
.badge-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
.badge-blue { background: #EBF5FF; color: #1E40AF; border: 1px solid #93C5FD; }
.badge-success { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }

/* Form */
.form-screen { padding: 20px 20px 120px; }
.form-section { background: #fff; border: 2px solid ${T.border}; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
.form-section-title { font-family: ${T.font}; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: ${T.accent}; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid ${T.border}; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 14px; }
.form-group:last-child { margin-bottom: 0; }
.gps-btn { width: 100%; background: #EBF5FF; border: 2px solid ${T.accent}; color: ${T.accent}; font-family: ${T.body}; font-size: 13px; font-weight: 700; border-radius: 10px; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
.gps-btn:hover { background: #BFDBFE; }
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.photo-slot { aspect-ratio: 4/3; background: #F9FAFB; border: 2px dashed ${T.border}; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; gap: 6px; transition: border-color 0.2s; }
.photo-slot:hover { border-color: ${T.accent}; }
.photo-slot span { font-size: 11px; color: ${T.muted}; font-weight: 500; }
.photo-filled { aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; position: relative; background: #F3F4F6; display: flex; align-items: center; justify-content: center; border: 2px solid ${T.border}; }
.photo-placeholder { font-size: 32px; }
.sig-canvas { width: 100%; height: 120px; background: #F9FAFB; border-radius: 10px; border: 2px dashed ${T.border}; cursor: crosshair; display: block; }
.sig-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-ghost { background: none; border: 2px solid ${T.border}; color: ${T.muted}; font-size: 12px; font-weight: 600; border-radius: 8px; padding: 6px 14px; cursor: pointer; }

/* Submit row */
.submit-row { display: flex; gap: 10px; margin-top: 8px; }
.btn-outline { flex: 1; background: #fff; border: 2px solid ${T.border}; color: ${T.text}; font-family: ${T.font}; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: border-color 0.2s; }
.btn-outline:hover { border-color: ${T.accent}; color: ${T.accent}; }
.btn-submit { flex: 2; background: ${T.danger}; color: #fff; font-family: ${T.font}; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: none; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-submit.notif-btn { background: ${T.gold}; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: flex-end; }
.modal-sheet { width: 100%; max-width: 430px; margin: 0 auto; background: #fff; border-radius: 24px 24px 0 0; padding: 24px 20px 40px; max-height: 92vh; overflow-y: auto; box-shadow: 0 -8px 32px rgba(0,0,0,0.15); }
.modal-handle { width: 40px; height: 4px; background: ${T.border}; border-radius: 2px; margin: 0 auto 20px; }
.doc-preview { background: #fff; color: #111; border-radius: 10px; padding: 20px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; border: 1px solid #E5E7EB; }
.doc-header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #111; padding-bottom: 10px; }
.doc-header h2 { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
.doc-header p { font-size: 10px; color: #555; }
.doc-num { font-size: 13px; font-weight: 800; color: #B91C1C; margin-bottom: 12px; text-align: center; }
.doc-field { display: flex; gap: 6px; margin-bottom: 6px; font-size: 11px; }
.doc-field-label { font-weight: 700; min-width: 90px; color: #374151; }
.doc-section-title { font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; background: #F3F4F6; padding: 4px 8px; margin: 10px -20px; border-top: 1px solid #D1D5DB; border-bottom: 1px solid #D1D5DB; color: #111; }
.doc-infracoes { margin: 8px 0; padding: 8px; background: #FFFBEB; border-left: 3px solid #B45309; border-radius: 4px; font-size: 11px; }
.doc-sig-area { display: flex; justify-content: space-between; margin-top: 16px; gap: 12px; }
.doc-sig-box { flex: 1; border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 10px; color: #555; }
.modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.btn-print { flex: 1; background: ${T.success}; color: #fff; font-family: ${T.font}; font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: none; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-save { flex: 1; background: ${T.accent}; color: #fff; font-family: ${T.font}; font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: none; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }

/* History */
.history-screen { padding: 20px 20px 100px; }
.search-bar { background: #fff; border: 2px solid ${T.border}; border-radius: 12px; padding: 12px 16px; width: 100%; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.search-bar input { background: none; border: none; color: ${T.text}; font-size: 14px; outline: none; width: 100%; }
.filter-row { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; }
.filter-chip { flex-shrink: 0; background: #fff; border: 2px solid ${T.border}; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; color: ${T.muted}; }
.filter-chip.active { background: #EBF5FF; border-color: ${T.accent}; color: ${T.accent}; }

/* Admin */
.admin-screen { padding: 20px 20px 100px; }
.user-card { background: #fff; border: 2px solid ${T.border}; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.user-info { flex: 1; }
.user-name { font-weight: 700; font-size: 14px; color: ${T.text}; }
.user-role { font-size: 11px; color: ${T.muted}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.role-badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
.role-admin { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
.role-supervisor { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
.role-fiscal { background: #EBF5FF; color: #1E40AF; border: 1px solid #93C5FD; }
.role-atendente { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }

/* Toast */
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #166534; color: #fff; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; z-index: 300; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); animation: slideDown 0.3s ease; white-space: nowrap; }
@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* Infractions */
textarea.input-field { resize: vertical; min-height: 80px; }
.inf-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.inf-tab { flex: 1; padding: 9px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; border: 2px solid; background: none; transition: all 0.15s; text-align: center; }
.inf-tab-blue { border-color: ${T.border}; color: ${T.muted}; }
.inf-tab-blue.active { background: #EBF5FF; border-color: ${T.accent}; color: ${T.accent}; }
.inf-tab-gold { border-color: ${T.border}; color: ${T.muted}; }
.inf-tab-gold.active { background: #FEF3C7; border-color: ${T.gold}; color: ${T.gold}; }
.inf-item { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid ${T.border}; cursor: pointer; gap: 10px; }
.inf-check { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.inf-desc { flex: 1; font-size: 12px; line-height: 1.4; color: ${T.text}; }
.inf-id { font-size: 10px; color: ${T.accent}; font-weight: 700; margin-bottom: 2px; }
.inf-valor { font-size: 11px; font-weight: 700; margin-top: 3px; white-space: nowrap; }
.inf-summary { background: #EBF5FF; border: 2px solid #BFDBFE; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; }
.inf-summary-title { font-size: 11px; color: ${T.accent}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.inf-summary-item { font-size: 11px; color: #374151; padding: 2px 0; display: flex; justify-content: space-between; gap: 8px; }
.inf-total { font-size: 14px; font-weight: 800; color: ${T.danger}; border-top: 2px solid #BFDBFE; margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; }

/* Reclamações */
.recl-screen { padding: 20px 20px 100px; }
.recl-card { background: #fff; border: 2px solid ${T.border}; border-radius: 14px; padding: 16px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s; border-left: 4px solid transparent; }
.recl-card:hover { border-color: ${T.accent}; }
.recl-card.nova { border-left-color: ${T.accent}; }
.recl-card.sem_irregularidade { border-left-color: #6B7280; }
.recl-card.resolvida { border-left-color: ${T.success}; }
.recl-card.designada { border-left-color: ${T.gold}; }
.recl-card.encerrada { border-left-color: ${T.success}; }
.recl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.recl-num { font-family: ${T.font}; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; color: ${T.text}; }
.recl-date { font-size: 11px; color: ${T.muted}; font-weight: 500; }
.recl-reclamante { font-size: 12px; color: ${T.muted}; margin-bottom: 2px; }
.recl-reclamante strong { color: ${T.text}; font-weight: 600; }
.recl-addr { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: ${T.text}; }
.recl-desc { font-size: 12px; color: #374151; line-height: 1.4; margin-bottom: 8px; }
.recl-footer { display: flex; align-items: center; justify-content: space-between; }
.recl-fiscal-tag { display: flex; align-items: center; gap: 6px; background: #FEF3C7; border-radius: 20px; padding: 4px 10px; font-size: 11px; color: #92400E; font-weight: 700; border: 1px solid #FCD34D; }
.recl-fiscal-tag.unassigned { background: #F3F4F6; color: ${T.muted}; border-color: ${T.border}; }
.recl-modal { padding: 0; }
.recl-modal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.recl-modal-num { font-family: ${T.font}; font-size: 24px; font-weight: 800; color: ${T.text}; }
.recl-detail-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-start; }
.recl-detail-label { font-size: 11px; color: ${T.muted}; text-transform: uppercase; letter-spacing: 0.5px; min-width: 88px; padding-top: 1px; font-weight: 700; }
.recl-detail-val { font-size: 13px; flex: 1; line-height: 1.4; color: ${T.text}; }
.recl-photo-mock { width: 100%; aspect-ratio: 16/9; background: #F3F4F6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 40px; border: 2px solid ${T.border}; margin-bottom: 16px; }
.recl-assign-box { background: #F9FAFB; border: 2px solid ${T.border}; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
.recl-assign-title { font-size: 12px; color: ${T.gold}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.recl-action-row { display: flex; gap: 8px; }
.btn-notif-sm { flex: 1; background: #FEF3C7; border: 2px solid ${T.gold}; color: ${T.gold}; font-family: ${T.font}; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 10px; padding: 12px 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
.btn-notif-sm:hover { background: #FDE68A; }
.btn-auto-sm { flex: 1; background: #FEE2E2; border: 2px solid ${T.danger}; color: ${T.danger}; font-family: ${T.font}; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 10px; padding: 12px 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
.btn-auto-sm:hover { background: #FECACA; }
.btn-encerrar { width: 100%; background: #D1FAE5; border: 2px solid ${T.success}; color: ${T.success}; font-family: ${T.font}; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 10px; padding: 10px; cursor: pointer; margin-top: 8px; }
.nova-recl-screen { padding: 20px 20px 120px; }

@media (min-width: 900px) {
  /* Nav section labels */
  .nav-section-label {
    font-size: 10px;
    color: #475569;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 12px 14px 6px;
    font-weight: 700;
  }
  /* Wider content cards on desktop */
  .dashboard > * { max-width: 1200px; }
  /* Desktop form improvements */
  .form-section { margin-bottom: 20px; }
  /* Desktop modal centered */
  .modal-overlay { padding: 24px; }
  /* Record grid on desktop */
  .history-screen > .record-list { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
  /* Better stat cards */
  .stat-card { min-height: 110px; }
  /* Topbar separator */
  .topbar { border-bottom: 1px solid rgba(255,255,255,0.1); }
  /* Nav hover transition */
  .nav-item { transition: background 0.15s, color 0.15s; }
}

`;

const RECORDS = [];

const RECLAMACOES_INIT = [];
// --- Infrações Oficiais  Lei nº 1.481/2007 ----------------------------------
const INFRACOES_Q61 = [
  {
    id: "6.1.1",
    desc: "Execução de obra sem a licença de localização",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.1.2",
    desc: "Execução de obra sem a licença de implantação",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.1.3",
    desc: "Execução de obra sem a licença de localização e de implantação",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 2766.35,
  },
  {
    id: "6.1.4a",
    desc: "Ocupação de edificação sem Licença de Operação ou Habite-se — construção residencial",
    penalidade: "Art. 137, I,IV",
    valor: 207.48,
  },
  {
    id: "6.1.4b",
    desc: "Ocupação de edificação sem Licença de Operação ou Habite-se — construção mista",
    penalidade: "Art. 137, I,IV",
    valor: 345.79,
  },
  {
    id: "6.1.4c",
    desc: "Ocupação de edificação sem Licença de Operação ou Habite-se — construção comercial",
    penalidade: "Art. 137, I,IV",
    valor: 691.59,
  },
  {
    id: "6.1.5",
    desc: "Omissão, no projeto, da existência de cursos de água, topografia acidentada ou elementos de altimetria relevantes",
    penalidade: "Art. 137, I,II,IV,V",
    valor: 553.27,
  },
  {
    id: "6.1.6",
    desc: "Início de obra sem responsável técnico",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1106.54,
  },
  {
    id: "6.1.7",
    desc: "Ausência do projeto aprovado e demais documentos exigidos no local da obra",
    penalidade: "Art. 137, I",
    valor: 165.98,
  },
  {
    id: "6.1.8",
    desc: "Execução de obra em desacordo com o projeto aprovado e/ou alteração dos elementos geométricos essenciais",
    penalidade: "Art. 137, I,II,IV,V",
    valor: 691.59,
  },
  {
    id: "6.1.9",
    desc: "Construção ou instalação executada de maneira a pôr em risco a estabilidade da obra ou segurança de pessoas",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.1.10",
    desc: "Inobservância das prescrições sobre equipamentos de segurança e proteção",
    penalidade: "Art. 137, I,II,IV",
    valor: 691.59,
  },
  {
    id: "6.1.11",
    desc: "Inobservância do alinhamento e nivelamento",
    penalidade: "Art. 137, I,II,IV,V",
    valor: 691.59,
  },
  {
    id: "6.1.12",
    desc: "Colocação de materiais de construção e entulho no passeio ou via pública por prazo superior a 24 horas",
    penalidade: "Art. 137, I,IV",
    valor: 276.63,
  },
  {
    id: "6.1.13",
    desc: "Preparar argamassa nas vias e logradouros públicos",
    penalidade: "Art. 137, I,IV",
    valor: 414.95,
  },
  {
    id: "6.1.14",
    desc: "Imperícia, com prejuízos ao interesse público, na execução da obra ou instalações",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.1.15",
    desc: "Danos causados pela má conservação de fachada, marquises ou corpos em balanço",
    penalidade: "Art. 137, I,IV,V",
    valor: 691.59,
  },
  {
    id: "6.1.16",
    desc: "Inobservância das prescrições quanto à mudança de responsável técnico",
    penalidade: "Art. 137, I,II,IV,V",
    valor: 414.95,
  },
  {
    id: "6.1.17",
    desc: "Utilização da edificação para fim diverso do declarado no projeto",
    penalidade: "Art. 137, I,IV",
    valor: 691.59,
  },
  {
    id: "6.1.18",
    desc: "Não atendimento injustificado à intimação para construção, reparação ou reconstrução de vedações e passeios",
    penalidade: "Art. 137, I",
    valor: 414.95,
  },
  {
    id: "6.1.19",
    desc: "Construção de fossas no passeio ou na via pública sem autorização",
    penalidade: "Art. 137, I,II,III,V",
    valor: 138.32,
  },
  {
    id: "6.1.20",
    desc: "Construção de cobertura no passeio",
    penalidade: "Art. 137, I,II,III,V",
    valor: 276.63,
  },
  {
    id: "6.1.21",
    desc: "Construção de obras não licenciadas em área de domínio público",
    penalidade: "Art. 137, I,III,V",
    valor: 484.11,
  },
  {
    id: "6.1.22",
    desc: "Ligação clandestina de esgoto sanitário à rede pluvial",
    penalidade: "Art. 137, I,V",
    valor: 414.95,
  },
  {
    id: "6.1.23",
    desc: "Construção de rampas ou degraus no passeio",
    penalidade: "Art. 137, I,V",
    valor: 276.63,
  },
  {
    id: "6.1.24",
    desc: "Por não obedecer o afastamento ou recuo mínimo",
    penalidade: "Art. 137, I,II,IV,V",
    valor: 414.95,
  },
  {
    id: "6.1.25",
    desc: "Abertura de vãos para iluminação/ventilação voltados para imóvel de terceiros sem recuo mínimo obrigatório",
    penalidade: "Art. 137, I,II,IV",
    valor: 165.98,
  },
  {
    id: "6.1.26",
    desc: "Jogar água servida nas vias públicas",
    penalidade: "Art. 137, I",
    valor: 138.32,
  },
  {
    id: "6.1.27a",
    desc: "Corte de via pública sem prévia licença — via sem pavimento",
    penalidade: "Art. 137, I,II,IV",
    valor: 1383.17,
  },
  {
    id: "6.1.27b",
    desc: "Corte de via pública sem prévia licença — via pavimentada",
    penalidade: "Art. 137, I,II,IV",
    valor: 2766.35,
  },
  {
    id: "6.1.27c",
    desc: "Corte de via pública sem prévia licença — passeio",
    penalidade: "Art. 137, I,II,IV",
    valor: 2766.35,
  },
  {
    id: "6.1.27d",
    desc: "Corte de via pública sem prévia licença — praças",
    penalidade: "Art. 137, I,II,IV",
    valor: 2766.35,
  },
  {
    id: "6.1.28",
    desc: "Não renovação do Alvará de Implantação",
    penalidade: "Art. 137, I,II,IV",
    valor: 276.63,
  },
  {
    id: "6.1.29",
    desc: "Construção de cobertura em desacordo com distâncias mínimas, prejudicando imóvel vizinho",
    penalidade: "Art. 137, I,II,V",
    valor: 207.48,
  },
  {
    id: "6.1.30",
    desc: "Falta de impermeabilização das paredes no limite dos terrenos vizinhos (multa por limite divisório)",
    penalidade: "Art. 137, I",
    valor: 691.59,
  },
  {
    id: "6.1.31",
    desc: "Obstrução do exercício profissional do Agente de Fiscalização de Obras",
    penalidade: "Art. 137, I",
    valor: 691.59,
  },
];

const INFRACOES_Q62 = [
  {
    id: "6.2.1",
    desc: "Execução de obra de urbanização sem a licença de localização",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 6915.87,
  },
  {
    id: "6.2.2",
    desc: "Execução de obra de urbanização sem a licença de implantação",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 6915.87,
  },
  {
    id: "6.2.3",
    desc: "Execução de obra de urbanização sem a licença de localização e de implantação",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 13831.74,
  },
  {
    id: "6.2.4",
    desc: "Início de obra de urbanização sem responsável técnico",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.2.5",
    desc: "Venda de lotes sem a licença de localização e de implantação (multa por lote)",
    penalidade: "Art. 137, I,II,III,IV,V",
    valor: 1383.17,
  },
  {
    id: "6.2.6",
    desc: "Omissão no projeto de urbanização da existência de cursos de água, topografia acidentada ou altimetria relevante",
    penalidade: "Art. 137, I,II,III,IV",
    valor: 6915.87,
  },
  {
    id: "6.2.7",
    desc: "Ausência do projeto aprovado e demais documentos no local das obras de urbanismo",
    penalidade: "Art. 137, I",
    valor: 165.98,
  },
  {
    id: "6.2.8",
    desc: "Execução de obras de urbanismo em desacordo com o projeto aprovado e/ou alteração dos elementos geométricos essenciais",
    penalidade: "Art. 137, I,II,III,IV",
    valor: 2074.76,
  },
  {
    id: "6.2.9",
    desc: "Implantação de urbanização de maneira a pôr em risco a estabilidade da obra ou segurança de pessoas",
    penalidade: "Art. 137, I,II,III,IV",
    valor: 13831.74,
  },
  {
    id: "6.2.10",
    desc: "Inobservância das prescrições quanto à mudança de responsável técnico em obra de urbanização",
    penalidade: "Art. 137, I,II,IV",
    valor: 414.95,
  },
  {
    id: "6.2.11",
    desc: "Obstrução do exercício profissional do Agente de Fiscalização de Obras (parcelamento)",
    penalidade: "Art. 137, I",
    valor: 691.59,
  },
  {
    id: "6.2.12",
    desc: "Utilização de área pública para parcelamento (multa por metro quadrado)",
    penalidade: "Art. 137, I,III",
    valor: 13.83,
  },
  {
    id: "6.2.13",
    desc: "Não cumprimento do Termo de Acordo e Compromisso (TAC)",
    penalidade: "Art. 137, I",
    valor: 13831.74,
  },
  {
    id: "6.2.14",
    desc: "Venda de lote caucionado (multa por lote)",
    penalidade: "Art. 137, I",
    valor: 6915.87,
  },
];

// --- Máscaras de input -------------------------------------------------------
const maskMatricula = (v) => {
  // Se começar com letra, não aplica máscara (ex: "admin")
  if (/^[a-zA-Z]/.test(v)) return v;
  const d = (v || "").replace(/\D/g, "").slice(0, 6);
  return d.length <= 5 ? d : d.slice(0, 5) + "-" + d.slice(5);
};
const maskCPF = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 14);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
  if (d.length <= 9)
    return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  if (d.length <= 11)
    return (
      d.slice(0, 3) +
      "." +
      d.slice(3, 6) +
      "." +
      d.slice(6, 9) +
      "-" +
      d.slice(9)
    );
  // CNPJ: 00.000.000/0000-00
  if (d.length <= 12)
    return (
      d.slice(0, 2) +
      "." +
      d.slice(2, 5) +
      "." +
      d.slice(5, 8) +
      "/" +
      d.slice(8)
    );
  if (d.length <= 13)
    return (
      d.slice(0, 2) +
      "." +
      d.slice(2, 5) +
      "." +
      d.slice(5, 8) +
      "/" +
      d.slice(8, 12) +
      "-" +
      d.slice(12)
    );
  return (
    d.slice(0, 2) +
    "." +
    d.slice(2, 5) +
    "." +
    d.slice(5, 8) +
    "/" +
    d.slice(8, 12) +
    "-" +
    d.slice(12, 14)
  );
};
const maskTelefone = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return "(" + d;
  if (d.length <= 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  if (d.length <= 10)
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return (
    "(" +
    d.slice(0, 2) +
    ") " +
    d.slice(2, 3) +
    " " +
    d.slice(3, 7) +
    "-" +
    d.slice(7)
  );
};

// --- Icons --------------------------------------------------------------------
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    home: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    file: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    history: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    users: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    printer: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    save: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    gps: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
    camera: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    check: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    arrow: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    logout: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    plus: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    chart: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    shield: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// -- Calcular status de prazo de um registro ---------------------------------
const calcPrazo = (record) => {
  if (!record || !record.date) return null;
  if (record.status === "Cancelado" || record.status === "Regularizado")
    return null;
  try {
    const [d, m, a] = record.date.split("/").map(Number);
    const emissao = new Date(a, m - 1, d);
    const diasPrazo = record.type === "auto" ? 10 : Number(record.prazo || 1);
    const venc = new Date(emissao);
    venc.setDate(venc.getDate() + diasPrazo);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diff = Math.ceil((venc - hoje) / 86400000); // dias restantes
    if (diff < 0)
      return {
        label: `Vencido há ${Math.abs(diff)}d`,
        color: "#c0392b",
        emoji: "",
        dias: diff,
      };
    if (diff === 0)
      return { label: "Vence hoje", color: "#e67e22", emoji: "", dias: diff };
    if (diff <= 2)
      return {
        label: `Vence em ${diff}d`,
        color: "#f39c12",
        emoji: "",
        dias: diff,
      };
    return {
      label: `${diff}d restantes`,
      color: "#27ae60",
      emoji: "",
      dias: diff,
    };
  } catch {
    return null;
  }
};

// --- Compressor de imagem ---------------------------------------------------
const compressImage = (file, maxW = 800, quality = 0.75) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || file);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

// --- Supabase -----------------------------------------------------------------
// CONFIGURAÇÃO: Altere estas variáveis para seu ambiente de produção
const SUPA_URL =
  window.__FISCON_SUPA_URL__ || "https://wkvgqwsjflcoxgugaais.supabase.co";
// URL do portal do cidadão — atualizar quando publicar o portal
const PORTAL_URL = window.__FISCON_PORTAL_URL__ || "https://x8z7zd.csb.app";

const BRASAO_DATA =
  "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACWAHgDASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAAAAcFBggEAwIB/8QAQhAAAQQBAwMCBAIHBAcJAAAAAQIDBBEFAAYhBxIxE0EUIjJRFWEIcYGRobHRFiNCUhckNUNiosElNGNygpKywvD/xAAcAQABBQEBAQAAAAAAAAAAAAADAAIEBQYBBwj/xAA1EQABAwIEBAUDAwIHAAAAAAABAAIDBBEFEiExBkFRYRMigaHBMnHwBxSx0eEVI0NicpHx/9oADAMBAAIRAxEAPwDGWjRrtwUWJOzESHOm/Ax33Q2uR2BQavgKIKkigas2KFn2rSS2XFqT2vgshuTNsYjGJbVKfPyhbgSKHk/c0LNAE0DQOtD7G6Hpw28WM8MrHVjENhTMaQgOuuLUlSSkKAT8wV2lKkp+44rmv9VNv5ra/W3F7lx0DIuRn3WPUeWgECyGewlQpFtlCbUfqKqNjg/gEC7uqj+OHGzeirPTbo3lNx5GbFzi52DVCWm23Yh/1lNkENrJom01YCh8wPI1eHugTWD25uORNYGXkrjLcxIStxDrCh3BKVAFIWolTXsRfj3Gn6/l48HBJyDzhTCLHxDqfUQhtaXASCkjmiebNJA7iSBqN23uDDbsblpxrrMvvcUhxTK2nHEp7fKVhxRqwCO4A0ofLo7YmA7aKO6V5G6zP0A2tgN4YzK4ufi2HZ4kx2mpDjqk36y0pbTwflAUhRUQLIWR7AHS0voj39P0Yh1rGO5JyUKUO74ZLIFen9PAAHdwkc0K1RtqdLY+14eeiMvtw42akshqQXwv4eN3tkd4J8IKnFWDZA5PkDQL8PEu9N04h7ecpUQLKE5k5Bv1u8ukUXvBVZ7K81x5PFNjOIz4dHCIJMpc6x8hdf725dtz6IJpmVczzI0kAXGtrHt37rDXW/auC2dgcRiocRpyeqQ8hU1K7UQ0opcSqqC+5SwQqhQQAPJ1cZH6P7+VxG3V46PHxrrcdtWYV67ji3yrsBKB8yQQUum+E1WrXvHpYdzwMMwl+NNZxEh3ufU+UiSx3OX2AEfKvtaN3YSSQfAN73LurAbRcixJ7rUdxpaUI7y0hwIKOCtXqJ4s38oUQE32+NXj4mZ3dOX5yXYJZPCZc681mTqV0ayu2sjCjYN2VnTMUr5GohHwwBSAHFXQ+qrISPlJ4Gl7ubCTtvZp/E5ENCQyefTWFAg8g/cWKNEA0RYGt6tZdift9eQjOEwwwZDQLiFtoS2ASVFQuga5FpIoixrOHSXb2d3R1nye58nj8kyww4+UOD7hRZ9MKT9fa2FptJ+pKbPNED4mm1tPhSWTOF76ge5SH0a01v7oa3l9yyNwM5Rj4NxKlPQmE+k40UISKUshR7iruJKk/YeVWM5ZyLFg5eVDhTfjWGHC2iQEBIdrgqAClDtu6N8ijxdaC+Ms3R45Wv23XFo0aNDRUaNGjSSWh+k3XB5MaDtvKwnHvTjG5HxFLfcRZHcogqFgdxVd3YA5GmltvcWC3869hsjjWFqhqS+uPKVTarohQWQVEdwHbzaiFWkdusUsuuMvIeaUUONqCkqHkEGwdax6G4iLJlIyv40peSciltcOGgi21H5XO5wBKhwrtUPZSvf6bCBzXxuzHzD3/uq+ZjmyAN+k+yunUrCyNwbJOOgRbS2puUpgtemCEq7kslSiCQSCi/FKOoHpdhsgM87lJjc+GlADbqFQ3HESVBRKeQOQi3b5q3BzxphfGMpbTkHEslDZUlx4U4pntJF+u4QirsUAPq4v3417ixyUpefzUPtK1EKW8p9LqaUEJKB2tj2+k1Y/bozJHCNzAL39rIL4A6RshNre913PNyjCLTsGa23IBElFxkNrBR2kAEkgGhx5q9UcbPkDDnbozSRgzkvjzBDrIcKq7a7+6q7a4qr5rX2Ope0okv4SS3loMlp1Sw6xAaCTdi7Cl8Uoj9QGuxzqVtFEe/xrMK/vPU+WOyVXd3Xb99EjiqAPKy/omyiB5u53urSyiV8IGm4U1xpgARkXGW2gBHaAQCCQLPA5qtK3qPhMx/bV7LMRp0mKtCW4qhGcSllZNuDkfKD2s0bolKtS6+qm0ZTqmGY2amSFuJWp2Rj2e0dtc33IFUkA/kTqy43duGyKS7jc1EdpaSoturZDIpPcntNtk0D5NWfPvrkZkgkD3N1SmhjnjMYdoq50Rx8vG9NWYuShuIU8VyQyqKsEA0pTRP1JonssigAB7HX3nNybd2RNGExsCO0uQsvKZjWpCPKu7vACq7ie4hXylSaB7jq7Lfbb75qmm2u9QSlxYDS3e4gWXmyUea4IP08/kleuGMh4vOv5N/LKOQXFCWYkkElLaVJslaAUo+oEq5BCB9JCQocAa51nGw5okwc1t2i55Kv9YutzjqZ+3NvpdS0W+1EsOjvbUVfMAQO7xzfdYJAIsG896+33XHnlvOqK3HFFSlHySTZOvjVdJJnPZWEUYYO6NGjRoaIjRo0aSSmtq7bnbkkPMQXY7amUhSvWUQCCa4oHTU6Z4Xcuynn3o34ct14gLWHCq01Vdq2iOLJH38fmKn0Vc9Ofkjf+6R/M6aLUpCnUJW4G0lQBWeQgE0SQLJA8mgTxwCeNafDMOp304nkvfVZLF8TqoqgwRWtovPOncmanGbPnrccH0qS4tPpnuJ+U3aAf8gPb+Q1GLws9RWStunFlxYBoFR8ngVentiOmQlbBkyUZzGuuyHG5LEtC1eglpAUFWogEcKVfHBSL96Va0R05lWPGViKZS52fGDv9E8eR8vcRfF9v5+OddwHinCK980dH/pEg6Hl6X6jrooFfBiUQY6Y/Vsq3+BTfuz+8/wBNH4FMvy1+86fEfp+yenzsc5XGqmuSEzG5yFn0fSCaAK6JKaK1WKFkewvStLTH44caMtC9L1PT+NJWGPF3fb3VfF1V8+OdHwbjWgxczCAn/KJB0Ow57f3TK3DK+jDDIB5rWVZ/Apv3Z/ef6a+2sNkWlIUhxCShXcn5jwfv4q9PNzYMc9PW205XFiWl4zVzyu2SyUVQcqwjtAVZsWD7G9K0JjfjAgnLRQwXOz4yl+iOPJHb3VfF9v5+OdcwjjPD8YbN4Jv4ZIOh5c9ufLmu1mHYhQlmewzDT1XNjZm7McsOw8mppQ8K7yQo2D8w/wAQH+U/LzyNVLqHgN07xkNPzH4CnWj/AHayvsCU0AflQ0E89qSTxz+86LyvTER9gxZCs5jGnWHVyXpa3CGFNLCQKUASfpSRxyVGva0+7JQl1aUOhxKVEBYsBYBoEA0QD5FgHnkA8ag4Ri2EcSNkNNu0kGwtsfndHqZMUw0t8TmLi+vykNuvbc7bchlic7HcU8kqT6KiQADXNgahdMLrU56k/Gm/90v+Y0vdVVfA2CodGzYLVYdUPqKZkr9yjRo0aiKajRo0aSSuvS6U3C/FpL7iWmUNN9y1GgLVQ1ZHt64NsGpyln3CW1/0o/v1UNj4yRmMbmsbFU2l15tkJU4SEinATZAPsDqfY6VuFsF/NJSs+Uojkj9hKhf7tWjcXko4GRttY3/krM13+HtqXuqn2OmnoOxTFw/XWQzEh4uJkoTWMZjfDKgOskNOpUKX3qUASpXJsKFXxVm4VmaH0hbKu9B8FKu4fv8AfVNm9Lp6P+5ZSO9+Tram/wCXdqGd2BulC+1MBDguu5L6AP4kHUPDa2koS90MTQX/AFW0v3O+uu6Ur6GtAtUaDa9vmyez/WB7HqZhvqgNYtmMmKvHOu93qNgAGyaUSQCOOPy0vf7Z4Gv9pi/t6bn3+/bWqrB6b7gf5fVEiD3C3Co/8oI/jqVV0sd9G05tBd/ymMQn/wB3d/00OjrKXD3ONJG1mbfc3++u+u67V1dBLlbUVGa21th/0CmvH6xKmLMZgwF4dcT4T8NS+R2t1V9/1hVcX4r2vnVQdybDIt6ShtPuVLA0vZnTvcrDhSywxKT7KbeAH/NWuZjYm6HT/s3sH3W8gf8AXRcNq6PDmuFNE1ubex3+/fvuUWpdTVlnSVIIG1yNE6sx1zfcjSMXMyUN/FPRUxUwGm+5tttNdnapIJCx57iTzVggACktb2wbhozVoPt3Nr5/cP56gonTHLrSFSZ0Nm/ZPcs/yA1+TemOYbBVFmw5AHsSpBP8CP46Hh9dBhxcKSNrAd7Dfudd+6FPPhtQ4NlnuR3+bWXh1QmNTjipDDgdaWy4UrSbB+ej/LVL1Yd2Y+XjMbh4c5sNvttOhSQQa/vVHyPPn76r2iVkpllMh5gfwFc0DWNgDWG41sfUo0aNGoymI0aNGkkmD0VIGSnkgkemjwaP+LTULiPZKx/6h/TSp6MqrIzk/dKD/wDLT0w205WXhtTIWQx5jpH+uOOvBsQuaBWF0aIqiAQTYBsapcbxH9p4dzYW6dytZw7w5glfTSVOIxguzWBN+TQbKFgx3p0tqJDZdefeWENoSRaiTQA413bowWR25llY7JtKQ6AFJUkjtWk+CnjkcEfkbHtq24KN09xmXhsDJ5fM5AvtpSuI2lqOFlQINqolINci/FgHxqf6rI2O/vSTHzz+YgzShs/EMJS4zRQAPlAKuPegf1+wyT+KqoVbY2s8haT9Avpbtf2Up/CfDn7prW0ZyW/3XPca7JPd3/m/eP6aAoFzttQFXdj+mrZJ2QsIVPhZvGS8IgEuZBLoCWhwKWjlQWSaCRZJ8apzpCJBSFBQAIChdHnyLAOttwniLMSr2xPs5tjpYD4VJxvwtw/SYHJU4fEA9ttbnS521K6AL47j/D+mpzZW2pW6sq5joclplxtkvFTt0QFJFcA82ofu1W/V54On/wBB8/iJODi7ajhaskxHdkSFpapABd4BJokgLSPBHB54F6njWRmD4Y6ekpw5x5gfT3On5deN8P4bDXVgjndZv89kmNx4p3CZqTin3UOuxyEqUjwSQDxYv31H2B7nTU6+5/DSgMNECm8hCmXIQWa7gUEghQ4PkcE3z+vSj9WtTOFo4cTwyOoqKcNcRrpv39d1HxmgjpKt8UTszQfweiWHWk/9swwKr0T/ADGqDq99Yz3ZWGf/AAlfzGqJqqxRjWVb2sFgP6Le4LpQRfb5Ro0aNQFaLSuy+kWyZ+Tix5sCQ9GWv0lL+KWlwq7SUmhQ9gTVe/5at0/pD0Tx8t6JkIGRiLaICnXnZSGuQKpw/IfPsTR4OqX+h9M3BnNzTlT8o5Jx2NZCwy8kKJdXYCgqrsDuvn/F+3TgyO4sgzEW7t3PRZqswy89jI2SIjuoUSQksrUAlaAog9ihYTXNEAy42B+wTWg63VC3TsHZm0sHi8ttGI821lFpWXHXVqKkemVJpK+Rwq/H6/trjxO48zikx0QJhYbYWpQbSkdrpVwQ4PCwRxRuh4o2dXfrtJSiLhoT0lC323O5V0FOEoIKgBVcgXQr5x40stZjiKnEr4w5txbp3K9N4GZBNQyxy2Pn2P8AxCvmGx2Kz2Wg5bA9kSYzIbem4sq+lIWCpxkn6kDyU+Uj8qJsHVvDwxvmRnM88uPikobQ2hsj1pawgEobB9hYtR4F+b40udoy8dj89HyOSEktxD6zSY6gla3E8pF+wJ8n7X58GV6hbkh7skR8yIz8TI9voyGVOhxoJAtKmzQIBJNgjg/e71gpMPqRXsLb5ACL9L209t1cyU8wrmta/wAgFs3QHl7brnyW8co/KT8CG4GPbaUyzj2xbCW1eQoH6yaBKjySARVCqnJPa6keT2/9ddOvNnG5DLZVqDi4rsqQpF9iBdCwLJ8AWRZNAX516BwjHDR17XkBrQCSfTmVRfqFSQs4fljgGpLdtSdVzeoPvpv/AKMcCb/ambmFwnhAEFbKX1JIQXC4ghIPuaBJq64urGu3YHSPGxHGpm5nkz5KVdyYrZIYBHjuJAK/Y1wPIII8uKL6MaM3HjtNMstICG20JCUISBQAA4AAA4Gh8afqLS1VNJQULS/NoXch9uq8dwLhaaGVtTUHLbUDms09c40uN1Iykh+C9HYkOAsOKQQh0BCASkng8+a8E1qj+pdm+dbEzsHH5nHOQcrCZlRli1NugEXXkHyCL4III+40h+oHSZ+D60/bDqpccAqVDcNvJHHCCPr9+DR4AHcTqz4N/UShkgioKwGNzQGg8jbvy9dO6i43wtO2R9TAcwOpHMKs7M6b7X3vCk5XdC1JjY90pv1i2O0pBJKrAAFDn+XOp3D9H+iOXkmNioz89SQSVsTH1t8Vf94D2Xz4vnmvB149D8tFObyuyMqy1UxpSnGH0nuWqiktkHx8qXLB+1atWE3BufHzk/2ln4nDwGuxtxqWwhtJWVKtplYdJICACFkEH3A5rR17BLUSOaQVaYS21IwdAlXvrpHsqBPmMwMY9HYSfSbX8WtSwrtsn5jX3Iv7Dg6NcH6XuS3Bh95xW4ORXGxk+MHUts0lRdTQUokC/HZ7+37SarC5vRTbOPNXX9F7B5HEdGcllMcyV5TIJdeitrpJ9QJIbFq47TTZBPHzc8atsHCqZzOPxkrZyUuKmByXLjLWY5Q2fVacQon5E96QCyQLJHkAXP8ATdljbvT/AAmLlvIS61GS2hI+twCwkhI5Py14B1OyFSJLRUVqgxQCXFqIDhT5NG6QK8nyOeARense5vlsngrKHWHMzJPX+e3MaKWPhUxoi6IStvtDgWCeD7ix+WuTvTd0NNTrvt/F702G3vPaKG35WIeKmlNtUl1LayFACvmHHt9XHPGk5DmNS4rUpgktup7k3V/q4uqPn8xrR4HI3K6J24N9fzl8rM41C8ObIDbS359/hd4Uk+w0dyftrl9T9WpbauByu5su3i8PFU++vlR8BA+5PgDVzPLDTxmWUgNAVLGyaRwa0kkr223hp+4cwxisXGU/JeIACRYA9yT7AeSTwPfWgf8AQVg/7IfA+qr8arv+O7j2d9fR2eOy/er9/wAtSWCw+3+jmyjkZaRKyMhQaceCCS44QSEAhJKWwEkkkEkAmiaTqlHrdvIMGV+D4ssVdfh8m6q+6/Uqvy+3PnjXiOPcV4ji1RfCjkiYd9sx/p2Wsp6ajw1mWuOZ7htqbJP7hxUzA5qViMkyWpUZfYtJFe1gj7gggg+CCCLBB1wdyfy1qjK4fbPWDaH4m3HDGQZ7mEPEELacAB7CogFTZ7goGvCroEkazLu/b+W2tmXMZlo5adQT2qH0uD7g+45H79b/AIU4ppcZZ4MrQydv1A8+4VNiWFPprSxuzRu2K4O8a/e8a5PU59teU2a1DiOyXjTbSe5Xjn8hfF+KGti8RMaXOAsFVMje4hrTqVIdLss8z+kBiksBSG0t/DSHUpuk8uE+9A8JJ+xOn1uzbuBb3jJUGdxS8jNYW8WMc00KQ4A2u3VAWCEAUpZ7bJFWNVn9HXbOJweyzufdK4UaXmX1FKpS0tgd1ntSVEc0CK8jtXXk6ccV9xtvvYdTkYlDtW2sKcSPzN0sfmOfyJ51iHzuMjpBzv8A+Ld08fhRtb0ASQ/Ss2q5k+nMHcDeOchyMYlKFxyoOLQ2DQSSkkUAVKJBP0j9hpu7zjwdy7NzGHElNSIy2nh4W2CCCSk8g1fkDRqIWOdrZGzBLnBZqZ+FYHecR0utvspZdQOKCbKG114topIHsbPnVv3rB3Bu1uKxiTAVgHWUPOh6Stv4kk2UL7ElRQABaARZPKgAQcfYDqfuPDbOXtmMtC4xUFNlwk9lEnx9xfBBHHBsAAOH9Gzf53Jip+wc9lpUSZJ7lRZcdfpOqBNqCVUQFe3jxVDgnRWSjMDzSaC1NWNuNvEZf8DzeaxkuP6YjyY2PgiPGxwPCfUdU4avhIT9RvgccoPqrtV7p9vF5gNFO357hdiO9vysLPlP2CSf2A/vLn3fEZx+EfwSMW/htpsvojuoabC5mYfJFNtWSaJq1k2aNUAdcGVx8zJ4fH9Nt1Yf4NmQ045DnzJyZKktNDuWhRQE0pKaHuACObAOp0ZdG4SxnUe6ZUQNmYWuSh2vgp+4c4xiMe2VPuqokjhAHJJ+wABOtedMNlYnZmHRGhtpclrSDIkkfOs8Ei/IFjx/+GZIOL6g9E858dGi/ieH7fRU4Eer2t3dGgFKA4NilCuRQovvpv1i2buuG2pGRax8k8FmS4Ep7qukrNA+RwaV/wAI155+o1XjFcGsp2nwLa23v37eyPgdJS05JefPy6W7d139fvRVtbEpf7e38XbruPBPovV/Gv4aWakxf7GHkd/wX/007d7bchbuwScdLWQEOh9ogkJKwCBdEEghRHBHm/bSLPTbqGWTjvwpwMV6YeOQart8eO+6rm6uva9Y3BaiE0wje/KWnW+iq+IKGpdWeLGzMHWGnJNPoEWhtfLBkp7Rl3PB4B9Fm/43qR6n7KxO8sOuNMbS3LQCY8kD50Hmhfkiz4/P9d92xdtxdpbf/DWFglbpfeIJKe8gAgWSaASByeas+dVLqN1i2btSI4peSZnyRwGozgKbomlL5APB4Fq/4TqsZJXz4mZ8MDi4HQgfyen3Wko6aOCgZDVW22WYtzYGft7Ov4jINlMhpVChwsHwR9wRWvnpvtaX1D3W1EYQTg4LoXMf/wALih7fZQH28E0PHOri7h96dac2clmWziMGhBQlSU+mpbd2AkKBKEk2SpVqUKoAE1eMwxF2Zh17C29i3ksuQ1uSlISQ9IYUhSVqjG/mW2e1RSeSL8kkn6HhxGrqqWOKcAPsM1tie3b82Wbhw+Jkxezbl2X7uh2JlMh6GTx77GyMehMeHkYqEOFl8BJTI9S1KDYsDu5BIpXANGy9o4yBm8tl9xY6IRCSxIg5DHNhiE+ykGlhCFUXCQStBBAPbXBBPttrM5bFNbdgRMlgs1jJxSyzBx+NW2pTBNLevu7QUGytJHubomwvv0kOoMLazKdjbJEeIv1viZxZAKWVEhXaE8gEnmvYe3IOmSymJpZ1VlsLBMJrKKebzu9cyp1EKFEdT2CyQkp5SkeD2o5IHBJB83o1l/cnVTc+b2g1tp51DEYE+sWfl9YE3R/WfNk3QAoWCaheMRo1MyX3VD10Y6ZKx05mdCfWxJYWFtuJ8pI1z6NAT1rDYXUZvqjhcVi3skziN3YqWiVHU833syFpSpNkHyCFH8wf3q7d9pzityxWsw6jNTXXmIb7UVJjx2kPLBEVpRskuBJK1nkIRXAUayRCkyIUtqXEecYfaUFNuIVSkke4OtJ9K+vOKyxgYrqNHaEmI6hyJk6pIcTaQpf+U0Tz48k1wNTaeqyEApDRNDZUjIYhY2xkX4j0HFxHZeZdfcW6iGFnuZjpcJ57EBRJIIoCq4uvTeluxOokORuDbapeIlLdWgvspLKlKHJsDjmxZIJ/aNS52nPyeIRGwOex87GPOKycua+kuqyMkrCkIcQgppsJCeEnmgKAFGQ2VkX8D0YlbhnNehMKZk51pae0h1TqyEEEcG+0UR50SZrHjMDqTskQClmjp11n220UbX3Z8VFX8wS3IUy3XNH5FDuNe5Tz/DXq1A/SVcT6Iy7SUj3VKcH/ADedTFO9N4eObgTnWJr2DddyzT8kraEpwtoZWQokIIcWQSKtKCT4J1fOk+VkzNlTW05I5qTjZsqK3KW96hkhCyW1FQJsEFNG/GotRhkLh4jmh33CQzDYpZnph1e3HHrdu+GobDfJZDy5KFD3PzqISePIGrJtTpH09wWYiRZ8w5jOLZ9dgzHwt1aEm7RfAAPgpCTQJvjXxNihzppj9x5TL5OdGyr0R7OtrkqU2GSsFwIQCCgJPBCa4BButRWa2xhlb4De30uP4aC5GU4YDqiuCuSVIJaWkkpKVIZdAFgWqxRIMiGkjaLXsB0C5l6qccy2Y3kjMY/AO43GYrHwkB/HTY47pK1d4cQtYUPTAKFJ7h/iF6go8rc2R2FCxi8FlsjOQtD238rHAUuMoLIKH1mgkoKSkk8LBHAIvUy5soYtzNSd1bibgsuOlbE+MtKHX2lAeql5tSSkgqAUeKCiojtBI0s95dacXtPDubV6ZqkuoAKTOlSFOpaNUfSBNcm1cfL3GxY41IdNHGPLr0Xb20Ct3WPf2H6bYnIY3bKm29y5gpcloZWS1Hc7e1bgR9KVHnkD5jV3XGTZDzsh9yQ+6t11xRWtazalKJskn3OvqdKkzpbsuY+4/IdUVOOOKtSj9ydeOqt7y83KSNGjRpiSNGjRpJI0aNGkkrDs/em59oyPWwGYkwwT8zQVbauRdpPHNAWKNe+nHiP0kl5HHHE752xFyUN1JEhUcD5+bSPTUaFUOe7gixo0ac1xB0XCmV07k9P9w7ejZ7EbakYyGJpc9AKSS64gEArBJtI7lULrm6uqumCe2/gpGRm49ma2nJPh1xkJR6aFpSE2gAjtBFcWeR7aNGphcXNNymZiqdvPcWyunazuZWDyT6JS1s/Dtv202XOVlLSldg7iOa8/tOlTnf0iVxY7sLY214GFjrX3d3pJR3X5tDfv+YVo0aDK92105pvulHu3eW5d1v8Aq53LSJYuw2T2oB5o9o4J5qzZr31AaNGo+6cjRo0aSSNGjRpJL//Z";
const SUPA_KEY =
  window.__FISCON_SUPA_KEY__ ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrdmdxd3NqZmxjb3hndWdhYWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODQ1MjIsImV4cCI6MjA4ODY2MDUyMn0.t-j-S-1JEfI_N-JR-CrNsJ6YoW24nnnHnolURWBy6c0";
const supa = {
  headers: {
    "Content-Type": "application/json",
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
  },
  async get(table, params = "") {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/${table}?order=created_at.desc${params}`,
      { headers: this.headers }
    );
    if (!r.ok) return [];
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.text();
      console.error("insert error:", e);
      return null;
    }
    const res = await r.json();
    return Array.isArray(res) ? res[0] : res;
  },
  async update(table, id, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...this.headers, Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.text();
      console.error("update error:", e);
      return null;
    }
    return r.json();
  },
  async delete(table, id) {
    await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: this.headers,
    });
  },
    async rpc(fnName, params = {}) {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fnName}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    });
    if (!r.ok) { console.error("rpc error:", await r.text()); return null; }
    return r.json();
  },
  async uploadFoto(file, pasta) {
    try {
      const blob = await compressImage(file, 900, 0.75);
      const ext = (file.name || "foto").split(".").pop().toLowerCase() || "jpg";
      const nome = `${pasta}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const res = await fetch(
        `${SUPA_URL}/storage/v1/object/fiscalizacao-fotos/${nome}`,
        {
          method: "POST",
          headers: {
            apikey: SUPA_KEY,
            Authorization: `Bearer ${SUPA_KEY}`,
            "Content-Type": blob.type || "image/jpeg",
          },
          body: blob,
        }
      );
      if (!res.ok) {
        const t = await res.text();
        console.error("uploadFoto error:", t);
        return null;
      }
      return `${SUPA_URL}/storage/v1/object/public/fiscalizacao-fotos/${nome}`;
    } catch (e) {
      console.error("uploadFoto exception:", e);
      return null;
    }
  },
};

// --- Admin Master — credenciais configuráveis via window.__FISCON_ADMIN__ -----
// IMPORTANTE: Em produção, remover este fallback e usar apenas o banco
const ADMIN_MASTER = {
  id: "master",
  name: "Administrador",
  role: "admin",
  email: "admin",
  senha: window.__FISCON_ADMIN_PASS__ || "FiscOn@2026!",
  matricula: "000000",
  telefone: "",
  endereco: "",
  bairros: [],
  ativo: true,
  isMaster: true,
};

export { T, css, INFRACOES_Q61, INFRACOES_Q62, maskMatricula, maskCPF, maskTelefone, Icon, calcPrazo, compressImage, SUPA_URL, SUPA_KEY, PORTAL_URL, supa, ADMIN_MASTER, BRASAO_DATA, RECORDS, RECLAMACOES_INIT };
