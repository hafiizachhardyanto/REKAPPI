"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Header from "@/app/components/ui/Header";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";

interface CustomerData {
  id: string;
  customerId: string;
  namaCustomer: string;
  alamatCustomer: string;
  npwp: string;
  createdAt: any;
}

const CUSTOMER_COUNTER_REF = doc(db, "counters", "customerCounter");

export default function AddCustomerPage() {
  const [namaCustomer, setNamaCustomer] = useState("");
  const [alamatCustomer, setAlamatCustomer] = useState("");
  const [npwp, setNpwp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as CustomerData));
      setCustomerList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getUniqueCustomerId = async (): Promise<string> => {
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(CUSTOMER_COUNTER_REF);
          let lastNum = 0;
          if (counterDoc.exists()) {
            lastNum = counterDoc.data().lastNumber || 0;
          }
          let candidateNum = lastNum + 1;
          let candidateId = `BAGB-CS-${String(candidateNum).padStart(3, "0")}`;
          const idRef = doc(db, "customerIdLocks", candidateId);
          const idDoc = await transaction.get(idRef);
          if (idDoc.exists()) {
            let searchNum = candidateNum + 1;
            let found = false;
            while (searchNum <= candidateNum + 100 && !found) {
              const testId = `BAGB-CS-${String(searchNum).padStart(3, "0")}`;
              const testRef = doc(db, "customerIdLocks", testId);
              const testDoc = await transaction.get(testRef);
              if (!testDoc.exists()) {
                candidateNum = searchNum;
                candidateId = testId;
                found = true;
              }
              searchNum++;
            }
            if (!found) {
              throw new Error("No available customer ID found");
            }
          }
          transaction.set(idRef, { createdAt: serverTimestamp(), used: true });
          transaction.set(CUSTOMER_COUNTER_REF, { lastNumber: candidateNum });
          return candidateId;
        });
        return result;
      } catch (error: any) {
        if (attempt === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    throw new Error("Failed to generate unique customer ID after retries");
  };

  const checkDuplicateName = (name: string): boolean => {
    const normalized = name.trim().toLowerCase();
    return customerList.some((c) => c.namaCustomer.trim().toLowerCase() === normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!namaCustomer.trim()) newErrors.namaCustomer = "Nama customer wajib diisi";
    if (!alamatCustomer.trim()) newErrors.alamatCustomer = "Alamat customer wajib diisi";
    if (checkDuplicateName(namaCustomer)) newErrors.namaCustomer = "Nama customer sudah terdaftar";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    setSuccessMessage("");
    try {
      const customerId = await getUniqueCustomerId();
      await addDoc(collection(db, "customers"), {
        customerId,
        namaCustomer: namaCustomer.trim(),
        alamatCustomer: alamatCustomer.trim(),
        npwp: npwp.trim() || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccessMessage("Customer berhasil ditambahkan dengan ID " + customerId);
      setNamaCustomer("");
      setAlamatCustomer("");
      setNpwp("");
      fetchCustomers();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error(error);
      setErrors({ submit: "Gagal menyimpan customer. ID mungkin sedang digunakan akun lain. Silakan coba lagi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Header title="Tambah Customer" subtitle="Tambah customer baru ke database" />
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
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nama Customer"
            type="text"
            value={namaCustomer}
            onChange={(e) => setNamaCustomer(e.target.value)}
            placeholder="Masukkan nama customer"
            error={errors.namaCustomer}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Alamat Customer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={alamatCustomer}
              onChange={(e) => setAlamatCustomer(e.target.value)}
              rows={3}
              placeholder="Masukkan alamat lengkap customer"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none ${errors.alamatCustomer ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.alamatCustomer && <p className="mt-1 text-sm text-red-600">{errors.alamatCustomer}</p>}
          </div>
          <Input
            label="NPWP (Opsional)"
            type="text"
            value={npwp}
            onChange={(e) => setNpwp(e.target.value)}
            placeholder="Contoh: 123456789012345"
          />
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => { setNamaCustomer(""); setAlamatCustomer(""); setNpwp(""); setErrors({}); }}>
              Reset
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Simpan Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}