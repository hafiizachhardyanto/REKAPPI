"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/ui/Header";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Card from "@/app/components/ui/Card";
import { useRekapPI } from "./useRekapPI";
import { handlePrintPDF, handlePrintSuratPDF, handlePrintBastSimple, handlePrintInvoice } from "./PrintTemplates";
import RekapTable from "./RekapTable";
import DetailModal from "./DetailModal";
import EditPIModal from "./EditPIModal";
import EditSuratModal from "./EditSuratModal";
import InvoiceModal from "./InvoiceModal";
import PaymentModal from "./PaymentModal";

export default function RekapProformaInvoicePage() {
  const router = useRouter();
  const hook = useRekapPI();

  const bulanOptions = [
    { value: "", label: "Semua Bulan" },
    { value: "01", label: "Januari" }, { value: "02", label: "Februari" }, { value: "03", label: "Maret" },
    { value: "04", label: "April" }, { value: "05", label: "Mei" }, { value: "06", label: "Juni" },
    { value: "07", label: "Juli" }, { value: "08", label: "Agustus" }, { value: "09", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ];

  const tahunOptions = [
    { value: "", label: "Semua Tahun" },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = (new Date().getFullYear() - 2 + i).toString();
      return { value: year, label: year };
    }),
  ];

  return (
    <div className="space-y-6">
      <Header title="Rekap Proforma Invoice" subtitle="Kelola dan lihat riwayat proforma invoice beserta status pengangkutan" />
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Cari nomor PI, customer..." value={hook.searchTerm} onChange={(e) => hook.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all transition-all duration-200 focus:scale-[1.02] focus:shadow-lg focus:z-20 focus:relative focus:border-green-500 focus:ring-2 focus:ring-green-200" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={hook.handleExportExcel}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export Excel
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Input label="Filter Tanggal" type="date" value={hook.filterTanggal} onChange={(e) => hook.setFilterTanggal(e.target.value)} />
          <Select label="Filter Bulan" value={hook.filterBulan} onChange={(e) => hook.setFilterBulan(e.target.value)} options={bulanOptions} />
          <Select label="Filter Tahun" value={hook.filterTahun} onChange={(e) => hook.setFilterTahun(e.target.value)} options={tahunOptions} />
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Menampilkan {hook.filteredData.length} dari {hook.data.length} data
          {hook.filterTanggal && ` | Tanggal: ${hook.filterTanggal}`}
          {hook.filterBulan && ` | Bulan: ${bulanOptions.find((b) => b.value === hook.filterBulan)?.label}`}
          {hook.filterTahun && ` | Tahun: ${hook.filterTahun}`}
        </div>
        <RekapTable
          data={hook.filteredData}
          isLoading={hook.isLoading}
          getSuratMuatForPI={hook.getSuratMuatForPI}
          getStatusPengangkutan={hook.getStatusPengangkutan}
          getPaymentStatus={hook.getPaymentStatus}
          getProdukLoadStatus={hook.getProdukLoadStatus}
          handleDetail={hook.handleDetail}
          handleEdit={hook.handleEdit}
          handleDelete={hook.handleDelete}
          handlePrintPDF={handlePrintPDF}
          handleOpenFullInvoice={hook.handleOpenFullInvoice}
          handleOpenPaymentEdit={hook.handleOpenPaymentEdit}
        />
      </Card>
      <DetailModal
        isOpen={hook.isDetailModalOpen}
        onClose={() => hook.setIsDetailModalOpen(false)}
        selectedItem={hook.selectedItem}
        getStatusPengangkutan={hook.getStatusPengangkutan}
        getPaymentStatus={hook.getPaymentStatus}
        getProdukLoadStatus={hook.getProdukLoadStatus}
        getSuratMuatForPI={hook.getSuratMuatForPI}
        bastExists={hook.bastExists}
        handlePrintPDF={handlePrintPDF}
        handleGenerateBast={hook.handleGenerateBast}
        handlePrintBastSimple={handlePrintBastSimple}
        handleResetBast={hook.handleResetBast}
        handleOpenPaymentEdit={hook.handleOpenPaymentEdit}
        handleEditSurat={hook.handleEditSurat}
        handleDeleteSurat={hook.handleDeleteSurat}
        handlePrintSuratPDF={handlePrintSuratPDF}
        handleOpenInvoice={hook.handleOpenInvoice}
        router={router}
      />
      <EditPIModal
        isOpen={hook.isEditModalOpen}
        onClose={() => hook.setIsEditModalOpen(false)}
        selectedItem={hook.selectedItem}
        editForm={hook.editForm}
        setEditForm={hook.setEditForm}
        isSubmitting={hook.isSubmitting}
        handleUpdateFull={hook.handleUpdateFull}
      />
      <EditSuratModal
        isOpen={hook.isEditSuratModalOpen}
        onClose={() => hook.setIsEditSuratModalOpen(false)}
        selectedSurat={hook.selectedSurat}
        editSuratForm={hook.editSuratForm}
        setEditSuratForm={hook.setEditSuratForm}
        nomorSeriError={hook.nomorSeriError}
        isSubmitting={hook.isSubmitting}
        handleUpdateSurat={hook.handleUpdateSurat}
        handleGenerateNomorSeriEdit={hook.handleGenerateNomorSeriEdit}
        handleSuratItemChange={hook.handleSuratItemChange}
        addSuratItem={hook.addSuratItem}
        removeSuratItem={hook.removeSuratItem}
      />
      <InvoiceModal
        isOpen={hook.isInvoiceModalOpen}
        onClose={() => { hook.setIsInvoiceModalOpen(false); hook.setInvoiceSurat(null); }}
        selectedItem={hook.selectedItem}
        invoiceNomor={hook.invoiceNomor}
        isGeneratingInvoice={hook.isGeneratingInvoice}
        selectedOrderTTD={hook.selectedOrderTTD}
        setSelectedOrderTTD={hook.setSelectedOrderTTD}
        ttdList={hook.ttdList}
        invoiceExists={hook.invoiceExists}
        handleResetInvoice={hook.handleResetInvoice}
        handlePrintInvoice={() => handlePrintInvoice(hook.selectedItem, hook.invoiceNomor, hook.invoiceSurat, hook.selectedOrderTTD, hook.ttdList)}
      />
      <PaymentModal
        isOpen={hook.isPaymentModalOpen}
        onClose={() => hook.setIsPaymentModalOpen(false)}
        selectedItem={hook.selectedItem}
        paymentForm={hook.paymentForm}
        setPaymentForm={hook.setPaymentForm}
        isSubmitting={hook.isSubmitting}
        handleUpdatePayment={hook.handleUpdatePayment}
      />
    </div>
  );
}