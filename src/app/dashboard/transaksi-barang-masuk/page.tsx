"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/ui/Header";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import { StockGudang } from "@/app/types";

interface StockOption {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  unit: "ZAK" | "DUS" | "KG" | "BOTOL";
  fot: string;
  bobotPerUnit: number;
  botolPerDus?: number;
  stokAkhirUnit?: number;
  stokAkhirKG: number;
}

export default function TransaksiBarangMasukPage() {
  const { user } = useAuth();
  const [stockList, setStockList] = useState<StockOption[]>([]);
  const [fotList, setFotList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    kodeBarang: "",
    namaBarang: "",
    unit: "ZAK" as "ZAK" | "DUS" | "KG" | "BOTOL",
    jumlahZAK: "",
    botolPerDus: "",
    bobotPerBotol: "",
    sopirNopol: "",
    fot: "",
  });

  const [selectedStock, setSelectedStock] = useState<StockOption | null>(null);

  useEffect(() => {
    fetchStockGudang();
  }, []);

  const fetchStockGudang = async () => {
    try {
      const q = query(collection(db, "stockGudang"), orderBy("namaBarang", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        kodeBarang: doc.data().kodeBarang,
        namaBarang: doc.data().namaBarang,
        unit: doc.data().unit,
        fot: doc.data().fot,
        bobotPerUnit: doc.data().bobotPerUnit || 50,
        botolPerDus: doc.data().botolPerDus,
        stokAkhirUnit: doc.data().stokAkhirUnit || 0,
        stokAkhirKG: doc.data().stokAkhirKG || 0,
      } as StockOption));
      setStockList(data);

      const fotSet = new Set<string>();
      data.forEach((item) => {
        if (item.fot && item.fot.trim()) {
          fotSet.add(item.fot.trim().toUpperCase());
        }
      });
      setFotList(Array.from(fotSet).sort());
    } catch (error) {
      console.error(error);
    }
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedStock(null);
      setFormData((prev) => ({
        ...prev,
        kodeBarang: "",
        namaBarang: "",
        unit: "ZAK",
        botolPerDus: "",
        bobotPerBotol: "",
        fot: "",
      }));
      return;
    }

    const stock = stockList.find((s) => s.id === value);
    if (stock) {
      setSelectedStock(stock);
      setFormData((prev) => ({
        ...prev,
        kodeBarang: stock.kodeBarang,
        namaBarang: stock.namaBarang,
        unit: stock.unit,
        fot: stock.fot,
        botolPerDus: stock.botolPerDus ? stock.botolPerDus.toString() : "",
        bobotPerBotol: stock.unit === "BOTOL" ? (stock.bobotPerUnit ? stock.bobotPerUnit.toString() : "") : "",
      }));
    }

    if (errors.kodeBarang) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.kodeBarang;
        return newErrors;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tanggal) newErrors.tanggal = "Tanggal wajib diisi";
    if (!formData.kodeBarang) newErrors.kodeBarang = "Kode barang wajib dipilih";
    if (!formData.namaBarang) newErrors.namaBarang = "Nama barang wajib diisi";
    if (!formData.jumlahZAK || parseFloat(formData.jumlahZAK) <= 0) newErrors.jumlahZAK = "Jumlah ZAK harus lebih dari 0";
    if (!formData.sopirNopol.trim()) newErrors.sopirNopol = "Sopir/Nopol wajib diisi";
    if (!formData.fot.trim()) newErrors.fot = "FOT wajib dipilih";

    if (formData.unit === "BOTOL") {
      if (!formData.botolPerDus || parseFloat(formData.botolPerDus) <= 0) newErrors.botolPerDus = "Botol per DUS tidak valid";
      if (!formData.bobotPerBotol || parseFloat(formData.bobotPerBotol) <= 0) newErrors.bobotPerBotol = "Bobot per botol tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!selectedStock) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const jumlahZAK = parseFloat(formData.jumlahZAK) || 0;
      const botolPerDus = formData.unit === "BOTOL" ? parseFloat(formData.botolPerDus) || 0 : null;
      const bobotPerBotol = formData.unit === "BOTOL" ? parseFloat(formData.bobotPerBotol) || 0 : null;

      let totalKG = 0;
      if (formData.unit === "BOTOL") {
        const dusPerZak = 10;
        const totalBotol = jumlahZAK * dusPerZak * (botolPerDus || 1);
        totalKG = (totalBotol * (bobotPerBotol || 0)) / 1000;
      } else {
        totalKG = jumlahZAK * selectedStock.bobotPerUnit;
      }

      const transaksiData: any = {
        tanggal: formData.tanggal,
        kodeBarang: formData.kodeBarang,
        namaBarang: formData.namaBarang,
        unit: formData.unit,
        jumlahZAK: jumlahZAK,
        sopirNopol: formData.sopirNopol.trim(),
        fot: formData.fot.trim().toUpperCase(),
        createdBy: user?.nama || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (formData.unit === "BOTOL") {
        transaksiData.botolPerDus = botolPerDus;
        transaksiData.bobotPerBotol = bobotPerBotol;
      }

      await addDoc(collection(db, "transaksiBarangMasuk"), transaksiData);

      const stockRef = doc(db, "stockGudang", selectedStock.id);
      const stockSnap = await getDoc(stockRef);
      if (stockSnap.exists()) {
        const currentData = stockSnap.data();
        const currentMasukUnit = currentData.barangMasukUnit || 0;
        const currentMasukKG = currentData.barangMasukKG || 0;
        const currentStokUnit = currentData.stokAkhirUnit || 0;
        const currentStokKG = currentData.stokAkhirKG || 0;

        let addUnit = jumlahZAK;
        let addKG = totalKG;

        if (formData.unit === "KG") {
          addUnit = 0;
          addKG = jumlahZAK;
        }

        await updateDoc(stockRef, {
          barangMasukUnit: currentMasukUnit + addUnit,
          barangMasukKG: currentMasukKG + addKG,
          stokAkhirUnit: currentStokUnit + addUnit,
          stokAkhirKG: currentStokKG + addKG,
          updatedAt: serverTimestamp(),
        });
      }

      setSuccessMessage("Transaksi barang masuk berhasil disimpan dan stok diperbarui!");
      setFormData({
        tanggal: new Date().toISOString().split("T")[0],
        kodeBarang: "",
        namaBarang: "",
        unit: "ZAK",
        jumlahZAK: "",
        botolPerDus: "",
        bobotPerBotol: "",
        sopirNopol: "",
        fot: "",
      });
      setSelectedStock(null);

      fetchStockGudang();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error(error);
      setErrors({ submit: "Gagal menyimpan transaksi. Silakan coba lagi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stockOptions = [
    { value: "", label: "Pilih barang dari stock gudang..." },
    ...stockList.map((stock) => ({
      value: stock.id,
      label: `${stock.namaBarang} (${stock.kodeBarang}) - ${stock.fot} - Stok: ${stock.stokAkhirKG.toLocaleString()} KG`,
    })),
  ];

  const fotOptions = [
    { value: "", label: "Pilih FOT..." },
    ...fotList.map((f) => ({ value: f, label: f })),
  ];

  const isBotol = formData.unit === "BOTOL";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Header
        title="Transaksi Barang Masuk"
        subtitle="Input data barang masuk ke gudang"
      />

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Informasi Transaksi">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tanggal Barang Masuk"
              type="date"
              name="tanggal"
              value={formData.tanggal}
              onChange={handleChange}
              error={errors.tanggal}
              required
            />

            <Select
              label="Pilih Barang dari Stock Gudang"
              name="kodeBarang"
              value={selectedStock?.id || ""}
              onChange={handleStockChange}
              options={stockOptions}
              error={errors.kodeBarang}
              required
            />

            <Input
              label="Kode Barang"
              type="text"
              name="kodeBarangDisplay"
              value={formData.kodeBarang}
              readOnly
              className="bg-gray-50"
            />

            <Input
              label="Nama Barang"
              type="text"
              name="namaBarang"
              value={formData.namaBarang}
              readOnly
              className="bg-gray-50"
            />

            <Input
              label="Unit"
              type="text"
              name="unit"
              value={formData.unit}
              readOnly
              className="bg-gray-50"
            />

            <Select
              label="FOT (Tempat Gudang)"
              name="fot"
              value={formData.fot}
              onChange={handleChange}
              options={fotOptions}
              error={errors.fot}
              required
            />
          </div>
        </Card>

        <Card title="Detail Barang Masuk">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={`Jumlah Barang (${formData.unit === "KG" ? "KG" : "ZAK"})`}
              type="number"
              name="jumlahZAK"
              value={formData.jumlahZAK}
              onChange={handleChange}
              placeholder={`Masukkan jumlah dalam ${formData.unit === "KG" ? "KG" : "ZAK"}`}
              error={errors.jumlahZAK}
              required
            />

            {isBotol && (
              <>
                <Input
                  label="Botol per DUS"
                  type="number"
                  name="botolPerDus"
                  value={formData.botolPerDus}
                  onChange={handleChange}
                  placeholder="Contoh: 20"
                  error={errors.botolPerDus}
                  required
                />

                <Input
                  label="Bobot Per Botol (ml)"
                  type="number"
                  name="bobotPerBotol"
                  value={formData.bobotPerBotol}
                  onChange={handleChange}
                  placeholder="Contoh: 500"
                  error={errors.bobotPerBotol}
                  required
                />
              </>
            )}

            <Input
              label="Sopir / Nopol"
              type="text"
              name="sopirNopol"
              value={formData.sopirNopol}
              onChange={handleChange}
              placeholder="Contoh: Budi / B 1234 ABC"
              error={errors.sopirNopol}
              required
            />
          </div>

          {selectedStock && formData.jumlahZAK && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold mb-2">Preview Perhitungan</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Jumlah Input</p>
                  <p className="text-lg font-bold text-amber-700 font-mono">
                    {parseFloat(formData.jumlahZAK).toLocaleString()} {formData.unit === "KG" ? "KG" : "ZAK"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Konversi ke KG</p>
                  <p className="text-lg font-bold text-green-700 font-mono">
                    {formData.unit === "BOTOL"
                      ? `${((parseFloat(formData.jumlahZAK) || 0) * 10 * (parseFloat(formData.botolPerDus) || 1) * (parseFloat(formData.bobotPerBotol) || 0) / 1000).toLocaleString()} KG`
                      : `${((parseFloat(formData.jumlahZAK) || 0) * selectedStock.bobotPerUnit).toLocaleString()} KG`
                    }
                  </p>
                </div>
              </div>
              {formData.unit === "BOTOL" && (
                <p className="text-xs text-amber-500 mt-2">
                  Perhitungan: {formData.jumlahZAK} ZAK × 10 DUS/ZAK × {formData.botolPerDus || 0} botol/DUS × {formData.bobotPerBotol || 0} ml ÷ 1000 = KG
                </p>
              )}
              {formData.unit !== "BOTOL" && formData.unit !== "KG" && (
                <p className="text-xs text-amber-500 mt-2">
                  Perhitungan: {formData.jumlahZAK} {formData.unit} × {selectedStock.bobotPerUnit} KG/{formData.unit}
                </p>
              )}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                tanggal: new Date().toISOString().split("T")[0],
                kodeBarang: "",
                namaBarang: "",
                unit: "ZAK",
                jumlahZAK: "",
                botolPerDus: "",
                bobotPerBotol: "",
                sopirNopol: "",
                fot: "",
              });
              setSelectedStock(null);
              setErrors({});
            }}
          >
            Reset Form
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
            Simpan Transaksi Masuk
          </Button>
        </div>
      </form>
    </div>
  );
}