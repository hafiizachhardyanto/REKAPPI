"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/ui/Header";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";

interface FOTData {
  id: string;
  namaFOT: string;
  alamatFOT: string;
  createdAt: any;
}

export default function FOTPage() {
  const { user } = useAuth();
  const [fotList, setFotList] = useState<FOTData[]>([]);
  const [namaFOT, setNamaFOT] = useState("");
  const [alamatFOT, setAlamatFOT] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFOT();
  }, []);

  const fetchFOT = async () => {
    try {
      const q = query(collection(db, "fot"), orderBy("namaFOT", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        namaFOT: doc.data().namaFOT || "",
        alamatFOT: doc.data().alamatFOT || "",
        createdAt: doc.data().createdAt,
      } as FOTData));
      setFotList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!namaFOT.trim()) newErrors.namaFOT = "Nama FOT wajib diisi";
    if (!alamatFOT.trim()) newErrors.alamatFOT = "Alamat FOT wajib diisi";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "fot"), {
        namaFOT: namaFOT.trim(),
        alamatFOT: alamatFOT.trim(),
        createdBy: user?.nama || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNamaFOT("");
      setAlamatFOT("");
      setErrors({});
      setSuccessMessage("Data FOT berhasil ditambahkan!");
      fetchFOT();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setErrors({ submit: "Gagal menyimpan data FOT" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data FOT ini?")) return;
    try {
      await deleteDoc(doc(db, "fot", id));
      fetchFOT();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Header title="Pengaturan FOT" subtitle="Kelola data FOT dan lokasi gudang" />
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{errors.submit}</span>
        </div>
      )}
      <Card title="Tambah Data FOT">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama FOT / Perusahaan"
              type="text"
              value={namaFOT}
              onChange={(e) => {
                setNamaFOT(e.target.value);
                if (errors.namaFOT) setErrors((prev) => { const n = { ...prev }; delete n.namaFOT; return n; });
              }}
              placeholder="Contoh: PT WILMAR"
              error={errors.namaFOT}
              required
            />
            <Input
              label="Alamat / Lokasi Gudang"
              type="text"
              value={alamatFOT}
              onChange={(e) => {
                setAlamatFOT(e.target.value);
                if (errors.alamatFOT) setErrors((prev) => { const n = { ...prev }; delete n.alamatFOT; return n; });
              }}
              placeholder="Contoh: Desa Sungai Rangit, Pangkalan Lada"
              error={errors.alamatFOT}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Simpan Data FOT
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Daftar FOT">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Nama FOT / Perusahaan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Alamat / Lokasi</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fotList.map((fot, index) => (
                <tr key={fot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{fot.namaFOT}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fot.alamatFOT}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(fot.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {fotList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada data FOT
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}