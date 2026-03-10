import React from "react";
// ═══════════════════════════════════════════════════
//  FISCON — Impressão (DocPreview + Térmica + A4)
// ═══════════════════════════════════════════════════
import { useState, useRef } from "react";
import { T, Icon, calcPrazo, SUPA_URL, PORTAL_URL, supa, BRASAO_DATA } from "./config.jsx";

function SigCanvas({ onSign }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return [src.clientX - r.left, src.clientY - r.top];
  };

  const start = (e) => {
    drawing.current = true;
    const ctx = ref.current.getContext("2d");
    const [x, y] = getPos(e, ref.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = ref.current.getContext("2d");
    ctx.strokeStyle = "#2B6CB0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const [x, y] = getPos(e, ref.current);
    ctx.lineTo(x, y);
    ctx.stroke();
    setSigned(true);
    onSign(true);
    e.preventDefault();
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    const ctx = ref.current.getContext("2d");
    ctx.clearRect(0, 0, ref.current.width, ref.current.height);
    setSigned(false);
    onSign(false);
  };

  return (
    <div>
      <canvas
        ref={ref}
        className="sig-canvas"
        width={380}
        height={120}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="sig-actions">
        {signed && (
          <button className="btn-ghost" onClick={clear}>
            Limpar assinatura
          </button>
        )}
      </div>
    </div>
  );
}

// -- Impressão via Print Dialog (gerar PDF pelo browser) ---------------------
const CSS_PRINT = `
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:15mm 20mm}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px}
  p{margin:2px 0;font-size:10px;color:#555}
  .doc-num{font-size:14px;font-weight:800;text-align:center;margin:12px 0;text-transform:uppercase}
  .doc-header{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
  .doc-section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #333;padding-bottom:3px;margin:12px 0 6px}
  .doc-field{display:flex;gap:8px;font-size:11px;padding:2px 0;border-bottom:1px dotted #ccc}
  .doc-field-label{font-weight:700;min-width:120px;color:#333}
  .doc-infracoes{font-size:11px}
  .doc-sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:20px}
  .doc-sig-box{flex:1;border-top:1px solid #333;padding-top:4px;text-align:center;font-size:10px;color:#555}
`;
const gerarPDF = (docElId, title) => {
  const docEl = document.getElementById(docElId);
  if (!docEl) {
    console.error("Doc element not found:", docElId);
    return;
  }
  try {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS_PRINT}@media print{@page{size:A4;margin:15mm 20mm}}</style></head><body>${docEl.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title + ".html";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.error("Print error:", e);
  }
};

const printDoc = gerarPDF;


