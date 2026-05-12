"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/ui/Header";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { ProformaInvoice, StockGudang } from "@/app/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPI: 0,
    totalStock: 0,
    recentPI: [] as ProformaInvoice[],
    lowStock: [] as StockGudang[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const piQuery = query(collection(db, "proformaInvoice"), orderBy("createdAt", "desc"), limit(5));
      const piSnapshot = await getDocs(piQuery);
      const piData = piSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProformaInvoice));

      const stockQuery = query(collection(db, "stockGudang"), orderBy("stokAkhirKG", "asc"));
      const stockSnapshot = await getDocs(stockQuery);
      const stockData = stockSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StockGudang));

      const piTotal = (await getDocs(collection(db, "proformaInvoice"))).size;
      const stockTotal = (await getDocs(collection(db, "stockGudang"))).size;

      setStats({
        totalPI: piTotal,
        totalStock: stockTotal,
        recentPI: piData,
        lowStock: stockData.filter((s) => s.stokAkhirKG < 1000).slice(0, 5),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Input Proforma Invoice",
      desc: "Buat proforma invoice baru",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/dashboard/input-proforma-invoice",
      color: "from-green-600 to-green-700",
    },
    {
      title: "Input Stock Gudang",
      desc: "Kelola data stock barang",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      href: "/dashboard/input-stock-gudang",
      color: "from-amber-600 to-amber-700",
    },
    {
      title: "Rekap PI",
      desc: "Lihat riwayat proforma invoice",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/dashboard/rekap-proforma-invoice",
      color: "from-emerald-600 to-emerald-700",
    },
    {
      title: "Laporan Stock",
      desc: "Laporan keseluruhan stock",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/dashboard/laporan-stock-gudang",
      color: "from-teal-600 to-teal-700",
    },
  ];

  return (
    <div className="space-y-8">
      <Header
        title={`Selamat Datang, ${user?.nama}`}
        subtitle="Dashboard Administrasi PT Bukit Agrochemical"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Proforma Invoice</p>
              <p className="text-4xl font-bold mt-2">{stats.totalPI}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-600 to-amber-700 text-white border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Jenis Stock</p>
              <p className="text-4xl font-bold mt-2">{stats.totalStock}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Transaksi Bulan Ini</p>
              <p className="text-4xl font-bold mt-2">{stats.recentPI.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Stock Menipis</p>
              <p className="text-4xl font-bold mt-2">{stats.lowStock.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.title}
              onClick={() => router.push(action.href)}
              className="group cursor-pointer"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-green-700 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Proforma Invoice Terbaru">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : stats.recentPI.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Belum ada data proforma invoice</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPI.map((pi) => (
                <div
                  key={pi.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/rekap-proforma-invoice")}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{pi.nomorPI}</p>
                    <p className="text-sm text-gray-500">{pi.namaCustomer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">{pi.namaProduk}</p>
                    <p className="text-xs text-gray-400">{pi.tanggal}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Stock Menipis (Perhatian)">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : stats.lowStock.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-green-600">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">Semua stock dalam kondisi aman</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lowStock.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{stock.namaBarang}</p>
                    <p className="text-sm text-gray-500">{stock.kodeBarang}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{stock.stokAkhirKG.toLocaleString()} KG</p>
                    <p className="text-xs text-red-400">Sisa stock sangat rendah</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}