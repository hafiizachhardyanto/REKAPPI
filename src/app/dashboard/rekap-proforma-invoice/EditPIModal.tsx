"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import { ProformaInvoice } from "./types";
import { formatRupiah } from "./utils";

interface EditPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProformaInvoice | null;
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  isSubmitting: boolean;
  handleUpdateFull: (e: React.FormEvent) => void;
}

export default function EditPIModal({ isOpen, onClose, selectedItem, editForm, setEditForm, isSubmitting, handleUpdateFull }: EditPIModalProps) {
  const handleEditProdukChange = (index: number, field: string, value: string) => {
    setEditForm((prev: any) => { const newItems = [...prev.produkItems]; newItems[index] = { ...newItems[index], [field]: value }; return { ...prev, produkItems: newItems }; });
  };

  const addEditProdukItem = () => {
    setEditForm((prev: any) => ({ ...prev, produkItems: [...prev.produkItems, { namaProduk: "", fot: "", produsen: "", kuantitas: 0, satuan: "KG", hargaSatuan: 0, hargaPerZakDus: 0, bobotPerUnit: 50, jumlahIsiBotol: 1, totalHarga: 0, includePPN: false, ppnNominal: 0 }] }));
  };

  const removeEditProdukItem = (index: number) => {
    if (editForm.produkItems.length > 1) { setEditForm((prev: any) => ({ ...prev, produkItems: prev.produkItems.filter((_: any, i: number) => i !== index) })); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Proforma Invoice" size="lg" footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleUpdateFull} isLoading={isSubmitting}>Simpan Perubahan</Button>
      </div>
    }>
      <form onSubmit={handleUpdateFull} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Tanggal" type="date" value={editForm.tanggal} onChange={(e) => setEditForm((prev: any) => ({ ...prev, tanggal: e.target.value }))} required />
          <Input label="Nomor PI" type="text" value={editForm.nomorPI} onChange={(e) => setEditForm((prev: any) => ({ ...prev, nomorPI: e.target.value }))} required />
          <Input label="Nama Customer" type="text" value={editForm.namaCustomer} onChange={(e) => setEditForm((prev: any) => ({ ...prev, namaCustomer: e.target.value }))} required />
          <Input label="Alamat Customer" type="text" value={editForm.alamatCustomer} onChange={(e) => setEditForm((prev: any) => ({ ...prev, alamatCustomer: e.target.value }))} required />
          <Input label="NPWP" type="text" value={editForm.npwp} onChange={(e) => setEditForm((prev: any) => ({ ...prev, npwp: e.target.value }))} />
          <Select label="Metode Pembayaran" value={editForm.metodePembayaran} onChange={(e) => setEditForm((prev: any) => ({ ...prev, metodePembayaran: e.target.value }))} options={[{ value: "Transfer", label: "Transfer" }, { value: "Cash", label: "Cash" }]} required />
          <Input label="Uang Muka" type="text" value={editForm.uangMuka} onChange={(e) => setEditForm((prev: any) => ({ ...prev, uangMuka: e.target.value }))} />
          <Input label="Ongkos Kirim" type="text" value={editForm.ongkosKirim} onChange={(e) => setEditForm((prev: any) => ({ ...prev, ongkosKirim: e.target.value }))} />
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keterangan</label>
            <textarea value={editForm.keterangan} onChange={(e) => setEditForm((prev: any) => ({ ...prev, keterangan: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:z-20 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200" />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Daftar Produk</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">No</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Nama Produk</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">FOT</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Produsen</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Kuantitas</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Satuan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Harga Satuan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-800 uppercase">Harga/ZAK</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-green-800 uppercase">PPN</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-green-800 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editForm.produkItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-3 py-2 relative overflow-visible"><input type="text" value={item.namaProduk} onChange={(e) => handleEditProdukChange(index, "namaProduk", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[280px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></td>
                    <td className="px-3 py-2 relative overflow-visible"><input type="text" value={item.fot || ""} onChange={(e) => handleEditProdukChange(index, "fot", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></td>
                    <td className="px-3 py-2 relative overflow-visible"><input type="text" value={item.produsen || ""} onChange={(e) => handleEditProdukChange(index, "produsen", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[200px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></td>
                    <td className="px-3 py-2 relative overflow-visible"><input type="text" inputMode="decimal" value={String(item.kuantitas)} onChange={(e) => handleEditProdukChange(index, "kuantitas", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[160px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></td>
                    <td className="px-3 py-2 relative overflow-visible">
                      <select value={item.satuan} onChange={(e) => handleEditProdukChange(index, "satuan", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[160px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md">
                        <option value="KG">KG</option>
                        <option value="ZAK">ZAK</option>
                        <option value="DUS">DUS</option>
                        <option value="LITER">LITER</option>
                        <option value="BOTOL">BOTOL</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 relative overflow-visible"><input type="text" inputMode="decimal" value={String(item.hargaSatuan)} onChange={(e) => handleEditProdukChange(index, "hargaSatuan", e.target.value)} className="w-full min-w-[60px] px-2 py-1 border border-gray-300 rounded text-sm transition-all duration-200 focus:w-auto focus:min-w-[180px] focus:py-2.5 focus:px-3 focus:text-base focus:shadow-2xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:bg-white focus:z-50 focus:relative focus:rounded-md" /></td>
                    <td className="px-3 py-2 text-sm font-mono text-gray-700">{formatRupiah(item.hargaPerZakDus || 0)}</td>
                    <td className="px-3 py-2 text-center overflow-visible"><input type="checkbox" checked={item.includePPN || false} onChange={(e) => handleEditProdukChange(index, "includePPN", e.target.checked ? "true" : "")} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" /></td>
                    <td className="px-3 py-2 text-center overflow-visible">
                      <button type="button" onClick={() => removeEditProdukItem(index)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" disabled={editForm.produkItems.length === 1}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addEditProdukItem}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Produk
          </Button>
        </div>
      </form>
    </Modal>
  );
}
