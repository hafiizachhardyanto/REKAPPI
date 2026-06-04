"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import { ProformaInvoice, SuratMuatInfo, SuratMuatItem } from "./types";
import { formatRupiah, getStatusBadge, getPaymentBadge } from "./utils";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProformaInvoice | null;
  getStatusPengangkutan: (item: ProformaInvoice) => string;
  getPaymentStatus: (item: ProformaInvoice) => string;
  getProdukLoadStatus: (item: ProformaInvoice) => any[];
  getSuratMuatForPI: (nomorPI: string) => SuratMuatInfo[];
  bastExists: boolean;
  handlePrintPDF: (item: ProformaInvoice) => void;
  handleGenerateBast: (item: ProformaInvoice) => void;
  handlePrintBastSimple: (item: ProformaInvoice, baData: any) => void;
  handleResetBast: (nomorPI: string) => void;
  handleOpenPaymentEdit: (item: ProformaInvoice) => void;
  handleEditSurat: (surat: SuratMuatInfo) => void;
  handleDeleteSurat: (surat: SuratMuatInfo) => void;
  handlePrintSuratPDF: (surat: SuratMuatInfo) => void;
  handleOpenInvoice: (surat: SuratMuatInfo) => void;
  router: any;
}

export default function DetailModal(props: DetailModalProps) {
  const { isOpen, onClose, selectedItem, getStatusPengangkutan, getPaymentStatus, getProdukLoadStatus, getSuratMuatForPI, bastExists, handlePrintPDF, handleGenerateBast, handlePrintBastSimple, handleResetBast, handleOpenPaymentEdit, handleEditSurat, handleDeleteSurat, handlePrintSuratPDF, handleOpenInvoice, router } = props;

  if (!selectedItem) return null;
  const suratList = getSuratMuatForPI(selectedItem.nomorPI);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Proforma Invoice" size="lg" footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Tutup</Button>
        <Button variant="primary" onClick={() => handlePrintPDF(selectedItem)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print PDF
        </Button>
      </div>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-wide">Nomor PI</p><p className="text-lg font-bold text-green-700">{selectedItem.nomorPI}</p></div>
          <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal</p><p className="text-lg font-bold text-gray-800">{selectedItem.tanggal}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
            <p className="font-semibold text-gray-800">{selectedItem.namaCustomer}</p>
            <p className="text-sm text-gray-600 mt-1">{selectedItem.alamatCustomer}</p>
            {selectedItem.npwp && <p className="text-sm text-gray-600 mt-1">NPWP: {selectedItem.npwp}</p>}
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Metode Pembayaran</p>
            <p className="font-semibold text-gray-800">{selectedItem.metodePembayaran}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-3">Jatuh Tempo</p>
            <p className="font-semibold text-red-600">{selectedItem.tanggalJatuhTempo}</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Status Pengangkutan</p>
            {(() => { const status = getStatusPengangkutan(selectedItem); const badge = getStatusBadge(status); return (<span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${badge.class}`}>{badge.label}</span>); })()}
          </div>
          <div className="space-y-2">
            {getProdukLoadStatus(selectedItem).map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{p.namaProduk}</span>
                <span className="font-mono text-gray-900">{p.loaded.toLocaleString()} / {p.ordered.toLocaleString()} KG</span>
              </div>
            ))}
          </div>
        </div>
        {(() => {
          const status = getStatusPengangkutan(selectedItem);
          return status === "complete" ? (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">Berita Acara Serah Terima</p>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${bastExists ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>{bastExists ? "Sudah Terbit" : "Siap Dibuat"}</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">Seluruh muatan telah selesai dimuat. {bastExists ? "Berita Acara sudah dibuat." : "Buat Berita Acara Serah Terima Barang."}</p>
              <div className="flex gap-2">
                {!bastExists && (
                  <button onClick={() => handleGenerateBast(selectedItem)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Generate Berita Acara
                  </button>
                )}
                {bastExists && (
                  <>
                    <button onClick={() => handlePrintBastSimple(selectedItem, { nomorSeri: selectedItem.nomorPI, items: [] })} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print BA
                    </button>
                    <button onClick={() => handleResetBast(selectedItem.nomorPI)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Reset BA
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null;
        })()}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold">Status Pelunasan</p>
            {(() => { const status = selectedItem.statusPelunasan || getPaymentStatus(selectedItem); const badge = getPaymentBadge(status); return (<span className={`px-3 py-1 rounded-lg text-xs font-bold border ${badge.class}`}>{badge.label}</span>); })()}
          </div>
          <div className="mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Riwayat Pembayaran</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-amber-200"><th className="text-left py-1 px-2 text-xs font-semibold text-amber-700">No</th><th className="text-left py-1 px-2 text-xs font-semibold text-amber-700">Tanggal</th><th className="text-right py-1 px-2 text-xs font-semibold text-amber-700">Jumlah</th></tr></thead>
              <tbody>
                {(selectedItem.riwayatPembayaran || []).length === 0 && (<tr><td colSpan={3} className="py-2 text-center text-gray-500 text-xs">Belum ada pembayaran</td></tr>)}
                {(selectedItem.riwayatPembayaran || []).map((r, i) => (
                  <tr key={i} className="border-b border-amber-100"><td className="py-1 px-2 text-gray-700">{i + 1}</td><td className="py-1 px-2 text-gray-700">{r.tanggal}</td><td className="py-1 px-2 text-right font-mono text-gray-900">{formatRupiah(r.jumlah)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 border-t border-amber-200 pt-2">
            <div className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">Total Dibayar</span><span className="font-mono text-gray-900">{formatRupiah(selectedItem.jumlahUangDibayar || 0)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">Jumlah Tertagih</span><span className="font-mono text-gray-900">{formatRupiah(selectedItem.jumlahTertagih)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">Sisa Pembayaran</span><span className="font-mono text-gray-900">{formatRupiah(Math.max(0, (selectedItem.jumlahTertagih || 0) - (selectedItem.jumlahUangDibayar || 0)))}</span></div>
            {selectedItem.tanggalPembayaran && <div className="flex justify-between items-center text-sm"><span className="font-medium text-gray-700">Pembayaran Terakhir</span><span className="font-mono text-gray-900">{selectedItem.tanggalPembayaran}</span></div>}
          </div>
          <button onClick={() => handleOpenPaymentEdit(selectedItem)} className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition-colors">Tambah Pembayaran</button>
        </div>
        {suratList.length > 0 && (
          <div className="overflow-x-auto">
            <p className="text-sm font-semibold text-gray-700 mb-3">Riwayat Surat Muat</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">Nomor Seri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">Jenis Pupuk</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase border">ZAK</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase border">Total KG</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">No. Polisi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase border">Driver</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-green-800 uppercase border" colSpan={4}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suratList.map((surat, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-3 text-sm text-gray-900 border">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-green-700 border">{surat.nomorSeri}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border">{surat.tanggal}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 border">{surat.items.map((it, i) => (<div key={i}>{it.jenisPupuk} ({it.pengambilanZAK} ZAK)</div>))}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono border">{surat.items.reduce((sum, it) => sum + (it.pengambilanZAK || 0), 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right font-mono border">{surat.totalKG.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border">{surat.nomorPolisi}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border">{surat.driverUnit}</td>
                    <td className="px-2 py-3 text-sm text-gray-600 border">
                      <button onClick={() => handlePrintSuratPDF(surat)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Print Surat">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </button>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 border">
                      <button onClick={() => handleEditSurat(surat)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Surat">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 border">
                      <button onClick={() => handleDeleteSurat(surat)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Surat">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 border">
                      <button onClick={() => handleOpenInvoice(surat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Invoice">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">FOT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase">Produsen</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Kuantitas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Harga</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Harga/ZAK</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-green-800 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(selectedItem.produkItems || []).map((p, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.namaProduk}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.fot}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.produsen || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">{p.kuantitas?.toLocaleString("id-ID")} {p.satuan}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">{formatRupiah(p.hargaSatuan)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">{formatRupiah(p.hargaPerZakDus)}</td>
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
            <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Subtotal</span><span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.subtotal)}</span></div>
            {selectedItem.includePPN && <div className="flex justify-between py-1"><span className="text-sm text-gray-600">PPN 11%</span><span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.ppnNominal)}</span></div>}
            {(selectedItem.uangMuka || 0) > 0 && <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Uang Muka</span><span className="text-sm font-mono font-medium text-red-600">- {formatRupiah(selectedItem.uangMuka)}</span></div>}
            {(selectedItem.ongkosKirim || 0) > 0 && <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Ongkos Kirim</span><span className="text-sm font-mono font-medium">{formatRupiah(selectedItem.ongkosKirim)}</span></div>}
            <div className="flex justify-between py-2 border-t border-green-200 mt-2"><span className="text-base font-bold text-green-800">Jumlah Tertagih</span><span className="text-lg font-mono font-bold text-green-700">{formatRupiah(selectedItem.jumlahTertagih)}</span></div>
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
    </Modal>
  );
}
