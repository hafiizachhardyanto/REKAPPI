"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/ui/Header";
import Table from "@/app/components/ui/Table";
import Button from "@/app/components/ui/Button";
import Modal from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Card from "@/app/components/ui/Card";
import { exportToExcel } from "@/app/utils/exportExcel";
import { ProformaInvoice, StockGudang } from "@/app/types";

export default function RekapProformaInvoicePage() {
  const { user } = useAuth();
  const [data, setData] = useState([] as ProformaInvoice[]);
  const [stockList, setStockList] = useState([] as StockGudang[]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null as ProformaInvoice | null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    tanggal: "",
    nomorPI: "",
    namaCustomer: "",
    namaProduk: "",
    fot: "",
    kuantitasKG: "",
    barangDiambil: "",
    sisaBarang: "",
    kodeBeritaAcara: "",
    kodeInvoice: "",
    keterangan: "",
  });

  const [editFiles, setEditFiles] = useState({
    fileBeritaAcara: null as File | null,
    fileInvoice: null as File | null,
  });

  useEffect(() => {
    fetchData();
    fetchStockGudang();
  }, []);

  useEffect(() => {
    const kuantitas = parseFloat(editForm.kuantitasKG) || 0;
    const diambil = parseFloat(editForm.barangDiambil) || 0;
    const sisa = kuantitas - diambil;
    setEditForm((prev) => ({ ...prev, sisaBarang: sisa >= 0 ? sisa.toString() : "0" }));
  }, [editForm.kuantitasKG, editForm.barangDiambil]);

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

  const fetchStockGudang = async () => {
    try {
      const q = query(collection(db, "stockGudang"), orderBy("namaBarang", "asc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StockGudang));
      setStockList(items);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredData = data.filter((item) =>
    item.nomorPI.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.namaCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.namaProduk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: ProformaInvoice) => {
    setSelectedItem(item);
    setEditForm({
      tanggal: item.tanggal,
      nomorPI: item.nomorPI,
      namaCustomer: item.namaCustomer,
      namaProduk: item.namaProduk,
      fot: item.fot,
      kuantitasKG: item.kuantitasKG.toString(),
      barangDiambil: item.barangDiambil.toString(),
      sisaBarang: item.sisaBarang.toString(),
      kodeBeritaAcara: item.kodeBeritaAcara,
      kodeInvoice: item.kodeInvoice,
      keterangan: item.keterangan,
    });
    setEditFiles({ fileBeritaAcara: null, fileInvoice: null });
    setIsEditModalOpen(true);
  };

  const handleDetail = (item: ProformaInvoice) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      let fileBeritaAcara = selectedItem.fileBeritaAcara;
      let fileInvoice = selectedItem.fileInvoice;
      let fileBeritaAcaraName = selectedItem.fileBeritaAcaraName;
      let fileInvoiceName = selectedItem.fileInvoiceName;

      if (editFiles.fileBeritaAcara) {
        fileBeritaAcara = await uploadFile(editFiles.fileBeritaAcara, "berita-acara");
        fileBeritaAcaraName = editFiles.fileBeritaAcara.name;
      }
      if (editFiles.fileInvoice) {
        fileInvoice = await uploadFile(editFiles.fileInvoice, "invoice");
        fileInvoiceName = editFiles.fileInvoice.name;
      }

      await updateDoc(doc(db, "proformaInvoice", selectedItem.id), {
        tanggal: editForm.tanggal,
        nomorPI: editForm.nomorPI.trim(),
        namaCustomer: editForm.namaCustomer.trim(),
        namaProduk: editForm.namaProduk,
        fot: editForm.fot.trim(),
        kuantitasKG: parseFloat(editForm.kuantitasKG),
        barangDiambil: parseFloat(editForm.barangDiambil),
        sisaBarang: parseFloat(editForm.sisaBarang),
        kodeBeritaAcara: editForm.kodeBeritaAcara.trim(),
        fileBeritaAcara,
        fileBeritaAcaraName,
        kodeInvoice: editForm.kodeInvoice.trim(),
        fileInvoice,
        fileInvoiceName,
        keterangan: editForm.keterangan.trim(),
        updatedAt: serverTimestamp(),
      });

      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
      "Nama Produk": item.namaProduk,
      "FOT": item.fot,
      "Kuantitas (KG)": item.kuantitasKG,
      "Barang Diambil": item.barangDiambil,
      "Sisa Barang": item.sisaBarang,
      "Kode Berita Acara": item.kodeBeritaAcara,
      "Kode Invoice": item.kodeInvoice,
      "Keterangan": item.keterangan,
      "Dibuat Oleh": item.createdBy,
      "Tanggal Dibuat": item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "-",
    }));

    exportToExcel(exportData, `Rekap_Proforma_Invoice_${new Date().toISOString().split("T")[0]}`, "Rekap PI");
  };

  const handleFileChange = (e: any, field: "fileBeritaAcara" | "fileInvoice") => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "application/pdf") {
      alert("File harus berformat PDF");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }
    setEditFiles((prev) => ({ ...prev, [field]: file }));
  };

  const stockOptions = stockList.map((stock) => ({
    value: stock.namaBarang,
    label: `${stock.namaBarang} (${stock.kodeBarang})`,
  }));

  const columns = [
    {
      key: "tanggal",
      header: "Tanggal",
      width: "120px",
      render: (row: ProformaInvoice) => (
        <span className="font-medium text-gray-800">{row.tanggal}</span>
      ),
    },
    {
      key: "nomorPI",
      header: "Nomor PI",
      width: "150px",
      render: (row: ProformaInvoice) => (
        <span className="font-semibold text-green-700">{row.nomorPI}</span>
      ),
    },
    {
      key: "namaCustomer",
      header: "Customer",
      render: (row: ProformaInvoice) => row.namaCustomer,
    },
    {
      key: "namaProduk",
      header: "Produk",
      render: (row: ProformaInvoice) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
          {row.namaProduk}
        </span>
      ),
    },
    {
      key: "kuantitasKG",
      header: "Kuantitas",
      width: "130px",
      render: (row: ProformaInvoice) => (
        <span className="font-mono font-medium">{row.kuantitasKG.toLocaleString()} KG</span>
      ),
    },
    {
      key: "barangDiambil",
      header: "Diambil",
      width: "120px",
      render: (row: ProformaInvoice) => (
        <span className="font-mono">{row.barangDiambil.toLocaleString()} KG</span>
      ),
    },
    {
      key: "sisaBarang",
      header: "Sisa",
      width: "120px",
      render: (row: ProformaInvoice) => (
        <span className={`font-mono font-medium ${row.sisaBarang < 100 ? "text-red-600" : "text-green-600"}`}>
          {row.sisaBarang.toLocaleString()} KG
        </span>
      ),
    },
    {
      key: "dokumen",
      header: "Dokumen",
      width: "100px",
      render: (row: ProformaInvoice) => (
        <div className="flex gap-2">
          {row.fileBeritaAcara && (
            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg" title="Berita Acara">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          )}
          {row.fileInvoice && (
            <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg" title="Invoice">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      width: "180px",
      render: (row: ProformaInvoice) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDetail(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Detail"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
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
      <Header
        title="Rekap Proforma Invoice"
        subtitle="Kelola dan lihat riwayat proforma invoice"
      />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nomor PI, customer, atau produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
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

        <Table
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage="Belum ada data proforma invoice"
          keyExtractor={(row) => row.id}
          onRowClick={handleDetail}
        />
      </Card>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Proforma Invoice"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </Button>
          </div>
        }
      >
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
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Produk</p>
                <p className="font-semibold text-gray-800">{selectedItem.namaProduk}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 uppercase tracking-wide">Kuantitas</p>
                <p className="text-xl font-bold text-green-700">{selectedItem.kuantitasKG.toLocaleString()} KG</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-600 uppercase tracking-wide">Diambil</p>
                <p className="text-xl font-bold text-amber-700">{selectedItem.barangDiambil.toLocaleString()} KG</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 uppercase tracking-wide">Sisa</p>
                <p className="text-xl font-bold text-blue-700">{selectedItem.sisaBarang.toLocaleString()} KG</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Dokumen</p>
              <div className="flex gap-4">
                {selectedItem.fileBeritaAcara && (
                  <a
                    href={selectedItem.fileBeritaAcara}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Berita Acara
                  </a>
                )}
                {selectedItem.fileInvoice && (
                  <a
                    href={selectedItem.fileInvoice}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Invoice
                  </a>
                )}
              </div>
            </div>

            {selectedItem.keterangan && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Keterangan</p>
                <p className="text-gray-700">{selectedItem.keterangan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Proforma Invoice"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleUpdate} isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal"
              type="date"
              value={editForm.tanggal}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tanggal: e.target.value }))}
              required
            />
            <Input
              label="Nomor PI"
              type="text"
              value={editForm.nomorPI}
              onChange={(e) => setEditForm((prev) => ({ ...prev, nomorPI: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Customer"
              type="text"
              value={editForm.namaCustomer}
              onChange={(e) => setEditForm((prev) => ({ ...prev, namaCustomer: e.target.value }))}
              required
            />
            <Select
              label="Nama Produk"
              value={editForm.namaProduk}
              onChange={(e) => setEditForm((prev) => ({ ...prev, namaProduk: e.target.value }))}
              options={stockOptions}
              required
            />
          </div>

          <Input
            label="FOT"
            type="text"
            value={editForm.fot}
            onChange={(e) => setEditForm((prev) => ({ ...prev, fot: e.target.value }))}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Kuantitas (KG)"
              type="number"
              value={editForm.kuantitasKG}
              onChange={(e) => setEditForm((prev) => ({ ...prev, kuantitasKG: e.target.value }))}
              required
            />
            <Input
              label="Barang Diambil"
              type="number"
              value={editForm.barangDiambil}
              onChange={(e) => setEditForm((prev) => ({ ...prev, barangDiambil: e.target.value }))}
              required
            />
            <Input
              label="Sisa Barang"
              type="number"
              value={editForm.sisaBarang}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Kode Berita Acara"
                type="text"
                value={editForm.kodeBeritaAcara}
                onChange={(e) => setEditForm((prev) => ({ ...prev, kodeBeritaAcara: e.target.value }))}
                required
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ganti File Berita Acara (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "fileBeritaAcara")}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {selectedItem?.fileBeritaAcara && !editFiles.fileBeritaAcara && (
                  <p className="mt-1 text-xs text-green-600">File saat ini tersedia</p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Kode Invoice"
                type="text"
                value={editForm.kodeInvoice}
                onChange={(e) => setEditForm((prev) => ({ ...prev, kodeInvoice: e.target.value }))}
                required
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ganti File Invoice (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "fileInvoice")}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {selectedItem?.fileInvoice && !editFiles.fileInvoice && (
                  <p className="mt-1 text-xs text-amber-600">File saat ini tersedia</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={editForm.keterangan}
              onChange={(e) => setEditForm((prev) => ({ ...prev, keterangan: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}