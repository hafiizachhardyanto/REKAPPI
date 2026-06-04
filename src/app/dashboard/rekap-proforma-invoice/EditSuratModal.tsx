"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { SuratMuatInfo } from "./types";

interface EditSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSurat: SuratMuatInfo | null;
  editSuratForm: any;
  setEditSuratForm: React.Dispatch<React.SetStateAction<any>>;
  nomorSeriError: string;
  isSubmitting: boolean;
  handleUpdateSurat: (e: React.FormEvent) => void;
  handleGenerateNomorSeriEdit: () => void;
  handleSuratItemChange: (idx: number, field: string, value: string) => void;
  addSuratItem: () => void;
  removeSuratItem: (idx: number) => void;
}

export default function EditSuratModal(props: EditSuratModalProps) {
  const { isOpen, onClose, selectedSurat, editSuratForm, setEditSuratForm, nomorSeriError, isSubmitting, handleUpdateSurat, handleGenerateNomorSeriEdit, handleSuratItemChange, addSuratItem, removeSuratItem } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Surat Muat - ${selectedSurat?.nomorSeri || ""}`} size="lg" footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleUpdateSurat} isLoading={isSubmitting} disabled={!!nomorSeriError}>Simpan Perubahan</Button>
      </div>
    }>
      <form onSubmit={handleUpdateSurat} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Tanggal" type="date" value={editSuratForm.tanggal} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, tanggal: e.target.value }))} required />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Seri</label>
            <div className="flex gap-2">
              <input type="text" value={editSuratForm.nomorSeri} readOnly className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all font-mono text-sm bg-gray-100 transition-all duration-200 focus:w-auto focus:min-w-[400px] focus:py-3 focus:px-4 focus:text-base focus:shadow-2xl focus:z-50 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200 ${nomorSeriError ? "border-red-500 bg-red-50" : "border-gray-300"}`} />
              <button type="button" onClick={handleGenerateNomorSeriEdit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold whitespace-nowrap transition-colors">Generate</button>
            </div>
            {nomorSeriError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {nomorSeriError}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Surat</label>
            <select value={editSuratForm.jenisSurat} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, jenisSurat: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:z-20 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200">
              <option value="gudangInduk">Gudang Induk</option>
              <option value="do">DO (Delivery Order)</option>
            </select>
          </div>
          {editSuratForm.jenisSurat === "do" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sub Jenis DO</label>
              <select value={editSuratForm.subJenisDO} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, subJenisDO: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:z-20 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200">
                <option value="">Pilih Sub Jenis</option>
                <option value="mandiri">DO Mandiri</option>
                <option value="dikuasakan">DO Dikuasakan</option>
              </select>
            </div>
          )}
          <Input label="Nomor Polisi" type="text" value={editSuratForm.nomorPolisi} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, nomorPolisi: e.target.value }))} required />
          <Input label="Driver Unit" type="text" value={editSuratForm.driverUnit} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, driverUnit: e.target.value }))} required />
          <Input label="Nomor SIM" type="text" value={editSuratForm.nomorSIM} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, nomorSIM: e.target.value }))} className="md:col-span-2" />
        </div>
        {editSuratForm.jenisSurat !== "gudangInduk" && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Informasi Penerima</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Kepada Yth (Nama)" type="text" value={editSuratForm.kepadaNama} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, kepadaNama: e.target.value }))} placeholder="Contoh: Bapak Kepala Gudang" required />
              <Input label="Nama Perusahaan" type="text" value={editSuratForm.kepadaPerusahaan} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, kepadaPerusahaan: e.target.value }))} placeholder="Contoh: PT Bukit Agrochemical Baru" required />
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                <textarea value={editSuratForm.kepadaAlamat} onChange={(e) => setEditSuratForm((prev: any) => ({ ...prev, kepadaAlamat: e.target.value }))} rows={3} placeholder="Contoh: Desa Sungai Rangit, Pangkalan Lada" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:z-20 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200" required />
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Item Pengangkutan</h4>
          {editSuratForm.items.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-700">Item {idx + 1}</h5>
                {editSuratForm.items.length > 1 && (
                  <button type="button" onClick={() => removeSuratItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Nomor SUB DO</label><input type="text" value={item.nomorSubDO} onChange={(e) => handleSuratItemChange(idx, "nomorSubDO", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[260px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Nomor PO</label><input type="text" value={item.nomorPO} onChange={(e) => handleSuratItemChange(idx, "nomorPO", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[260px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pupuk *</label><input type="text" value={item.jenisPupuk} onChange={(e) => handleSuratItemChange(idx, "jenisPupuk", e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[260px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">FOT</label><input type="text" value={item.fot} onChange={(e) => handleSuratItemChange(idx, "fot", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Party</label><input type="text" value={item.party} onChange={(e) => handleSuratItemChange(idx, "party", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Pengambilan (ZAK) *</label><input type="number" value={item.pengambilanZAK} onChange={(e) => handleSuratItemChange(idx, "pengambilanZAK", e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
                <div className="relative overflow-visible"><label className="block text-xs font-medium text-gray-600 mb-1">Sisa</label><input type="text" value={item.sisa} onChange={(e) => handleSuratItemChange(idx, "sisa", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSuratItem}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Item
          </Button>
        </div>
      </form>
    </Modal>
  );
}
