"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { ProformaInvoice } from "./types";
import { formatRupiah } from "./utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProformaInvoice | null;
  paymentForm: any;
  setPaymentForm: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
  handleUpdatePayment: (e: React.FormEvent) => void;
}

export default function PaymentModal({ isOpen, onClose, selectedItem, paymentForm, setPaymentForm, isSubmitting, handleUpdatePayment }: PaymentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Pembayaran" size="md" footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleUpdatePayment} isLoading={isSubmitting}>Simpan</Button>
      </div>
    }>
      <form onSubmit={handleUpdatePayment} className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nomor PI</p>
          <p className="text-lg font-bold text-green-700">{selectedItem?.nomorPI}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
          <p className="text-sm font-semibold text-gray-800">{selectedItem?.namaCustomer}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700">Jumlah Tertagih</span>
            <span className="text-lg font-mono font-bold text-green-700">{selectedItem ? formatRupiah(selectedItem.jumlahTertagih) : "-"}</span>
          </div>
        </div>
        {(selectedItem?.riwayatPembayaran || []).length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Riwayat Pembayaran</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-1 px-2 text-xs font-semibold text-gray-600">No</th><th className="text-left py-1 px-2 text-xs font-semibold text-gray-600">Tanggal</th><th className="text-right py-1 px-2 text-xs font-semibold text-gray-600">Jumlah</th></tr></thead>
              <tbody>
                {selectedItem?.riwayatPembayaran?.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100"><td className="py-1 px-2 text-gray-700">{i + 1}</td><td className="py-1 px-2 text-gray-700">{r.tanggal}</td><td className="py-1 px-2 text-right font-mono text-gray-900">{formatRupiah(r.jumlah)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-300"><td colSpan={2} className="py-1 px-2 text-xs font-bold text-gray-700">Total Dibayar</td><td className="py-1 px-2 text-right font-mono font-bold text-gray-900">{formatRupiah(selectedItem?.jumlahUangDibayar || 0)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm font-semibold text-blue-700 mb-3">Pembayaran Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jumlah Pembayaran</label>
              <input type="text" inputMode="decimal" value={paymentForm.jumlahUangDibayar} onChange={(e) => setPaymentForm((prev: any) => ({ ...prev, jumlahUangDibayar: e.target.value }))} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white transition-all duration-200 focus:w-auto focus:min-w-[280px] focus:py-3 focus:px-4 focus:text-base focus:shadow-2xl focus:z-50 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200" />
            </div>
            <Input label="Tanggal Pembayaran" type="date" value={paymentForm.tanggalPembayaran} onChange={(e) => setPaymentForm((prev: any) => ({ ...prev, tanggalPembayaran: e.target.value }))} />
          </div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-sm text-amber-700"><span className="font-semibold">Status Otomatis: </span>{selectedItem && (() => {
            const currentPaid = selectedItem.jumlahUangDibayar || 0;
            const newPaid = parseFloat(paymentForm.jumlahUangDibayar) || 0;
            const totalPaid = currentPaid + newPaid;
            const total = selectedItem.jumlahTertagih || 0;
            if (totalPaid >= total && total > 0) return "Lunas";
            if (totalPaid > 0) return "Cicilan";
            return "Belum Lunas";
          })()}</p>
        </div>
        {selectedItem && parseFloat(paymentForm.jumlahUangDibayar || "0") > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center text-sm"><span className="font-medium text-blue-700">Total Setelah Pembayaran</span><span className="font-mono font-semibold text-blue-700">{formatRupiah((selectedItem.jumlahUangDibayar || 0) + (parseFloat(paymentForm.jumlahUangDibayar) || 0))}</span></div>
            <div className="flex justify-between items-center text-sm mt-1"><span className="font-medium text-blue-700">Sisa Pembayaran</span><span className="font-mono font-semibold text-blue-700">{formatRupiah(Math.max(0, (selectedItem.jumlahTertagih || 0) - (selectedItem.jumlahUangDibayar || 0) - (parseFloat(paymentForm.jumlahUangDibayar) || 0)))}</span></div>
          </div>
        )}
      </form>
    </Modal>
  );
}
