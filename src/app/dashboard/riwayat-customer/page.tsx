"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import Header from "@/app/components/ui/Header";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import Modal from "@/app/components/ui/Modal";
import Input from "@/app/components/ui/Input";

interface CustomerData {
  id: string;
  namaCustomer: string;
  alamatCustomer: string;
  createdAt: any;
  updatedAt: any;
}

export default function RiwayatCustomerPage() {
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerAddress, setEditCustomerAddress] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, "customers"), orderBy("namaCustomer", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as CustomerData));
      setCustomerList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customerList.filter((c) =>
    c.namaCustomer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.alamatCustomer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerAddress.trim()) return;
    try {
      await addDoc(collection(db, "customers"), {
        namaCustomer: newCustomerName.trim(),
        alamatCustomer: newCustomerAddress.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewCustomerName("");
      setNewCustomerAddress("");
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditCustomer = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setEditCustomerName(customer.namaCustomer);
    setEditCustomerAddress(customer.alamatCustomer);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || !editCustomerName.trim() || !editCustomerAddress.trim()) return;
    try {
      await updateDoc(doc(db, "customers", editingCustomer.id), {
        namaCustomer: editCustomerName.trim(),
        alamatCustomer: editCustomerAddress.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingCustomer(null);
      setEditCustomerName("");
      setEditCustomerAddress("");
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus customer ini?")) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <Header title="Riwayat Customer" subtitle="Kelola daftar customer yang pernah tersimpan" />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau alamat customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Customer
          </Button>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Menampilkan {filteredCustomers.length} dari {customerList.length} customer
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider w-16">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Nama Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Alamat</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-green-800 uppercase tracking-wider w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{customer.namaCustomer}</span>
                        <button
                          onClick={() => handleCopyToClipboard(customer.namaCustomer)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy nama"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 max-w-md truncate">{customer.alamatCustomer}</span>
                        <button
                          onClick={() => handleCopyToClipboard(customer.alamatCustomer)}
                          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          title="Copy alamat"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm text-gray-500">Belum ada data customer</p>
                      <p className="text-xs text-gray-400 mt-1">Customer akan otomatis tersimpan saat membuat Proforma Invoice</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setNewCustomerName(""); setNewCustomerAddress(""); }}
        title="Tambah Customer Baru"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setNewCustomerName(""); setNewCustomerAddress(""); }}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAddCustomer} disabled={!newCustomerName.trim() || !newCustomerAddress.trim()}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Customer"
            type="text"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder="Masukkan nama customer"
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Alamat Customer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
              rows={3}
              placeholder="Masukkan alamat lengkap customer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingCustomer(null); }}
        title="Edit Customer"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingCustomer(null); }}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={!editCustomerName.trim() || !editCustomerAddress.trim()}>
              Simpan Perubahan
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Customer"
            type="text"
            value={editCustomerName}
            onChange={(e) => setEditCustomerName(e.target.value)}
            placeholder="Masukkan nama customer"
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Alamat Customer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={editCustomerAddress}
              onChange={(e) => setEditCustomerAddress(e.target.value)}
              rows={3}
              placeholder="Masukkan alamat lengkap customer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}