// --- Impressão Térmica 58mm -------------------------------------------------
// Gera HTML idêntico ao cupom térmico de referência e abre em nova aba.
// QR Code aponta para o Portal do Cidadão com o código de acesso.
const imprimirTermica = (type, data) => {
  const isAuto = type === "auto";
  const numDoc = data.num || "";
  const hoje = new Date().toLocaleDateString("pt-BR");
  const portalBase =
    typeof PORTAL_URL !== "undefined" ? PORTAL_URL : "https://x8z7zd.csb.app";

  // Infrações/irregularidades
  const inf =
    data.infracoes && data.infracoes.length > 0
      ? data.infracoes
          .map((inf) => `<div style="margin:1mm 0">&#x25AA; ${inf}</div>`)
          .join("")
      : "";

  // Bloco de assinaturas — só para Auto de Infração
  const assin = isAuto
    ? `
    <div style="display:flex;gap:2mm;margin-top:5mm">
      <div style="flex:1;border-top:1px solid #000;padding-top:1.5mm;text-align:center;font-size:10px">
        <span style="display:block;height:6mm"></span>
        <span style="font-size:12px;font-weight:700">${
          data.testemunha1 ? data.testemunha1 : "Testemunha 1"
        }</span>
      </div>
      <div style="flex:1;border-top:1px solid #000;padding-top:1.5mm;text-align:center;font-size:10px">
        <span style="display:block;height:6mm"></span>
        <span style="font-size:12px;font-weight:700">${
          data.testemunha2 ? data.testemunha2 : "Testemunha 2"
        }</span>
      </div>
    </div>
    ${
      data.obsRecusa
        ? `<div style="font-size:9px;margin-top:2mm">Obs: ${data.obsRecusa}</div>`
        : ""
    }
  `
    : "";

  // Prazo/penalidade — Auto tem multa+prazo; Notificação só prazo (sem R$)
  const penalidade =
    isAuto && data.multa
      ? `
    <div style="font-size:14px;font-weight:bold;text-align:center;border:2px solid #000;padding:2mm;margin:2mm 0">
      MULTA: R$ ${data.multa}
    </div>
    <div style="text-align:center"><b>Prazo:</b> 10 dias corridos</div>
  `
      : !isAuto
      ? `
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="font-weight:bold;text-align:center">PRAZO PARA REGULARIZACAO</div><br>
    Prazo: ${data.prazo || "1"} dia(s) corrido(s)
  `
      : "";

  // Código do contribuinte e QR (só se tiver código)
  const qrUrl = data.codigoAcesso
    ? `${portalBase}?codigo=${encodeURIComponent(data.codigoAcesso)}`
    : "";

  const defesaBlock = data.codigoAcesso
    ? `
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="font-weight:bold;text-align:center">DEFESA ONLINE</div><br>
    <div style="text-align:center">Acesse o portal para enviar sua defesa:</div><br>
    <div style="font-size:16px;font-weight:bold;text-align:center;border:2px solid #000;padding:3mm 2mm;margin:2mm 0;letter-spacing:3px;word-break:break-all">
      ${data.codigoAcesso}
    </div>
    <div style="font-size:9px;text-align:center;color:#444">${portalBase.replace(
      "https://",
      ""
    )}</div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="font-size:10px;text-align:center">* Documento gerado pelo FISCON *</div>
    <br><br>
    <div style="text-align:center"><img id="qrcode"></div>
  `
    : `
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="font-size:10px;text-align:center">* Documento gerado pelo FISCON *</div>
  `;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${numDoc}</title>
  <style>
    body { font-family: monospace; margin: 0; padding: 0; font-size: 12px; }
    #printArea { width: 58mm; text-align: left; font-size: 12px; line-height: 1.3; padding: 2mm 3mm; }
    #logoPrefeitura { width: 25mm; margin-bottom: 5px; }
    button { width: 100%; padding: 10px; font-size: 14px; margin-top: 20px; }
    @media print {
      body * { visibility: hidden; }
      #printArea, #printArea * { visibility: visible; }
      #printArea { position: absolute; top: 0; left: 0; width: 58mm; padding: 2mm 3mm; }
      button { display: none; }
    }
    @page { margin: 0; size: 58mm auto; }
  </style>
</head>
<body>
<div id="printArea">

  <div style="text-align:center">
    <img id="logoPrefeitura"
      src="https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg"
      alt="Brasao Prefeitura">
  </div>

  <div style="font-weight:bold;text-align:center">Prefeitura Municipal de Vitória da Conquista</div>
  <div style="text-align:center">Secretaria Municipal de Infraestrutura Urbana<br>Gerência de Fiscalização de Obras</div>

  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="text-align:center;font-weight:bold">${
    isAuto ? "AUTO DE INFRACAO" : "NOTIFICACAO PRELIMINAR"
  }</div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>

  <div style="text-align:center">Nº ${numDoc}</div>
  <div style="border-top:1px dashed #000;margin:6px 0"></div>

  <div style="font-weight:bold;text-align:center">DADOS DO INFRATOR</div><br>
  Nome: ${data.proprietario || ""}<br>
  CPF/CNPJ: ${data.cpf || ""}<br>
  Endereco: ${data.endereco || ""}<br>
  Bairro: ${data.bairro || ""}${
    data.loteamento ? "<br>Loteamento: " + data.loteamento : ""
  }

  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="font-weight:bold;text-align:center">${
    isAuto ? "INFRACOES" : "IRREGULARIDADE"
  }</div><br>
  ${inf}
  ${
    data.descricao
      ? `<div style="font-size:10px;margin-top:1mm">Obs: ${data.descricao}</div>`
      : ""
  }

  ${penalidade}

  <div style="border-top:1px dashed #000;margin:6px 0"></div>
  <div style="text-align:center">${hoje} — FISCON</div>
  <div style="border-top:1px solid #000;padding-top:1.5mm;text-align:center;font-size:10px;margin-top:3mm">
    <b>${data.fiscal || ""}</b><br>Mat. ${
    data.matricula || ""
  }<br><small>Agente de Fiscalizacao</small>
  </div>

  ${assin}

  ${defesaBlock}

</div>

<button onclick="window.print()">IMPRIMIR</button>

<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
<script>
  ${
    qrUrl
      ? `
  window.addEventListener("load", function() {
    QRCode.toDataURL("${qrUrl}", { width: 180, margin: 1 }, function(err, url) {
      var el = document.getElementById("qrcode");
      if (el) el.src = url;
      setTimeout(function() { window.print(); }, 800);
    });
  });
  `
      : `
  window.addEventListener("load", function() {
    setTimeout(function() { window.print(); }, 400);
  });
  `
  }
<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank");
  if (!tab) {
    alert(
      "Permita pop-ups para este site e tente novamente.\n\nNo Chrome: toque no ícone de bloqueio na barra de endereço → Permitir pop-ups."
    );
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

// --- Modelo A4 Governamental -----------------------------------------------
// Gera o documento A4 idêntico ao modelo aprovado (auto / notificação)
// e abre em nova aba com botão de impressão/download.
const gerarPDFA4 = (type, data, portalUrl) => {
  const isAuto = type === "auto";
  const numDoc = data.num || "";
  const portal = portalUrl || PORTAL_URL || "portal.vdc.gov.br/fiscalizacao";
  const qrData = data.codigoAcesso
    ? encodeURIComponent(portal + "?codigo=" + data.codigoAcesso)
    : "";

  // Infrações — com ou sem valor dependendo do tipo
  const infRows = (data.infracoes || [])
    .map((inf, i) => {
      // inf pode ser string "6.1.1 - Desc (R$ X)" ou objeto
      let item = "",
        desc = inf,
        valor = "";
      if (typeof inf === "string") {
        const m = inf.match(
          /^([\d.]+)\s+[\u2014\u2013\u0097\-]\s+(.+?)(?:\s+\(R\$\s*([\d.,]+)\))?$/
        );
        if (m) {
          item = m[1];
          desc = m[2];
          valor = m[3] ? "R$ " + m[3] : "";
        }
      } else if (typeof inf === "object") {
        item = inf.id || "";
        desc = inf.desc || "";
        valor = inf.valor
          ? "R$ " +
            Number(inf.valor).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })
          : "";
      }
      const bg = i % 2 === 0 ? "#fff5f5" : "#fffafa";
      const valorCell =
        isAuto && valor
          ? `<td style="text-align:right;font-weight:700;color:#b91c1c;white-space:nowrap">${valor}</td>`
          : isAuto
          ? `<td style="text-align:right;color:#aaa">—</td>`
          : "";
      return `<tr style="background:${bg}">
      <td style="font-weight:700;white-space:nowrap;color:#374151">${item}</td>
      <td style="color:#374151">${desc}</td>
      ${valorCell}
    </tr>`;
    })
    .join("");

  const totalRow =
    isAuto && data.multa
      ? `
    <tr style="background:#b91c1c">
      <td colspan="2" style="color:#fff;font-weight:800;font-size:12px">TOTAL DA PENALIDADE:</td>
      <td style="color:#fff;font-weight:800;font-size:12px;text-align:right">R$ ${data.multa}</td>
    </tr>`
      : `
    <tr style="background:#b91c1c">
      <td colspan="2" style="color:#fff;font-weight:800;font-size:12px">TOTAL DA PENALIDADE:</td>
      <td></td>
    </tr>`;

  const valorTh = isAuto
    ? `<th style="text-align:right;color:#b91c1c">VALOR DA MULTA</th>`
    : "";

  // OBS recusa
  const obsBlock = data.obsRecusa
    ? `
    <div style="background:#fef3c7;border:1px solid #f59e0b;padding:5px 10px;margin:6px 0;border-radius:3px;font-size:10px">
      <strong>OBS.:</strong> ${data.obsRecusa}
    </div>`
    : "";

  // Assinaturas — auto tem 3 caixas, notificação tem só o agente
  const sigBlock = isAuto
    ? `
    <table style="width:100%;border-collapse:collapse;margin-top:6px">
      <tr>
        <td style="width:34%;border:1px solid #d1d5db;padding:6px 8px;background:#f8fafc;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:14px">Agente de Fiscalizacao</div>
          <div style="border-top:1px solid #9ca3af;padding-top:4px">
            <div style="font-size:10px;font-weight:700">${
              data.fiscal || ""
            }</div>
            <div style="font-size:9px;color:#6b7280">Mat. ${
              data.matricula || ""
            }</div>
          </div>
        </td>
        <td style="width:33%;border:1px solid #d1d5db;padding:6px 8px;background:#f8fafc;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:14px">Testemunha 1</div>
          <div style="border-top:1px solid #9ca3af;padding-top:4px">
            <div style="font-size:10px;font-weight:700">${
              data.testemunha1 || ""
            }</div>
          </div>
        </td>
        <td style="width:33%;border:1px solid #d1d5db;padding:6px 8px;background:#f8fafc;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:14px">Testemunha 2</div>
          <div style="border-top:1px solid #9ca3af;padding-top:4px">
            <div style="font-size:10px;font-weight:700">${
              data.testemunha2 || ""
            }</div>
          </div>
        </td>
      </tr>
    </table>`
    : `
    <table style="width:100%;border-collapse:collapse;margin-top:6px">
      <tr>
        <td style="width:40%;border:1px solid #d1d5db;padding:6px 8px;background:#f8fafc;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:14px">Agente de Fiscalizacao</div>
          <div style="border-top:1px solid #9ca3af;padding-top:4px">
            <div style="font-size:10px;font-weight:700">${
              data.fiscal || ""
            }</div>
            <div style="font-size:9px;color:#6b7280">Mat. ${
              data.matricula || ""
            }</div>
          </div>
        </td>
        <td style="width:60%"></td>
      </tr>
    </table>`;

  const qrBlock = data.codigoAcesso
    ? `
    <div style="text-align:center;margin-top:6px">
      <div style="font-size:10px;font-weight:800;color:#0d3b7a;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">
        Acesse o Portal para Enviar sua Defesa
      </div>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}"
           width="110" height="110" alt="QR Code"
           style="border:2px solid #cbd5e0;border-radius:4px;display:block;margin:0 auto 4px">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;font-family:monospace">${
        data.codigoAcesso
      }</div>
      <div style="font-size:9px;color:#1a56db">${portal.replace(
        "https://",
        ""
      )}</div>
    </div>`
    : "";

  const hoje = new Date().toLocaleDateString("pt-BR");
  const brasaoUrl =
    "https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${
    isAuto ? "AUTO DE INFRAÇÃO" : "NOTIFICAÇÃO PRELIMINAR"
  } — ${numDoc}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
    #page {
      width: 210mm; min-height: 297mm; margin: 0 auto; position: relative;
      padding: 0 0 14mm 0;
    }
    /* Marca d'agua */
    #watermark {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 180mm; height: 225mm; opacity: 0.06;
      background-image: url('${brasaoUrl}');
      background-size: contain; background-repeat: no-repeat; background-position: center;
      pointer-events: none; z-index: 0;
    }
    #content { position: relative; z-index: 1; }
    /* Cabeçalho */
    #header {
      background: #0d3b7a; color: #fff;
      padding: 8mm 18mm 7mm;
      display: flex; align-items: center; gap: 10mm;
      border-bottom: 3px solid #b45309;
    }
    #header img.brasao { width: 22mm; height: auto; flex-shrink: 0; }
    #header .inst { flex: 1; }
    #header .inst h1 { font-size: 12px; font-weight: 800; margin: 0 0 2px; letter-spacing: 0.5px; }
    #header .inst p  { font-size: 9px; margin: 1px 0; opacity: 0.85; }
    #header .num-doc { text-align: right; flex-shrink: 0; }
    #header .num-doc .lbl { font-size: 8px; opacity: 0.7; margin-bottom: 2px; }
    #header .num-doc .val { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
    #header .num-doc .dt  { font-size: 8.5px; margin-top: 2px; opacity: 0.8; }
    /* Corpo */
    #body { padding: 6mm 18mm; }
    .doc-title {
      background: #0d3b7a; color: #fff; text-align: center;
      padding: 5mm 0; margin-bottom: 5mm; border-radius: 2px;
    }
    .doc-title h2 { font-size: 14px; font-weight: 800; margin: 0 0 2px; letter-spacing: 1px; text-transform: uppercase; }
    .doc-title p  { font-size: 8.5px; margin: 0; opacity: 0.8; }
    .sec-title {
      font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
      color: #fff; padding: 3px 6px; margin: 5mm 0 0;
    }
    .sec-blue  { background: #0d3b7a; }
    .sec-red   { background: #b91c1c; }
    .field-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .field-table td {
      padding: 3px 6px; border-bottom: 1px solid #e5e7eb; background: #f8fafc;
    }
    .field-table td.lbl {
      font-weight: 700; color: #6b7280; font-size: 9px; width: 120px;
      white-space: nowrap;
    }
    .field-table td.val { color: #111; }
    .inf-table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 0; }
    .inf-table th {
      padding: 3px 6px; font-size: 9px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .inf-table td { padding: 3px 6px; border-bottom: 1px solid #fed7d7; font-size: 10px; }
    .boxes { display: flex; gap: 5mm; margin: 5mm 0; }
    .box-prazo {
      flex: 1; border: 1px solid #fcd34d; border-radius: 4px;
      background: #fff7ed; padding: 4mm 6mm; text-align: center;
    }
    .box-prazo .tit { font-size: 9px; font-weight: 800; color: #b45309; margin-bottom: 3mm; }
    .box-prazo .val { font-size: 22px; font-weight: 800; color: #111; }
    .box-prazo .sub { font-size: 8.5px; color: #6b7280; margin-top: 2mm; }
    .box-defesa {
      flex: 1; border: 1px solid #93c5fd; border-radius: 4px;
      background: #eff6ff; padding: 4mm 6mm; text-align: center;
    }
    .box-defesa .tit { font-size: 9px; font-weight: 800; color: #1a56db; margin-bottom: 2mm; }
    .box-defesa .cod { font-size: 13px; font-weight: 800; color: #111; letter-spacing: 1px; font-family: monospace; }
    .box-defesa .url { font-size: 9px; color: #1a56db; }
    .box-defesa .sub { font-size: 8px; color: #6b7280; margin-top: 1mm; }
    #footer {
      background: #0d3b7a; color: #fff;
      padding: 3mm 18mm; display: flex; justify-content: space-between; align-items: center;
      border-top: 2px solid #b45309;
      margin-top: 8mm;
    }
    #footer .left { font-size: 8px; }
    #footer .right { font-size: 8px; text-align: right; }
    #footer strong { font-size: 9px; }
    @page { margin: 0; }
    @media print {
      #btn-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      #page { min-height: auto; }
    }
    #btn-print {
      display: block; width: calc(100% - 36mm); margin: 4mm 18mm 0;
      background: #0d3b7a; color: #fff; border: none; border-radius: 6px;
      padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
<div id="page">
  <div id="watermark"></div>
  <div id="content">
    <div id="header">
      <img class="brasao" src="${brasaoUrl}" alt="Brasão PMVC">
      <div class="inst">
        <h1>Prefeitura Municipal de Vitoria da Conquista - Bahia</h1>
        <p>Secretaria Municipal de Infraestrutura Urbana</p>
        <p>Gerencia de Fiscalizacao de Obras - FISCON</p>
      </div>
      <div class="num-doc">
        <div class="lbl">No DO DOCUMENTO</div>
        <div class="val">${numDoc}</div>
        <div class="dt">Data de emissao: ${hoje}</div>
      </div>
    </div>

    <div id="body">
      <div class="doc-title">
        <h2>${isAuto ? "Auto de Infracao" : "Notificacao Preliminar"}</h2>
        <p>Lei Municipal no 1.481/2007 - Codigo de Posturas e Obras do Municipio de Vitoria da Conquista</p>
      </div>

      <div class="sec-title sec-blue">Identificacao do Autuado / Responsavel</div>
      <table class="field-table">
        <tr><td class="lbl">Nome / Razao Social</td><td class="val">${
          data.proprietario || ""
        }</td></tr>
        <tr>
          <td class="lbl">CPF / CNPJ</td>
          <td class="val" style="width:40%">${data.cpf || ""}</td>
          <td class="lbl" style="width:120px">Data da Autuacao</td>
          <td class="val">${hoje}</td>
        </tr>
        <tr><td class="lbl">Endereco da Obra</td><td class="val" colspan="3">${
          data.endereco || ""
        }</td></tr>
        <tr>
          <td class="lbl">Bairro</td>
          <td class="val">${data.bairro || ""}</td>
          <td class="lbl">Loteamento / Quadra</td>
          <td class="val">${data.loteamento || ""}</td>
        </tr>
      </table>

      <div class="sec-title sec-red">Infracoes Constatadas - Quadro 6.1 da Lei no 1.481/2007</div>
      <table class="inf-table">
        <thead style="background:#fef2f2">
          <tr>
            <th style="text-align:left;color:#b91c1c;width:60px">ITEM</th>
            <th style="text-align:left;color:#b91c1c">DESCRICAO DA INFRACAO</th>
            ${valorTh}
          </tr>
        </thead>
        <tbody>${infRows}</tbody>
        <tfoot>${totalRow}</tfoot>
      </table>

      <div class="boxes">
        <div class="box-prazo">
          <div class="tit">Prazo para Regularizacao</div>
          <div class="val">${data.prazo || "10"} dias</div>
          <div class="sub">a contar da data de emissao deste documento</div>
        </div>
        <div class="box-defesa">
          <div class="tit">Defesa Online - Acesso do Contribuinte</div>
          <div class="cod">${data.codigoAcesso || ""}</div>
          <div class="url">${portal.replace("https://", "")}</div>
          <div class="sub">Apresente sua defesa online ou via QR Code abaixo</div>
        </div>
      </div>

      ${obsBlock}

      <div class="sec-title sec-blue">Assinaturas</div>
      ${sigBlock}

      ${qrBlock}
    </div>
  </div>

  <div id="footer">
    <div class="left">
      <strong>FISCON - Sistema de Fiscalizacao de Obras | PMVC</strong><br>
      Gerencia de Fiscalizacao de Obras | Secretaria Municipal de Infraestrutura Urbana
    </div>
    <div class="right">
      <strong>${numDoc}</strong><br>
      Emitido em: ${hoje} | Documento eletronico
    </div>
  </div>
</div>
<button id="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank");
  if (!tab) alert("Permita pop-ups para este site e tente novamente.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};


function DocPreview({ type, data, onClose, onSave }) {
  const isAuto = type === "auto";
  const numDoc =
    data.num ||
    (isAuto ? "AI" : "NP") + "-" + new Date().getFullYear() + "-00001";

  const handlePrint = () => gerarPDF("doc-preview-content", numDoc);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-sheet"
        style={{ maxHeight: "94vh", overflowY: "auto" }}
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

        <div className="doc-preview" id="doc-preview-content">
          <div className="doc-header">
            <h2>Prefeitura Municipal de Vitória da Conquista</h2>
            <p>Secretaria Municipal de Infraestrutura Urbana</p>
            <p>Gerência de Fiscalização de Obras</p>
          </div>

          <div className="doc-num">
            {isAuto ? "AUTO DE INFRAÇÃO" : "NOTIFICAÇÃO PRELIMINAR"} Nº {numDoc}
          </div>

          <div className="doc-section-title">Dados da Obra / Infrator</div>
          <div className="doc-field">
            <span className="doc-field-label">Proprietário:</span>
            <span>{data.proprietario || "—"}</span>
          </div>
          <div className="doc-field">
            <span className="doc-field-label">CPF/CNPJ:</span>
            <span>{data.cpf || "—"}</span>
          </div>
          <div className="doc-field">
            <span className="doc-field-label">Endereço:</span>
            <span>{data.endereco || "—"}</span>
          </div>
          <div className="doc-field">
            <span className="doc-field-label">Bairro:</span>
            <span>{data.bairro || "—"}</span>
          </div>
          {data.loteamento && (
            <div className="doc-field">
              <span className="doc-field-label">Loteamento:</span>
              <span>{data.loteamento}</span>
            </div>
          )}

          <div className="doc-section-title">
            {isAuto ? "Infrações Cometidas" : "Irregularidade Identificada"}
          </div>
          <div className="doc-infracoes">
            {data.infracoes && data.infracoes.length > 0 ? (
              data.infracoes.map((inf, i) => <div key={i}>• {inf}</div>)
            ) : (
              <div style={{ color: "#aaa" }}>
                — Nenhuma infração selecionada —
              </div>
            )}
          </div>

          {data.descricao && (
            <div style={{ marginTop: 8, fontSize: 11 }}>
              <strong>Obs:</strong> {data.descricao}
            </div>
          )}

          {isAuto && data.multa && (
            <>
              <div className="doc-section-title">Penalidade</div>
              <div className="doc-field">
                <span className="doc-field-label">Valor da multa:</span>
                <span style={{ color: "#c0392b", fontWeight: 700 }}>
                  R$ {data.multa}
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

          {!isAuto && (
            <>
              <div className="doc-section-title">Prazo para Regularização</div>
              <div className="doc-field">
                <span className="doc-field-label">Prazo:</span>
                <span>
                  {data.prazo || "1"} dia(s) corrido(s) a partir desta data
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                Acesse o portal para enviar sua defesa ou regularizar a
                situação.
              </div>
            </>
          )}

          {isAuto ? (
            <>
              <div className="doc-section-title">Assinaturas</div>
              <div className="doc-sig-area">
                <div className="doc-sig-box">
                  <strong>Agente de Fiscalização</strong>
                  <br />
                  {data.fiscal || "—"}
                  <br />
                  Mat. {data.matricula || "—"}
                  <br />
                  <br />
                  Ass. _____________
                </div>
              </div>
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
              {data.obsRecusa && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: "#555",
                    borderTop: "1px solid #ddd",
                    paddingTop: 6,
                  }}
                >
                  <strong>Obs.:</strong> {data.obsRecusa}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="doc-section-title">Identificação do Agente</div>
              <div
                className="doc-sig-area"
                style={{ justifyContent: "center" }}
              >
                <div className="doc-sig-box" style={{ textAlign: "center" }}>
                  Agente de Fiscalização
                  <br />
                  <strong>{data.fiscal || "—"}</strong>
                  <br />
                  Mat. {data.matricula || "—"}
                </div>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 10,
              color: "#777",
            }}
          >
            Vitória da Conquista, {new Date().toLocaleDateString("pt-BR")} —
            FISCON
          </div>
          {data.codigoAcesso && (
            <div
              style={{
                marginTop: 14,
                borderTop: "2px dashed #333",
                paddingTop: 10,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {" "}
                Defesa Online
              </div>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>
                Acesse o portal para enviar sua defesa dentro do prazo:
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                    PORTAL_URL + "?codigo=" + data.codigoAcesso
                  )}`}
                  alt="QR"
                  width={60}
                  height={60}
                  style={{ border: "1px solid #ccc" }}
                />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 9, color: "#888" }}>
                    Código de acesso:
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: 2,
                      fontFamily: "monospace",
                      border: "1px solid #333",
                      padding: "3px 8px",
                      marginTop: 2,
                    }}
                  >
                    {data.codigoAcesso}
                  </div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 3 }}>
                    {PORTAL_URL.replace("https://", "")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* QR Code + Código de Acesso — gerado após registrar */}
        {data.codigoAcesso && (
          <div
            style={{
              margin: "0 20px 12px",
              background: "#F0F9FF",
              border: "1.5px solid #BAE6FD",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: T.font,
                fontSize: 13,
                fontWeight: 800,
                color: T.accent,
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              Acesso do Contribuinte
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                  PORTAL_URL + "?codigo=" + data.codigoAcesso
                )}`}
                alt="QR Code"
                width={90}
                height={90}
                style={{
                  borderRadius: 8,
                  border: "2px solid #BAE6FD",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>
                  Código de acesso:
                </div>
                <div
                  style={{
                    fontFamily: T.font,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: T.text,
                    background: "#fff",
                    border: "1.5px solid #BAE6FD",
                    borderRadius: 8,
                    padding: "6px 10px",
                    textAlign: "center",
                  }}
                >
                  {data.codigoAcesso}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: T.muted,
                    marginTop: 6,
                    lineHeight: 1.4,
                  }}
                >
                  O contribuinte acessa o portal pelo QR Code ou pelo código
                  acima para enviar sua defesa.
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button
            className="btn-print"
            onClick={() => gerarPDFA4(type, data, PORTAL_URL)}
          >
            <Icon name="file" size={18} /> PDF A4
          </button>
          <button className="btn-save" onClick={() => onSave && onSave()}>
            <Icon name="save" size={18} /> Registrar
          </button>
        </div>
        <div style={{ padding: "0 20px 16px" }}>
          <button
            onClick={() => {
              // Garante que o código de acesso existe antes de imprimir
              const codigoFinal =
                data.codigoAcesso ||
                data.num.replace(/[^A-Z0-9]/g, "") +
                  "-" +
                  Math.random().toString(36).slice(2, 6).toUpperCase();
              const dataFinal = { ...data, codigoAcesso: codigoFinal };
              // Registra automaticamente se ainda não foi registrado
              if (onSave) onSave();
              // Imprime com o código garantido
              imprimirTermica(type, dataFinal);
            }}
            style={{
              width: "100%",
              background: "#1a1a1a",
              border: "1.5px dashed #555",
              borderRadius: 10,
              color: "#ccc",
              padding: "10px 0",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              letterSpacing: 0.5,
            }}
          >
            Térmica 58mm — Imprimir e Registrar
          </button>
        </div>
      </div>
    </div>
  );
}


const imprimirDefesaA4 = (defesa, record) => {
  const brasaoUrl =
    "https://upload.wikimedia.org/wikipedia/commons/5/57/Bras%C3%A3o_Vitoria_da_Conquista.svg";
  const isAuto = record?.type === "auto";
  const hoje = new Date().toLocaleDateString("pt-BR");

  const statusLabel =
    defesa.status === "deferida"
      ? "DEFERIDA"
      : defesa.status === "indeferida"
      ? "INDEFERIDA"
      : "PENDENTE";
  const statusColor =
    defesa.status === "deferida"
      ? "#166534"
      : defesa.status === "indeferida"
      ? "#B91C1C"
      : "#B45309";
  const statusBg =
    defesa.status === "deferida"
      ? "#D1FAE5"
      : defesa.status === "indeferida"
      ? "#FEE2E2"
      : "#FEF3C7";

  // Infrações do registro
  const infRows = (record?.infracoes || [])
    .map((inf, i) => {
      let desc = typeof inf === "string" ? inf : inf.desc || "";
      const bg = i % 2 === 0 ? "#fff5f5" : "#fffafa";
      return `<tr style="background:${bg}"><td style="padding:3px 6px;border-bottom:1px solid #fed7d7;font-size:10px">${desc}</td></tr>`;
    })
    .join("");

  const infBlock = infRows
    ? `
    <div class="sec-title sec-red">Irregularidades / Infrações Constatadas</div>
    <table style="width:100%;border-collapse:collapse">${infRows}</table>`
    : "";

  const multaBloco =
    isAuto && record?.multa
      ? `
    <div style="background:#fff5f5;border:2px solid #b91c1c;border-radius:4px;padding:6px 12px;margin:4mm 0;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:9px;font-weight:800;color:#b91c1c;text-transform:uppercase">Valor da Penalidade</span>
      <span style="font-size:16px;font-weight:800;color:#b91c1c">R$ ${record.multa}</span>
    </div>`
      : "";

  const descBloco = record?.descricao
    ? `
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:3px;padding:6px 10px;margin:3mm 0;font-size:10px">
      <strong>Obs. do Fiscal:</strong> ${record.descricao}
    </div>`
    : "";

  const julgadoBlk =
    defesa.status !== "pendente"
      ? `
    <div class="sec-title sec-blue" style="margin-top:5mm">Decisão Administrativa</div>
    <div style="background:${statusBg};border:1px solid ${statusColor}40;border-radius:3px;padding:8px 12px;margin-top:2mm">
      <div style="font-size:9px;font-weight:800;color:${statusColor};text-transform:uppercase;margin-bottom:4px">
        ${statusLabel} — Julgado por ${defesa.julgado_por || ""} em ${
          defesa.julgado_em || ""
        }
      </div>
      <div style="font-size:11px;line-height:1.5">${(
        defesa.justificativa || ""
      ).replace(/\n/g, "<br>")}</div>
    </div>`
      : `
    <div class="sec-title sec-blue" style="margin-top:5mm">Situação da Defesa</div>
    <div style="background:${statusBg};border:1px solid ${statusColor}40;border-radius:3px;padding:8px 12px;margin-top:2mm">
      <div style="font-size:11px;font-weight:800;color:${statusColor}">⏳ Aguardando análise</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Defesa Administrativa — ${defesa.record_num}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
    #page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; padding: 0 0 14mm 0; }
    #watermark {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 180mm; height: 225mm; opacity: 0.06;
      background-image: url('${brasaoUrl}');
      background-size: contain; background-repeat: no-repeat; background-position: center;
      pointer-events: none; z-index: 0;
    }
    #content { position: relative; z-index: 1; }
    #header {
      background: #0d3b7a; color: #fff;
      padding: 8mm 18mm 7mm;
      display: flex; align-items: center; gap: 10mm;
      border-bottom: 3px solid #b45309;
    }
    #header img.brasao { width: 22mm; height: auto; flex-shrink: 0; }
    #header .inst { flex: 1; }
    #header .inst h1 { font-size: 12px; font-weight: 800; margin: 0 0 2px; }
    #header .inst p { font-size: 9px; margin: 1px 0; opacity: 0.85; }
    #header .num-doc { text-align: right; flex-shrink: 0; }
    #header .num-doc .lbl { font-size: 8px; opacity: 0.7; margin-bottom: 2px; }
    #header .num-doc .val { font-size: 16px; font-weight: 800; }
    #header .num-doc .dt { font-size: 8.5px; margin-top: 2px; opacity: 0.8; }
    #body { padding: 6mm 18mm; }
    .doc-title {
      background: #0d3b7a; color: #fff; text-align: center;
      padding: 4mm 0; margin-bottom: 4mm; border-radius: 2px;
    }
    .doc-title h2 { font-size: 13px; font-weight: 800; margin: 0 0 2px; letter-spacing: 1px; text-transform: uppercase; }
    .doc-title p { font-size: 8.5px; margin: 0; opacity: 0.8; }
    .sec-title {
      font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
      color: #fff; padding: 3px 6px; margin: 4mm 0 0;
    }
    .sec-blue { background: #0d3b7a; }
    .sec-red { background: #b91c1c; }
    .field-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .field-table td { padding: 3px 6px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; }
    .field-table td.lbl { font-weight: 700; color: #6b7280; font-size: 9px; width: 130px; white-space: nowrap; }
    .txt-blk {
      background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 3px;
      padding: 8px 10px; font-size: 11px; line-height: 1.6; white-space: pre-wrap;
      margin-top: 2mm;
    }
    #footer {
      background: #0d3b7a; color: #fff;
      padding: 3mm 18mm; display: flex; justify-content: space-between; align-items: center;
      border-top: 2px solid #b45309; margin-top: 8mm;
    }
    #footer .left { font-size: 8px; }
    #footer .right { font-size: 8px; text-align: right; }
    @media print {
      #btn-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      #page { min-height: auto; }
    }
    #btn-print {
      display: block; width: calc(100% - 36mm); margin: 4mm 18mm 0;
      background: #0d3b7a; color: #fff; border: none; border-radius: 6px;
      padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
    }
  </style>
</head>
<body>
<div id="page">
  <div id="watermark"></div>
  <div id="content">

    <div id="header">
      <img class="brasao" src="${brasaoUrl}" alt="Brasão PMVC">
      <div class="inst">
        <h1>Prefeitura Municipal de Vitoria da Conquista - Bahia</h1>
        <p>Secretaria Municipal de Infraestrutura Urbana</p>
        <p>Gerencia de Fiscalizacao de Obras - FISCON</p>
      </div>
      <div class="num-doc">
        <div class="lbl">No DO DOCUMENTO</div>
        <div class="val">${record?.num || defesa.record_num}</div>
        <div class="dt">Emissão: ${record?.date || hoje}</div>
      </div>
    </div>

    <div id="body">
      <div class="doc-title">
        <h2>Defesa Administrativa</h2>
        <p>${isAuto ? "Auto de Infração" : "Notificação Preliminar"} · ${
    record?.num || defesa.record_num
  }</p>
      </div>

      <div style="display:inline-block;background:${statusBg};color:${statusColor};font-weight:800;font-size:11px;padding:4px 14px;border-radius:20px;margin-bottom:4mm">
        ${statusLabel}
      </div>

      <!-- DADOS DO FISCAL -->
      <div class="sec-title sec-blue">Identificação do Agente de Fiscalização</div>
      <table class="field-table">
        <tr><td class="lbl">Agente Fiscal</td><td>${record?.fiscal || "—"}</td>
            <td class="lbl" style="width:120px">Matrícula</td><td>${
              record?.matricula || "—"
            }</td></tr>
        <tr><td class="lbl">Proprietário / Responsável</td><td colspan="3">${
          record?.owner || "—"
        }</td></tr>
        <tr><td class="lbl">CPF / CNPJ</td><td>${record?.cpf || "—"}</td>
            <td class="lbl">Data da Autuação</td><td>${
              record?.date || "—"
            }</td></tr>
        <tr><td class="lbl">Endereço / Obra</td><td colspan="3">${
          record?.addr || "—"
        }</td></tr>
        ${
          record?.bairro
            ? `<tr><td class="lbl">Bairro</td><td colspan="3">${record.bairro}</td></tr>`
            : ""
        }
        ${
          record?.prazo
            ? `<tr><td class="lbl">Prazo Concedido</td><td colspan="3">${record.prazo} dia(s) corrido(s)</td></tr>`
            : ""
        }
      </table>

      ${infBlock}
      ${multaBloco}
      ${descBloco}

      <!-- DADOS DO CONTRIBUINTE -->
      <div class="sec-title sec-blue" style="margin-top:5mm">Dados do Requerente</div>
      <table class="field-table">
        <tr><td class="lbl">Nome</td><td colspan="3">${
          defesa.nome || "—"
        }</td></tr>
        <tr><td class="lbl">CPF</td><td>${defesa.cpf || "—"}</td>
            <td class="lbl">Telefone</td><td>${defesa.telefone || "—"}</td></tr>
        ${
          defesa.email
            ? `<tr><td class="lbl">E-mail</td><td colspan="3">${defesa.email}</td></tr>`
            : ""
        }
        <tr><td class="lbl">Data de Envio</td><td colspan="3">${
          defesa.data_envio || "—"
        }</td></tr>
      </table>

      <!-- DEFESA ESCRITA -->
      <div class="sec-title sec-blue" style="margin-top:5mm">Defesa Apresentada pelo Contribuinte</div>
      <div class="txt-blk">${(defesa.texto || "").replace(/\n/g, "<br>")}</div>

      ${
        defesa.fundamentos
          ? `
      <div class="sec-title sec-blue" style="margin-top:4mm">Fundamentos Legais Invocados</div>
      <div class="txt-blk">${defesa.fundamentos.replace(/\n/g, "<br>")}</div>`
          : ""
      }

      ${julgadoBlk}

      <!-- Assinatura do agente -->
      <div class="sec-title sec-blue" style="margin-top:5mm">Identificação</div>
      <table style="width:100%;border-collapse:collapse;margin-top:2mm">
        <tr>
          <td style="width:40%;border:1px solid #d1d5db;padding:6px 8px;background:#f8fafc;text-align:center">
            <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:14px">Agente de Fiscalizacao</div>
            <div style="border-top:1px solid #9ca3af;padding-top:4px">
              <div style="font-size:10px;font-weight:700">${
                record?.fiscal || ""
              }</div>
              <div style="font-size:9px;color:#6b7280">Mat. ${
                record?.matricula || ""
              }</div>
            </div>
          </td>
          <td style="width:60%"></td>
        </tr>
      </table>
    </div>

    <div id="footer">
      <div class="left">
        <strong>FISCON</strong> · Sistema de Fiscalização de Obras<br>
        Prefeitura Municipal de Vitória da Conquista · BA
      </div>
      <div class="right">
        Impresso em: ${hoje}<br>
        Documento gerado eletronicamente
      </div>
    </div>
  </div>
</div>
<button id="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) alert("Permita pop-ups para imprimir.");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};


export { SigCanvas, gerarPDF, printDoc, imprimirTermica, gerarPDFA4, DocPreview, imprimirDefesaA4, CSS_PRINT };
