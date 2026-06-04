"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Table from "@/app/components/ui/Table";
import { ProformaInvoice } from "./types";
import { formatRupiah, getPaymentBadge } from "./utils";

interface RekapTableProps {
  data: ProformaInvoice[];
  isLoading: boolean;
  getSuratMuatForPI: (nomorPI: string) => any[];
  getStatusPengangkutan: (item: ProformaInvoice) => string;
  getPaymentStatus: (item: ProformaInvoice) => string;
  getProdukLoadStatus: (item: ProformaInvoice) => any[];
  handleDetail: (item: ProformaInvoice) => void;
  handleEdit: (item: ProformaInvoice) => void;
  handleDelete: (id: string) => void;
  handlePrintPDF: (item: ProformaInvoice) => void;
  handleOpenFullInvoice: (item: ProformaInvoice) => void;
  handleOpenPaymentEdit: (item: ProformaInvoice) => void;
}

export default function RekapTable(props: RekapTableProps) {
  const router = useRouter();
  const { data, isLoading, getStatusPengangkutan, getPaymentStatus, getProdukLoadStatus, handleDetail, handleEdit, handleDelete, handlePrintPDF, handleOpenFullInvoice, handleOpenPaymentEdit } = props;

  const columns = [
    { key: "tanggal", header: "Tanggal", width: "120px", render: (row: ProformaInvoice) => <span className="font-medium text-gray-800">{row.tanggal}</span> },
    { key: "nomorPI", header: "Nomor PI", width: "150px", render: (row: ProformaInvoice) => <span className="font-semibold text-green-700">{row.nomorPI}</span> },
    { key: "namaCustomer", header: "Customer", render: (row: ProformaInvoice) => row.namaCustomer },
    {
      key: "statusPelunasan", header: "Status Pelunasan", width: "160px",
      render: (row: ProformaInvoice) => {
        const status = row.statusPelunasan || getPaymentStatus(row);
        const badge = getPaymentBadge(status);
        const paid = row.jumlahUangDibayar || 0;
        const total = row.jumlahTertagih || 0;
        return (
          <div className="flex flex-col gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); handleOpenPaymentEdit(row); }} className={`px-2 py-1 rounded-md text-xs font-bold border transition-colors text-left ${badge.class}`}>{badge.label}</button>
            <div className="text-xs text-gray-600 font-mono">{formatRupiah(paid)} / {formatRupiah(total)}</div>
            {row.tanggalPembayaran && <div className="text-xs text-gray-500">{row.tanggalPembayaran}</div>}
          </div>
        );
      },
    },
    {
      key: "invoice", header: "Invoice", width: "120px",
      render: (row: ProformaInvoice) => {
        const status = getStatusPengangkutan(row);
        const isComplete = status === "complete";
        const isPaid = getPaymentStatus(row) === "Lunas";
        const canInvoice = isComplete && isPaid;
        let title = "";
        if (!isComplete) title = "Belum selesai dimuat";
        else if (!isPaid) title = "Menunggu pelunasan";
        else title = "Print Invoice Full";
        return (
          <button onClick={(e) => { e.stopPropagation(); handleOpenFullInvoice(row); }} disabled={!canInvoice} className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${canInvoice ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`} title={title}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Invoice
          </button>
        );
      },
    },
    { key: "jumlahTertagih", header: "Jumlah", width: "160px", render: (row: ProformaInvoice) => <span className="font-mono font-medium text-gray-900">{formatRupiah(row.jumlahTertagih)}</span> },
    {
      key: "statusPengangkutan", header: "Status Muat", width: "320px",
      render: (row: ProformaInvoice) => {
        const produkStatus = getProdukLoadStatus(row);
        const isComplete = produkStatus.every((p) => p.status === "complete");
        const isPartial = produkStatus.some((p) => p.status === "partial" || p.status === "complete");
        const badge = isComplete ? { class: "bg-green-100 text-green-700", label: "Selesai Dimuat" } : isPartial ? { class: "bg-yellow-100 text-yellow-700", label: "Sebagian Dimuat" } : { class: "bg-gray-100 text-gray-600", label: "Belum Dimuat" };
        return (
          <div className="flex flex-col gap-2">
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${badge.class}`}>{badge.label}</span>
            <div className="space-y-1">
              {produkStatus.map((p, i) => (
                <div key={i} className="text-xs text-gray-600">
                  <span className="font-semibold">{p.namaProduk}:</span>{" "}
                  <span className="font-mono">{p.loaded.toLocaleString()} / {p.ordered.toLocaleString()} KG</span>
                  {p.status === "partial" && <span className="text-yellow-600 ml-1">(Sebagian)</span>}
                  {p.status === "complete" && <span className="text-green-600 ml-1">(Selesai)</span>}
                  {p.status === "pending" && <span className="text-gray-400 ml-1">(Belum)</span>}
                </div>
              ))}
            </div>
            {!isComplete && (
              <button onClick={(e) => { e.stopPropagation(); router.push("/dashboard/surat-pengangkutan?nomorPI=" + encodeURIComponent(row.nomorPI)); }} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Buat Surat Muat
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "metodePembayaran", header: "Pembayaran", width: "120px",
      render: (row: ProformaInvoice) => <span className={`px-2 py-1 rounded-md text-xs font-medium ${row.metodePembayaran === "Transfer" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{row.metodePembayaran}</span>,
    },
    {
      key: "aksi", header: "Aksi", width: "200px",
      render: (row: ProformaInvoice) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleDetail(row); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handlePrintPDF(row); }} disabled={(row.jumlahUangDibayar || 0) === 0} className={`p-2 rounded-lg transition-colors ${(row.jumlahUangDibayar || 0) === 0 ? "text-gray-300 cursor-not-allowed" : "text-purple-600 hover:bg-purple-50"}`} title={(row.jumlahUangDibayar || 0) === 0 ? "Belum dibayar - tidak dapat print" : "Print PDF"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table columns={columns} data={data} isLoading={isLoading} emptyMessage="Belum ada data proforma invoice" keyExtractor={(row) => row.id} onRowClick={handleDetail} />
  );
}
