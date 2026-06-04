"use client";

import { formatRupiah, numberToWords } from "./utils";
import { ProformaInvoice, SuratMuatInfo, SuratMuatItem, BeritaAcaraItem, TTDData } from "./types";

export const handlePrintPDF = (item: ProformaInvoice) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const produkRows = (item.produkItems || []).map((p, idx) => `
    <tr>
      <td style="text-align: center; padding: 5px 3px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">${idx + 1}</td>
      <td style="padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600; height: 28px;">${p.namaProduk || ""}</td>
      <td style="text-align: center; padding: 5px 3px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">${p.fot || ""}</td>
      <td style="padding: 5px 8px; font-size: 9px; border: 1px solid #000; vertical-align: top; height: 28px; color: #555;">${p.produsen || ""}</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">${p.kuantitas?.toLocaleString("id-ID") || "0"}</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">${formatRupiah(p.hargaSatuan)}</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600; height: 28px;">${formatRupiah(p.totalHarga)}</td>
    </tr>
  `).join("");
  const emptyRowsCount = Math.max(0, 10 - (item.produkItems || []).length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => `
    <tr>
      <td style="text-align: center; padding: 5px 3px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">${(item.produkItems || []).length + i + 1}</td>
      <td style="padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
      <td style="text-align: center; padding: 5px 3px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
      <td style="padding: 5px 8px; font-size: 9px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
      <td style="text-align: right; padding: 5px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; height: 28px;">&nbsp;</td>
    </tr>
  `).join("");
  const createdAtStr = item.createdAt instanceof Date ? item.createdAt.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Proforma Invoice ${item.nomorPI}</title>
      <style>
        @page { size: A4; margin: 12mm 14mm 12mm 14mm; }
        @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; color: #000; font-size: 10px; line-height: 1.3; }
        .page { width: 182mm; margin: 0 auto; background: white; position: relative; min-height: 257mm; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 280px; height: auto; opacity: 0.08; pointer-events: none; z-index: 0; }
        .content-layer { position: relative; z-index: 1; }
        .header-img { width: 100%; display: block; margin-bottom: 0; }
        .invoice-title { text-align: center; margin: 8px 0 10px 0; padding: 5px 0; background: #dcfce7; border-top: 2px solid #16a34a; border-bottom: 2px solid #16a34a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .invoice-title h1 { color: #111; font-size: 15px; margin: 0; font-weight: bold; letter-spacing: 3px; }
        .info-section { margin-bottom: 10px; }
        .kepada-label { font-size: 9px; color: #333; margin-bottom: 2px; }
        .info-row { display: flex; justify-content: space-between; gap: 0; }
        .customer-box { flex: 1; border: 1px solid #000; padding: 8px 10px; min-height: 75px; }
        .customer-name { font-size: 11px; font-weight: 700; color: #000; margin: 0 0 3px 0; }
        .customer-address { font-size: 9px; color: #333; line-height: 1.5; }
        .invoice-meta { width: 250px; padding: 0 0 0 10px; }
        .meta-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 9px; border-bottom: 1px solid #ddd; }
        .meta-row:last-child { border-bottom: none; }
        .meta-label { color: #333; min-width: 90px; }
        .meta-colon { margin: 0 3px; }
        .meta-value { color: #000; font-weight: 600; text-align: right; flex: 1; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        .data-table th { background: #ffedd5; color: #000; font-size: 9px; padding: 5px 3px; font-weight: 700; border: 1px solid #000; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .data-table td { border: 1px solid #000; padding: 5px 3px; vertical-align: top; }
        .summary-row { display: flex; border: 1px solid #000; border-top: none; }
        .terbilang-area { flex: 1; padding: 8px 10px; border-right: 1px solid #000; }
        .terbilang-title { font-size: 9px; color: #333; margin-bottom: 3px; font-weight: 600; }
        .terbilang-text { font-size: 10px; color: #000; font-weight: 700; text-transform: uppercase; line-height: 1.4; }
        .calc-area { width: 250px; padding: 0; }
        .calc-line { display: flex; justify-content: space-between; padding: 3px 10px; border-bottom: 1px solid #ddd; font-size: 9px; }
        .calc-line:last-child { border-bottom: none; background: #f0fdf4; border-top: 1px solid #16a34a; padding: 5px 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .calc-name { color: #333; }
        .calc-name-bold { font-weight: 700; color: #000; }
        .calc-amount { font-weight: 600; font-family: monospace; font-size: 9px; }
        .calc-amount-bold { font-size: 10px; color: #000; font-weight: 700; font-family: monospace; }
        .due-date { padding: 5px 10px; text-align: right; border-top: 1px solid #ddd; font-size: 11px; }
        .due-label { color: #666; font-size: 11px; }
        .due-value { color: #dc2626; font-weight: 700; font-size: 11px; }
        .created-info { padding: 4px 10px; text-align: right; border-top: 1px solid #eee; font-size: 10px; color: #666; }
        .footer-row { display: flex; border: 1px solid #000; border-top: none; }
        .footer-bank-area { flex: 1; padding: 8px 10px; border-right: 1px solid #000; }
        .footer-bank-title { font-size: 9px; font-weight: 700; color: #000; margin-bottom: 5px; }
        .footer-bank-text { font-size: 8px; line-height: 1.6; color: #333; }
        .footer-bank-text strong { color: #000; font-size: 9px; }
        .footer-ttd-area { width: 180px; padding: 8px 10px; text-align: center; }
        .ttd-title { font-size: 9px; color: #333; margin-bottom: 6px; }
        .ttd-img { height: 40px; object-fit: contain; margin: 0 auto 4px auto; display: block; }
        .ttd-name { font-size: 10px; font-weight: 700; color: #000; margin-top: 4px; border-top: 1px solid #000; padding-top: 3px; display: inline-block; }
        .ttd-role { font-size: 8px; color: #555; }
        .print-btn { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin: 10px; }
        .print-btn:hover { background: #15803d; }
        .print-bar { text-align: center; padding: 10px; background: #f3f4f6; position: sticky; top: 0; z-index: 100; }
        @media print { .print-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="page">
        <img src="/LogoAGRO.png" alt="Watermark" class="watermark" onerror="this.style.display='none'" />
        <div class="content-layer">
          <img src="/logo.png" alt="Header" class="header-img" onerror="this.style.display='none'; this.parentElement.insertAdjacentHTML('afterbegin', '<div style=text-align:center;padding:10px;border:1px solid #ccc;margin-bottom:10px;>Logo tidak tersedia</div>');" />
          <div class="invoice-title">
            <h1>PROFORMA INVOICE</h1>
          </div>
          <div class="info-section">
            <p class="kepada-label">Kepada Yth,</p>
            <div class="info-row">
              <div class="customer-box">
                <p class="customer-name">${item.namaCustomer || ""}</p>
                <p class="customer-address">${(item.alamatCustomer || "").replace(/\n/g, "<br>")}</p>
              </div>
              <div class="invoice-meta">
                <div class="meta-row"><span class="meta-label">Tanggal</span><span class="meta-colon">:</span><span class="meta-value">${item.tanggal || ""}</span></div>
                <div class="meta-row"><span class="meta-label">No Invoice</span><span class="meta-colon">:</span><span class="meta-value">${item.nomorPI || ""}</span></div>
                <div class="meta-row"><span class="meta-label">Metode Pembayaran</span><span class="meta-colon">:</span><span class="meta-value">${item.metodePembayaran || ""}</span></div>
                ${item.npwp ? `<div class="meta-row"><span class="meta-label">NPWP</span><span class="meta-colon">:</span><span class="meta-value">${item.npwp}</span></div>` : ""}
              </div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 28px;">NO</th>
                <th style="text-align: left; padding-left: 8px;">Nama Produk</th>
                <th style="width: 45px;">Fot</th>
                <th style="width: 90px;">Produsen</th>
                <th style="width: 60px;">Kuantitas<br>(kg)</th>
                <th style="width: 95px;">Harga Satuan</th>
                <th style="width: 105px;">Total Harga</th>
              </tr>
            </thead>
            <tbody>${produkRows}${emptyRows}</tbody>
          </table>
          <div class="summary-row">
            <div class="terbilang-area">
              <div class="terbilang-title">Terbilang :</div>
              <div class="terbilang-text">${item.terbilang || "-"}</div>
            </div>
            <div class="calc-area">
              <div class="calc-line"><span class="calc-name">Subtotal</span><span class="calc-amount">${formatRupiah(item.subtotal)}</span></div>
              ${(item.uangMuka || 0) > 0 ? `<div class="calc-line"><span class="calc-name">Uang Muka</span><span class="calc-amount">${formatRupiah(item.uangMuka)}</span></div>` : ""}
              ${item.includePPN ? `<div class="calc-line"><span class="calc-name">PPN 11%</span><span class="calc-amount">${formatRupiah(item.ppnNominal)}</span></div>` : ""}
              ${(item.ongkosKirim || 0) > 0 ? `<div class="calc-line"><span class="calc-name">Ongkos Kirim</span><span class="calc-amount">${formatRupiah(item.ongkosKirim)}</span></div>` : ""}
              <div class="calc-line"><span class="calc-name-bold">Jumlah Tertagih</span><span class="calc-amount-bold">${formatRupiah(item.jumlahTertagih)}</span></div>
              <div class="due-date"><span class="due-label">Tanggal Jatuh Tempo : </span><span class="due-value">${item.tanggalJatuhTempo || ""}</span></div>
              <div class="created-info">Dibuat: ${createdAtStr}</div>
            </div>
          </div>
          <div class="footer-row">
            <div class="footer-bank-area">
              <p class="footer-bank-title">Pembayaran mohon ditransfer via rekening:</p>
              <div class="footer-bank-text">
                <p><strong>BANK MANDIRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p>No. Rek : 159-00-1205477-0</p>
                <p style="margin-top: 3px;"><strong>BANK BRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p>No. Rek : 2232-01000-879-567</p>
              </div>
            </div>
            <div class="footer-ttd-area">
              <p class="ttd-title">Dengan Hormat</p>
              ${item.ttdImage ? `<img src="${item.ttdImage}" class="ttd-img" alt="TTD" />` : `<div style="height: 40px;"></div>`}
              <p class="ttd-name">${item.ttdNama || ""}</p>
              <p class="ttd-role">${item.ttdJabatan ? `(${item.ttdJabatan})` : ""}</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

export const handlePrintSuratPDF = (surat: SuratMuatInfo) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const isGI = !surat.jenisSurat || surat.jenisSurat === "gudangInduk";
  const isDikuasakan = surat.jenisSurat === "do" && surat.subJenisDO === "dikuasakan";
  const piDisplay = Array.isArray(surat.nomorPI) ? surat.nomorPI.join(", ") : surat.nomorPI;
  const itemsHtml = (surat.items || [])
    .map((it, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${idx + 1}</td>
        ${!isGI ? `<td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.nomorSubDO || "-"}</td>` : ""}
        <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${isGI || isDikuasakan ? (it.nomorPI || piDisplay || "-") : (it.nomorPO || "-")}</td>
        <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600;">${it.jenisPupuk || ""}</td>
        <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.party || "-"}</td>
        <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.pengambilanZAK || "-"} ZAK</td>
        <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.sisa || "-"}</td>
      </tr>
    `).join("");

  let recipientBox = "";
  if (isGI) {
    recipientBox = `<div class="recipient-box">
      <p class="recipient-title">Kepada Yth :</p>
      <p class="recipient-name">Bapak Kepala Gudang Induk</p>
      <p class="recipient-name">PT Bukit Agrochemical Baru</p>
      <p class="recipient-address">Desa Sungai Rangit<br>Pangkalan Lada, Kalimantan Tengah</p>
    </div>`;
  } else if (isDikuasakan) {
    const customerName = Array.isArray(surat.namaCustomer) ? surat.namaCustomer[0] : surat.namaCustomer;
    recipientBox = `<div class="recipient-box">
      <p class="recipient-title">Kepada Yth :</p>
      <p class="recipient-name">${customerName || ""}</p>
      <p class="recipient-name">${customerName || ""}</p>
    </div>`;
  } else {
    recipientBox = `<div class="recipient-box">
      <p class="recipient-title">Kepada Yth :</p>
      <p class="recipient-name">${surat.kepadaNama || ""}</p>
      <p class="recipient-name">${surat.kepadaPerusahaan || ""}</p>
      <p class="recipient-address">${(surat.kepadaAlamat || "").replace(/\n/g, "<br>")}</p>
    </div>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Surat Pengangkutan ${surat.nomorSeri}</title>
      <style>
        @page { size: A4; margin: 10mm 12mm 10mm 12mm; }
        @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #000; }
        .page { width: 176mm; margin: 0 auto; position: relative; min-height: 257mm; display: flex; flex-direction: column; }
        .header-img { width: 100%; display: block; margin-bottom: 0; }
        .title-bar { text-align: center; background: #15803d; color: white; padding: 8px 0; margin: 8px 0 12px 0; font-weight: bold; font-size: 14px; letter-spacing: 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .info-section { margin-bottom: 12px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; }
        .info-label { font-weight: 600; }
        .recipient-box { border: 1px solid #000; padding: 8px 10px; margin-bottom: 10px; }
        .recipient-title { font-size: 9px; color: #333; margin-bottom: 2px; }
        .recipient-name { font-size: 11px; font-weight: 700; }
        .recipient-address { font-size: 9px; color: #333; line-height: 1.5; margin-top: 2px; }
        .salutation { font-size: 10px; margin-bottom: 8px; }
        .salutation p { margin-bottom: 2px; }
        .table-section { margin-bottom: 10px; }
        .table-title { text-align: center; background: #dcfce7; border: 1px solid #000; border-bottom: none; padding: 4px 0; font-size: 10px; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #f0fdf4; font-size: 9px; padding: 5px 3px; border: 1px solid #000; font-weight: 700; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .data-table td { border: 1px solid #000; padding: 5px 3px; vertical-align: top; }
        .notes-section { margin-top: 10px; font-size: 9px; }
        .notes-section p { margin-bottom: 2px; }
        .signature-row { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20px; align-items: flex-end; }
        .signature-box { width: 45%; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
        .signature-title { font-size: 9px; margin-bottom: 4px; min-height: 28px; line-height: 1.4; }
        .signature-img { max-height: 60px; width: auto; object-fit: contain; margin: 0 auto 4px auto; display: block; }
        .signature-name { font-size: 10px; font-weight: 700; margin-top: 0; border-top: 1px solid #000; padding-top: 3px; display: block; width: 90%; margin-left: auto; margin-right: auto; }
        .footer-img { width: 100%; display: block; margin-top: auto; padding-top: 10px; }
        .print-btn { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin: 10px; }
        .print-bar { text-align: center; padding: 10px; background: #f3f4f6; position: sticky; top: 0; z-index: 100; }
        @media print { .print-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="page">
        <img src="/Picture3.png" alt="Header" class="header-img" onerror="this.style.display='none'" />
        <div class="title-bar">SURAT PENGANGKUTAN</div>
        <div class="info-section">
          <div class="info-row">
            <span>Lamandau, ${new Date(surat.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nomor Seri : ${surat.nomorSeri}</span>
          </div>
        </div>
        ${recipientBox}
        <div class="salutation">
          <p>Dengan Hormat,</p>
          <p>Dengan ini mohon dimuatkan pupuk dengan rincian sebagai berikut :</p>
        </div>
        <div class="table-section">
          <div class="table-title">DASAR PENGANGKUTAN</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">NO</th>
                ${!isGI ? `<th style="width: 100px;">NOMOR SUB DO</th>` : ""}
                <th style="width: 100px;">NOMOR PI</th>
                <th>JENIS PUPUK</th>
                <th style="width: 60px;">PARTY</th>
                <th style="width: 100px;">PENGAMBILAN<br>ZAK</th>
                <th style="width: 60px;">SISA</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
        <div class="table-section">
          <div class="table-title">DATA UNIT ANGKUTAN</div>
          <table class="data-table">
            <tbody>
              <tr>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; font-weight: 600; width: 120px;">NO. POLISI :</td>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000;">${surat.nomorPolisi || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; font-weight: 600;">DRIVER UNIT :</td>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000;">${surat.driverUnit || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; font-weight: 600;">NOMOR SIM :</td>
                <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000;">${surat.nomorSIM || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="notes-section">
          <p style="font-weight: 700;">Notes :</p>
          <p>- Jika terdapat coretan / tip-ex Sub DO dianggap batal.</p>
          <p>- Sub DO berlaku selama 3 hari dari tanggal Sub DO diterbitkan.</p>
          <p>- Untuk konfirmasi dengan Customer Service kami, silahkan scan QRcode di atas.</p>
        </div>
        <div class="signature-row">
          <div class="signature-box">
            <p class="signature-title">Hormat Kami,<br>PT. BUKIT AGROCHEMICAL BARU</p>
            <div style="min-height: 60px; margin-bottom: 4px; display: flex; align-items: flex-end; justify-content: center;">
              <img src="/Picture2.png" alt="TTD" class="signature-img" onerror="this.style.display='none'" />
            </div>
            <p class="signature-name">HENDRA PRAMASYANTO</p>
          </div>
          <div class="signature-box">
            <p class="signature-title">Diangkut oleh,<br>Driver</p>
            <div style="min-height: 60px; margin-bottom: 4px;"></div>
            <p class="signature-name">${surat.driverUnit || ""}</p>
          </div>
        </div>
        <img src="/Picture1.png" alt="Footer" class="footer-img" onerror="this.style.display='none'" />
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

export const handlePrintBastSimple = async (item: ProformaInvoice, baData: any) => {
  const bastItems: BeritaAcaraItem[] = baData.items || [];
  const now = new Date();
  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggalLengkap = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const rowsHtml = bastItems.map((it) => `
    <tr>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.no}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.tanggalMuat}</td>
      <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600;">${it.namaProduk}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.fot || "-"}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.qty}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.noSJ}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.driver}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.nopol}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Berita Acara ${baData.nomorSeri}</title>
      <style>
        @page { size: A4; margin: 10mm 12mm 10mm 12mm; }
        @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.5; color: #000; }
        .page { width: 176mm; margin: 0 auto; position: relative; min-height: 257mm; display: flex; flex-direction: column; }
        .header-img { width: 100%; display: block; margin-bottom: 0; }
        .title-bar { text-align: center; margin: 8px 0 12px 0; }
        .title-bar h1 { font-size: 14px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; text-decoration: underline; }
        .title-bar p { font-size: 11px; font-weight: 600; }
        .content { padding: 0 4px; flex: 1; }
        .opening { margin-bottom: 12px; font-size: 10px; }
        .party-section { margin-bottom: 10px; }
        .party-title { font-weight: 700; margin-bottom: 4px; font-size: 10px; }
        .party-table { width: 100%; margin-bottom: 8px; font-size: 10px; }
        .party-table td { padding: 2px 0; vertical-align: top; }
        .party-label { width: 100px; font-weight: 600; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
        .data-table th { background: #f0fdf4; font-size: 9px; padding: 5px 3px; border: 1px solid #000; font-weight: 700; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .data-table td { border: 1px solid #000; padding: 5px 3px; vertical-align: top; }
        .closing { margin-bottom: 16px; font-size: 10px; text-align: justify; }
        .print-btn { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin: 10px; }
        .print-bar { text-align: center; padding: 10px; background: #f3f4f6; position: sticky; top: 0; z-index: 100; }
        @media print { .print-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="page">
        <img src="/Picture3.png" alt="Header" class="header-img" onerror="this.style.display='none'" />
        <div class="title-bar">
          <h1>BERITA ACARA SERAH TERIMA BARANG</h1>
          <p>${baData.nomorSeri}</p>
        </div>
        <div class="content">
          <p class="opening">Kami yang bertanda tangan di bawah ini, pada hari ${hari}, ${tanggalLengkap}</p>
          <div class="party-section">
            <p class="party-title">Selanjutnya disebut Pihak Pertama.</p>
            <table class="party-table">
              <tr><td class="party-label">Nama</td><td>: ........................</td></tr>
              <tr><td class="party-label">Perusahaan</td><td>: PT Bukit Agrochemical Baru</td></tr>
              <tr><td class="party-label">Jabatan</td><td>: ........................</td></tr>
            </table>
          </div>
          <div class="party-section">
            <p class="party-title">Selanjutnya yang disebut Pihak Kedua.</p>
            <table class="party-table">
              <tr><td class="party-label">Nama</td><td>: ${item.namaCustomer}</td></tr>
              <tr><td class="party-label">Alamat</td><td>: ${(item.alamatCustomer || "").replace(/\n/g, " ")}</td></tr>
            </table>
          </div>
          <p class="opening">Pihak pertama menyerahkan barang kepada pihak kedua, dan pihak kedua menyatakan telah menerima barang dari pihak pertama, berupa daftar terlampir :</p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th style="width: 80px;">Tanggal Muat</th>
                <th>Nama Produk</th>
                <th style="width: 80px;">FOT / No DO</th>
                <th style="width: 70px;">QTY</th>
                <th style="width: 120px;">No SJ</th>
                <th style="width: 90px;">Driver</th>
                <th style="width: 80px;">Nopol</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <p class="closing">Demikian berita acara serah terima barang ini diperbuat oleh kedua belah pihak, adapun barang-barang tersebut dalam keadaan baik dan cukup, sejak penandatanganan berita acara ini, maka barang-barang tersebut menjadi tanggung jawab pihak kedua.</p>
          <div style="display: flex; justify-content: space-between; margin-top: 40px; align-items: flex-end;">
            <div style="width: 45%; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
              <p style="font-size: 10px; font-weight: 700; margin-bottom: 8px;">PIHAK KEDUA</p>
              <div style="width: 100%; min-height: 80px; margin-bottom: 8px;"></div>
              <p style="font-size: 10px; font-weight: 700; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px; display: block; width: 90%; margin-left: auto; margin-right: auto;">${item.namaCustomer || "_________________"}</p>
            </div>
            <div style="width: 45%; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
              <p style="font-size: 10px; font-weight: 700; margin-bottom: 8px;">PIHAK PERTAMA</p>
              <div style="position: relative; width: 100%; min-height: 80px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center;">
                <img src="/LogoAGRO.png" alt="Stempel" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-height: 80px; max-width: 100px; opacity: 0.25; object-fit: contain; z-index: 1;" onerror="this.style.display='none'" />
                <div style="position: relative; z-index: 2; min-height: 70px;"></div>
              </div>
              <p style="font-size: 10px; font-weight: 700; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px; display: block; width: 90%; margin-left: auto; margin-right: auto;">_________________</p>
              <p style="font-size: 9px; color: #333; margin-top: 3px;">PT Bukit Agrochemical Baru</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

export const handlePrintInvoice = (selectedItem: ProformaInvoice | null, invoiceNomor: string, invoiceSurat: SuratMuatInfo | null, selectedOrderTTD: string, ttdList: TTDData[]) => {
  if (!selectedItem || !invoiceNomor) return;
  const pi = selectedItem;
  const orderTTD = ttdList.find((t) => t.id === selectedOrderTTD);
  const allSuratForPI = getSuratMuatForPI(pi.nomorPI);
  const sortedSurat = [...allSuratForPI].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const invoiceDate = invoiceSurat ? invoiceSurat.tanggal : (sortedSurat[0] ? sortedSurat[0].tanggal : pi.tanggal);

  const invoiceItems = pi.produkItems
    .map((produk, idx) => {
      let loadedQty = 0;
      if (invoiceSurat) {
        (invoiceSurat.items || []).forEach((it) => {
          const itemPI = it.nomorPI || "";
          if (itemPI && itemPI !== pi.nomorPI) return;
          const match = it.jenisPupuk.toUpperCase().includes(produk.namaProduk.toUpperCase()) || produk.namaProduk.toUpperCase().includes(it.jenisPupuk.toUpperCase());
          if (match) { const bobot = it.bobotPerUnit || produk.bobotPerUnit || 50; loadedQty += (it.pengambilanZAK || 0) * bobot; }
        });
      } else {
        allSuratForPI.forEach((surat) => {
          (surat.items || []).forEach((it) => {
            const itemPI = it.nomorPI || "";
            if (itemPI && itemPI !== pi.nomorPI) return;
            const match = it.jenisPupuk.toUpperCase().includes(produk.namaProduk.toUpperCase()) || produk.namaProduk.toUpperCase().includes(it.jenisPupuk.toUpperCase());
            if (match) { const bobot = it.bobotPerUnit || produk.bobotPerUnit || 50; loadedQty += (it.pengambilanZAK || 0) * bobot; }
          });
        });
      }
      const hargaSatuan = produk.hargaSatuan || 0;
      const hargaPerZakDus = produk.hargaPerZakDus || 0;
      const kemasan = produk.bobotPerUnit ? `${produk.bobotPerUnit} KG` : "-";
      const subTotal = loadedQty * hargaSatuan;
      return { no: idx + 1, namaProduk: produk.namaProduk, produsen: produk.produsen || "", kemasan, fot: produk.fot || "", kuantitas: loadedQty, satuan: "KG", hargaSatuan, hargaPerZakDus, subTotal };
    })
    .filter((it) => !invoiceSurat || it.kuantitas > 0)
    .map((it, idx) => ({ ...it, no: idx + 1 }));

  const totalSubTotal = invoiceItems.reduce((sum, it) => sum + it.subTotal, 0);
  const dppNilaiLain = 0;
  const ongkosKirim = pi.ongkosKirim || 0;
  const ppn = pi.includePPN ? totalSubTotal * 0.11 : 0;
  const totalPembayaran = totalSubTotal + dppNilaiLain + ongkosKirim + ppn;

  const itemsHtml = invoiceItems.map((it) => `
    <tr>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.no}</td>
      <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600;">${it.namaProduk}</td>
      <td style="padding: 6px 8px; font-size: 9px; border: 1px solid #000; vertical-align: top;">${it.produsen}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.kemasan}</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.fot}</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${it.kuantitas.toLocaleString("id-ID")} ${it.satuan}</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${formatRupiah(it.hargaSatuan)}</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${formatRupiah(it.hargaPerZakDus)}</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top; font-weight: 600;">${formatRupiah(it.subTotal)}</td>
    </tr>
  `).join("");

  const emptyRows = Array.from({ length: Math.max(0, 8 - invoiceItems.length) }, (_, i) => `
    <tr>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">${invoiceItems.length + i + 1}</td>
      <td style="padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="padding: 6px 8px; font-size: 9px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: center; padding: 6px 4px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
      <td style="text-align: right; padding: 6px 8px; font-size: 10px; border: 1px solid #000; vertical-align: top;">&nbsp;</td>
    </tr>
  `).join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceNomor}</title>
      <style>
        @page { size: A4; margin: 8mm 10mm 8mm 10mm; }
        @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 9px; line-height: 1.3; color: #000; }
        .page { width: 190mm; margin: 0 auto; position: relative; min-height: 277mm; display: flex; flex-direction: column; }
        .header-img { width: 100%; display: block; margin-bottom: 0; }
        .title-bar { text-align: center; background: #15803d; color: white; padding: 4px 0; margin: 4px 0 8px 0; font-weight: bold; font-size: 12px; letter-spacing: 6px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .customer-box { width: 55%; font-size: 9px; }
        .customer-box p { margin-bottom: 1px; }
        .customer-title { font-size: 9px; margin-bottom: 2px; }
        .customer-name { font-weight: 700; font-size: 10px; }
        .meta-box { width: 40%; text-align: right; font-size: 9px; }
        .meta-box p { margin-bottom: 2px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 9px; }
        .data-table th { background: #e8f5e9; font-size: 8px; padding: 4px 2px; border: 1px solid #000; font-weight: 700; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .data-table td { border: 1px solid #000; padding: 4px 2px; vertical-align: top; font-size: 9px; }
        .summary-section { display: flex; justify-content: flex-end; margin-top: 0; }
        .summary-table { width: 55%; border-collapse: collapse; font-size: 9px; }
        .summary-table td { border: 1px solid #000; padding: 3px 6px; }
        .summary-label { text-align: left; font-weight: 600; }
        .summary-value { text-align: right; font-family: monospace; }
        .total-row { font-weight: 700; font-size: 10px; }
        .terbilang-box { border: 1px dashed #000; padding: 4px 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
        .terbilang-label { font-size: 8px; font-weight: 600; margin-bottom: 1px; }
        .bottom-section { display: flex; justify-content: space-between; margin-top: 8px; }
        .left-boxes { width: 48%; }
        .pay-box { border: 1px solid #000; padding: 6px 8px; margin-bottom: 6px; font-size: 9px; }
        .pay-box p { margin-bottom: 1px; }
        .pay-title { font-weight: 700; margin-bottom: 3px; }
        .order-box { border: 1px solid #000; padding: 6px 8px; margin-bottom: 6px; font-size: 9px; }
        .order-box p { margin-bottom: 1px; }
        .ttd-box { border: 1px solid #000; padding: 6px 8px; font-size: 9px; }
        .ttd-box p { margin-bottom: 1px; }
        .right-signature { width: 48%; text-align: center; font-size: 9px; }
        .right-signature p { margin-bottom: 2px; }
        .sig-img { height: 50px; object-fit: contain; margin: 0 auto; display: block; }
        .sig-name { font-weight: 700; margin-top: 4px; border-top: 1px solid #000; padding-top: 3px; display: inline-block; }
        .footer-img { width: 100%; display: block; margin-top: auto; padding-top: 8px; }
        .print-btn { background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; margin: 8px; }
        .print-bar { text-align: center; padding: 8px; background: #f3f4f6; position: sticky; top: 0; z-index: 100; }
        @media print { .print-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <div class="page">
        <img src="/Picture3.png" alt="Header" class="header-img" onerror="this.style.display='none'" />
        <div class="title-bar">I N V O I C E</div>
        <div class="info-section">
          <div class="customer-box">
            <p class="customer-title">Kepada Yth,</p>
            <p class="customer-name">${pi.namaCustomer || ""}</p>
            <p>${(pi.alamatCustomer || "").replace(/\n/g, "<br>")}</p>
            ${pi.npwp ? `<p style="margin-top: 3px;">NP/WP: ${pi.npwp}</p>` : ""}
          </div>
          <div class="meta-box">
            <p><span style="font-weight: 600;">INVOICE NO. :</span> ${invoiceNomor}</p>
            <p><span style="font-weight: 600;">TANGGAL :</span> ${new Date(invoiceDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p><span style="font-weight: 600;">CUSTOMER ID :</span> ${pi.nomorPI || ""}</p>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 24px;">NO</th>
              <th style="text-align: left; padding-left: 4px;">NAMA PRODUK</th>
              <th style="text-align: left; padding-left: 4px;">PRODUSEN</th>
              <th style="width: 50px;">KEMASAN</th>
              <th style="width: 40px;">FOT</th>
              <th style="width: 60px;">KUANTITAS</th>
              <th style="width: 80px;">HARGA SATUAN<br>PER KG</th>
              <th style="width: 80px;">PER ZAK</th>
              <th style="width: 90px;">SUB TOTAL</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}${emptyRows}</tbody>
        </table>
        <div class="summary-section">
          <table class="summary-table">
            <tr><td class="summary-label" style="border: none;"></td><td class="summary-label">TOTAL</td><td class="summary-value">${formatRupiah(totalSubTotal)}</td></tr>
            <tr><td style="border: none;"></td><td class="summary-label">DPP NILAI LAIN-LAIN</td><td class="summary-value">${formatRupiah(dppNilaiLain)}</td></tr>
            <tr><td style="border: none;"></td><td class="summary-label">ONGKOS KIRIM</td><td class="summary-value">${ongkosKirim > 0 ? formatRupiah(ongkosKirim) : "Rp -"}</td></tr>
            <tr><td style="border: none;"></td><td class="summary-label">PPN</td><td class="summary-value">${ppn > 0 ? formatRupiah(ppn) : "Rp -"}</td></tr>
            <tr><td style="border: none;"></td><td class="summary-label">SUB TOTAL</td><td class="summary-value">${formatRupiah(totalSubTotal + ppn)}</td></tr>
            <tr><td style="border: none;"></td><td class="summary-label total-row">TOTAL PEMBAYARAN :</td><td class="summary-value total-row">${formatRupiah(totalPembayaran)}</td></tr>
          </table>
        </div>
        <div class="terbilang-box">
          <div class="terbilang-label">TERBILANG :</div>
          <div>${numberToWords(Math.round(totalPembayaran))}</div>
        </div>
        <div class="bottom-section">
          <div class="left-boxes">
            <div class="pay-box">
              <p class="pay-title">Pembayaran PT. Bukit Agrochemical Baru</p>
              <p>Bank BRI Cabang Lamandau- Kalimantan Tengah</p>
              <p>No. Rek : 2232-01000-879-567</p>
            </div>
            <div class="order-box">
              <p style="font-weight: 600;">Dipesan oleh:</p>
              <p style="font-weight: 700;">${pi.namaCustomer || ""}</p>
            </div>
            <div class="ttd-box" style="text-align: center;">
              <p style="font-weight: 600; text-align: left;">Diorder Oleh:</p>
              <p style="text-align: left;">PT. Bukit Agrochemical Baru</p>
              <div style="height: 10px;"></div>
              ${orderTTD ? `<img src="${orderTTD.ttdImage}" style="height: 35px; object-fit: contain; display: block; margin: 0 auto 2px auto;" />` : `<div style="height: 35px;"></div>`}
              <div style="border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
                ${orderTTD ? `<p style="font-weight: 700; margin: 0;">${orderTTD.nama}</p>` : `<p style="font-weight: 700; margin: 0;">_________________</p>`}
                ${orderTTD ? `<p style="margin: 0; font-size: 8px;">${orderTTD.jabatan}</p>` : ""}
              </div>
            </div>
          </div>
          <div class="right-signature">
            <p style="margin-bottom: 30px;">Hormat kami,<br>PT. Bukit Agrochemical Baru</p>
            <img src="/Picture4.png" alt="TTD" style="height: 50px; object-fit: contain; margin: 0 auto; display: block;" onerror="this.style.display='none'" />
            <p style="font-weight: 700; margin-top: 4px; border-top: 1px solid #000; padding-top: 3px; display: inline-block;">Sri Setyo Wibowo</p>
            <p>Manager Keuangan</p>
          </div>
        </div>
        <img src="/Picture1.png" alt="Footer" class="footer-img" onerror="this.style.display='none'" />
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

function getSuratMuatForPI(nomorPI: string): SuratMuatInfo[] {
  return [];
}
