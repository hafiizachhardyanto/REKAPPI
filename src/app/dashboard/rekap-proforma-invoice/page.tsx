"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/ui/Header";
import Table from "@/app/components/ui/Table";
import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import Card from "@/app/components/ui/Card";
import { exportToExcel } from "@/app/utils/exportExcel";

interface ProdukItem {
  namaProduk: string;
  fot: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface ProformaInvoice {
  id: string;
  tanggal: string;
  nomorPI: string;
  namaCustomer: string;
  alamatCustomer: string;
  metodePembayaran: string;
  produkItems: ProdukItem[];
  uangMuka: number;
  includePPN: boolean;
  ppnNominal: number;
  ongkosKirim: number;
  subtotal: number;
  jumlahTertagih: number;
  terbilang: string;
  tanggalJatuhTempo: string;
  keterangan: string;
  ttdNama: string;
  ttdJabatan: string;
  ttdImage: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export default function RekapProformaInvoicePage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProformaInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ProformaInvoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const q = query(collection(db, "proformaInvoice"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as ProformaInvoice));
      setData(items);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    item.nomorPI?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.namaCustomer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (num: number) => {
    if (!num && num !== 0) return "Rp -";
    return "Rp " + num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const handleDetail = (item: ProformaInvoice) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await deleteDoc(doc(db, "proformaInvoice", id));
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Tanggal": item.tanggal,
      "Nomor PI": item.nomorPI,
      "Nama Customer": item.namaCustomer,
      "Alamat": item.alamatCustomer,
      "Metode Pembayaran": item.metodePembayaran,
      "Subtotal": item.subtotal,
      "PPN 11%": item.includePPN ? item.ppnNominal : 0,
      "Uang Muka": item.uangMuka || 0,
      "Ongkos Kirim": item.ongkosKirim || 0,
      "Jumlah Tertagih": item.jumlahTertagih,
      "Terbilang": item.terbilang,
      "Jatuh Tempo": item.tanggalJatuhTempo,
      "Keterangan": item.keterangan,
      "Dibuat Oleh": item.createdBy,
    }));
    exportToExcel(exportData, `Rekap_Proforma_Invoice_${new Date().toISOString().split("T")[0]}`, "Rekap PI");
  };

  const handlePrintPDF = (item: ProformaInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const produkRows = (item.produkItems || []).map((p, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px 6px; font-size: 11px; border: 1px solid #000;">${idx + 1}</td>
        <td style="padding: 8px 6px; font-size: 11px; border: 1px solid #000; font-weight: 600;">${p.namaProduk || ""}</td>
        <td style="text-align: center; padding: 8px 6px; font-size: 11px; border: 1px solid #000;">${p.fot || ""}</td>
        <td style="text-align: right; padding: 8px 6px; font-size: 11px; border: 1px solid #000;">${p.kuantitas?.toLocaleString("id-ID") || "0"} ${p.satuan || "KG"}</td>
        <td style="text-align: right; padding: 8px 6px; font-size: 11px; border: 1px solid #000;">${formatRupiah(p.hargaSatuan)}</td>
        <td style="text-align: right; padding: 8px 6px; font-size: 11px; border: 1px solid #000; font-weight: 600;">${formatRupiah(p.totalHarga)}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proforma Invoice ${item.nomorPI}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: auto; }
          }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #000;
            font-size: 11px;
            line-height: 1.4;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          .header-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 12px;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 12px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            height: 50px;
            width: auto;
          }
          .company-info { text-align: left; }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #16a34a;
            margin: 0;
            letter-spacing: 1px;
          }
          .company-sub {
            font-size: 10px;
            color: #333;
            margin: 2px 0 0 0;
            font-weight: 600;
          }
          .company-address {
            font-size: 9px;
            color: #555;
            margin: 3px 0 0 0;
          }
          .qr-section { text-align: right; }
          .qr-placeholder {
            width: 50px;
            height: 50px;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
          }
          .header-title {
            text-align: center;
            margin: 16px 0;
            padding: 8px 0;
            background: #f0fdf4;
            border-top: 2px solid #16a34a;
            border-bottom: 2px solid #16a34a;
          }
          .header-title h1 {
            color: #111;
            font-size: 18px;
            margin: 0;
            font-weight: bold;
            letter-spacing: 4px;
          }
          .info-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 16px;
          }
          .info-box-left {
            flex: 1;
            border: 1px solid #000;
            padding: 12px;
            min-height: 90px;
          }
          .info-box-left .label {
            font-size: 10px;
            color: #333;
            margin-bottom: 6px;
          }
          .info-box-left .customer-name {
            font-size: 13px;
            font-weight: 700;
            color: #000;
            margin: 0 0 4px 0;
          }
          .info-box-left .customer-address {
            font-size: 10px;
            color: #333;
            line-height: 1.5;
          }
          .info-box-right {
            width: 280px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #333; min-width: 120px; }
          .info-value { color: #000; font-weight: 600; text-align: right; }
          .info-colon { margin: 0 8px; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
            font-size: 11px;
          }
          th {
            background: #ffedd5;
            color: #000;
            font-size: 10px;
            padding: 8px 6px;
            font-weight: 700;
            border: 1px solid #000;
            text-align: center;
          }
          td {
            border: 1px solid #000;
            padding: 8px 6px;
            vertical-align: top;
          }

          .summary-section {
            display: flex;
            border: 1px solid #000;
            border-top: none;
          }
          .terbilang-box {
            flex: 1;
            padding: 12px;
            border-right: 1px solid #000;
          }
          .terbilang-label {
            font-size: 10px;
            color: #333;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .terbilang-value {
            font-size: 11px;
            color: #000;
            font-weight: 700;
            text-transform: uppercase;
            line-height: 1.5;
          }
          .bank-info {
            margin-top: 12px;
            font-size: 9px;
            line-height: 1.6;
            color: #333;
          }
          .bank-info strong { color: #000; }
          .calculation-box {
            width: 280px;
            padding: 0;
          }
          .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
          }
          .calc-row:last-child {
            border-bottom: none;
            background: #f0fdf4;
            border-top: 2px solid #16a34a;
            padding: 8px 12px;
          }
          .calc-label { color: #333; }
          .calc-label-total { font-weight: 700; color: #000; }
          .calc-value { font-weight: 600; font-family: monospace; }
          .calc-value-total { font-size: 12px; color: #16a34a; font-weight: 700; font-family: monospace; }
          .jatuh-tempo {
            padding: 6px 12px;
            text-align: right;
            border-top: 1px solid #ddd;
            font-size: 10px;
          }
          .jatuh-tempo-label { color: #666; }
          .jatuh-tempo-value { color: #dc2626; font-weight: 700; }

          .footer-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 20px;
          }
          .bank-box {
            flex: 1;
            border: 1px solid #000;
            padding: 12px;
          }
          .bank-box-title {
            font-size: 10px;
            font-weight: 700;
            color: #000;
            margin-bottom: 8px;
          }
          .bank-box-content {
            font-size: 9px;
            line-height: 1.8;
            color: #333;
          }
          .ttd-box {
            width: 200px;
            border: 1px solid #000;
            padding: 12px;
            text-align: center;
          }
          .ttd-image {
            height: 50px;
            object-fit: contain;
            margin-bottom: 8px;
          }
          .ttd-name {
            font-size: 11px;
            font-weight: 700;
            color: #000;
            margin-top: 8px;
            border-top: 1px solid #000;
            padding-top: 4px;
          }
          .ttd-role {
            font-size: 9px;
            color: #555;
          }

          .keterangan-box {
            margin-top: 12px;
            padding: 8px 12px;
            border: 1px solid #000;
            font-size: 10px;
          }
          .keterangan-label { font-weight: 600; color: #333; }
          .keterangan-value { color: #000; margin-top: 4px; }

          .btn-print {
            background: #16a34a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            margin: 10px;
          }
          .btn-print:hover { background: #15803d; }
          .print-actions {
            text-align: center;
            padding: 10px;
            background: #f3f4f6;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          @media print {
            .print-actions { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-actions no-print">
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
        </div>

        <div class="page">
          <div class="header-top">
            <div class="logo-section">
              <img src="/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'" />
              <div class="company-info">
                <p class="company-name">PT. BUKIT AGROCHEMICAL BARU</p>
                <p class="company-sub">GENERAL TRADING FERTILIZER & AGRICULTURAL CHEMICALS</p>
                <p class="company-address">Alamat Kantor : Jl. Yos Sudarso no. 8 Kujan, Bulik, Lamandau, Kalimantan Tengah 74612</p>
              </div>
            </div>
            <div class="qr-section">
              <div class="qr-placeholder">QR</div>
            </div>
          </div>

          <div class="header-title">
            <h1>PROFORMA INVOICE</h1>
          </div>

          <div class="info-grid">
            <div class="info-box-left">
              <p class="label">Kepada Yth,</p>
              <p class="customer-name">${item.namaCustomer || ""}</p>
              <p class="customer-address">${(item.alamatCustomer || "").replace(/\n/g, "<br>")}</p>
            </div>
            <div class="info-box-right">
              <div class="info-row">
                <span class="info-label">Tanggal</span>
                <span class="info-colon">:</span>
                <span class="info-value">${item.tanggal || ""}</span>
              </div>
              <div class="info-row">
                <span class="info-label">No Invoice</span>
                <span class="info-colon">:</span>
                <span class="info-value">${item.nomorPI || ""}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Metode Pembayaran</span>
                <span class="info-colon">:</span>
                <span class="info-value">${item.metodePembayaran || ""}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">NO</th>
                <th>Nama Produk</th>
                <th style="width: 60px;">Fot</th>
                <th style="width: 90px;">Kuantitas</th>
                <th style="width: 110px;">Harga Satuan</th>
                <th style="width: 120px;">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              ${produkRows}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="terbilang-box">
              <div class="terbilang-label">Terbilang :</div>
              <div class="terbilang-value">${item.terbilang || "-"}</div>
              <div class="bank-info">
                <p style="font-weight: 700; margin-bottom: 4px;">Pembayaran mohon ditransfer via rekening:</p>
                <p><strong>BANK MANDIRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p style="margin-bottom: 8px;">No. Rek : 159-00-1205477-0</p>
                <p><strong>BANK BRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p>No. Rek : 2232-01000-879-567</p>
              </div>
            </div>
            <div class="calculation-box">
              <div class="calc-row">
                <span class="calc-label">Subtotal</span>
                <span class="calc-value">${formatRupiah(item.subtotal)}</span>
              </div>
              ${item.includePPN ? `
              <div class="calc-row">
                <span class="calc-label">PPN 11%</span>
                <span class="calc-value">${formatRupiah(item.ppnNominal)}</span>
              </div>
              ` : ""}
              ${(item.uangMuka || 0) > 0 ? `
              <div class="calc-row">
                <span class="calc-label">Uang Muka</span>
                <span class="calc-value" style="color: #dc2626;">- ${formatRupiah(item.uangMuka)}</span>
              </div>
              ` : ""}
              ${(item.ongkosKirim || 0) > 0 ? `
              <div class="calc-row">
                <span class="calc-label">Ongkos Kirim</span>
                <span class="calc-value">${formatRupiah(item.ongkosKirim)}</span>
              </div>
              ` : ""}
              <div class="calc-row">
                <span class="calc-label-total">Jumlah Tertagih</span>
                <span class="calc-value-total">${formatRupiah(item.jumlahTertagih)}</span>
              </div>
              <div class="jatuh-tempo">
                <span class="jatuh-tempo-label">Tanggal Jatuh Tempo : </span>
                <span class="jatuh-tempo-value">${item.tanggalJatuhTempo || ""}</span>
              </div>
            </div>
          </div>

          ${item.keterangan ? `
          <div class="keterangan-box">
            <span class="keterangan-label">Keterangan:</span>
            <div class="keterangan-value">${item.keterangan}</div>
          </div>
          ` : ""}

          <div class="footer-grid">
            <div class="bank-box">
              <p class="bank-box-title">Informasi Pembayaran:</p>
              <div class="bank-box-content">
                <p><strong>BANK MANDIRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p>No. Rek : 159-00-1205477-0</p>
                <p style="margin-top: 8px;"><strong>BANK BRI</strong> - Cabang Lamandau</p>
                <p>a/n PT Bukit Agrochemical Baru</p>
                <p>No. Rek : 2232-01000-879-567</p>
              </div>
            </div>
            <div class="ttd-box">
              ${item.ttdImage ? `<img src="${item.ttdImage}" class="ttd-image" alt="TTD" />` : `<div style="height: 50px;"></div>`}
              <p class="ttd-name">${item.ttdNama || ""}</p>
              <p class="ttd-role">${item.ttdJabatan || ""}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const columns = [
    {
      key: "tanggal",
      header: "Tanggal",
      width: "120px",
      render: (row: ProformaInvoice) => <span className="font-medium text-gray-800">{row.tanggal}</span>,
    },
    {
      key: "nomorPI",
      header: "Nomor PI",
      width: "150px",
      render: (row: ProformaInvoice) => <span className="font-semibold text-green-700">{row.nomorPI}</span>,
    },
    {
      key: "namaCustomer",
      header: "Customer",
      render: (row: ProformaInvoice) => row.namaCustomer,
    },
    {
      key: "jumlahTertagih",
      header: "Jumlah",
      width: "160px",
      render: (row: ProformaInvoice) => <span className="font-mono font-medium text-gray-900">{formatRupiah(row.jumlahTertagih)}</span>,
    },
    {
      key: "metodePembayaran",
      header: "Pembayaran",
      width: "120px",
      render: (row: ProformaInvoice) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${row.metodePembayaran === "Transfer" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
          {row.metodePembayaran}
        </span>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      width: "180px",
      render: (row: ProformaInvoice) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleDetail(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handlePrintPDF(row); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Print PDF">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Header title="Rekap Proforma Invoice" subtitle="Kelola dan lihat riwayat proforma invoice" />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari nomor PI, customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportExcel}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Menampilkan {filteredData.length} dari {data.length} data
        </div>

        <Table columns={columns} data={filteredData} isLoading={isLoading} emptyMessage="Belum ada data proforma invoice" keyExtractor={(row) => row.id} onRowClick={handleDetail} />
      </Card>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Proforma Invoice" size="lg" footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
          <Button variant="primary" onClick={() => selectedItem && handlePrintPDF(selectedItem)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PDF
          </Button>
        </div>
      }>
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Nomor PI</p>
                <p className="text-lg font-bold text-green-700">{selectedItem.nomorPI}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal</p>
                <p className="text-lg font-bold text-gray-800">{selectedItem.tanggal}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-gray-800">{selectedItem.namaCustomer}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedItem.alamatCustomer}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Metode Pembayaran</p>
                <p className="font-semibold text-gray-800">{selectedItem.metodePembayaran}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide mt-3">Jatuh Tempo</p>
                <p className="font-semibold text-red-600">{selectedItem.tanggalJatuhTempo}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">FOT</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Kuantitas</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Harga</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selectedItem.produkItems || []).map((p, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.namaProduk}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.fot}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">{p.kuantitas?.toLocaleString("id-ID")} {p.satuan}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">{formatRupiah(p.hargaSatuan)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right font-mono">{formatRupiah(p.totalHarga)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Terbilang</p>
                <p className="text-sm font-semibold text-gray-800 uppercase">{selectedItem.terbilang}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.subtotal)}</span>
                </div>
                {selectedItem.includePPN && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">PPN 11%</span>
                    <span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.ppnNominal)}</span>
                  </div>
                )}
                {(selectedItem.uangMuka || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Uang Muka</span>
                    <span className="text-sm font-mono font-medium text-red-600">- {formatRupiah(selectedItem.uangMuka)}</span>
                  </div>
                )}
                {(selectedItem.ongkosKirim || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Ongkos Kirim</span>
                    <span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.ongkosKirim)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-green-200 mt-2">
                  <span className="text-base font-bold text-green-800">Jumlah Tertagih</span>
                  <span className="text-lg font-mono font-bold text-green-700">{formatRupiah(selectedItem.jumlahTertagih)}</span>
                </div>
              </div>
            </div>
            {selectedItem.ttdImage && (
              <div className="flex justify-end">
                <div className="text-center p-4">
                  <img src={selectedItem.ttdImage} alt="TTD" className="h-20 object-contain mx-auto" />
                  <p className="text-sm font-semibold mt-2">{selectedItem.ttdNama}</p>
                  <p className="text-xs text-gray-500">{selectedItem.ttdJabatan}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}