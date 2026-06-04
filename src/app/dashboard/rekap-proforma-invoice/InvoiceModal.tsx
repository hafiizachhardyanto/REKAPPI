"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import Select from "@/app/components/ui/Select";
import { ProformaInvoice, TTDData } from "./types";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ProformaInvoice | null;
  invoiceNomor: string;
  isGeneratingInvoice: boolean;
  selectedOrderTTD: string;
  setSelectedOrderTTD: (val: string) => void;
  ttdList: TTDData[];
  invoiceExists: boolean;
  handleResetInvoice: (nomorPI: string) => void;
  handlePrintInvoice: () => void;
}

export default function InvoiceModal(props: InvoiceModalProps) {
  const { isOpen, onClose, selectedItem, invoiceNomor, isGeneratingInvoice, selectedOrderTTD, setSelectedOrderTTD, ttdList, invoiceExists, handleResetInvoice, handlePrintInvoice } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Invoice" size="md" footer={
      <div className="flex justify-end gap-3">
        {invoiceExists && (
          <Button variant="danger" onClick={() => { if (selectedItem) handleResetInvoice(selectedItem.nomorPI); onClose(); }}>Reset Invoice</Button>
        )}
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handlePrintInvoice} disabled={!selectedOrderTTD || !invoiceNomor || isGeneratingInvoice}>Print Invoice</Button>
      </div>
    }>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nomor Invoice</p>
          <p className="text-lg font-mono font-bold text-green-700">{invoiceNomor || "Memuat..."}</p>
          {isGeneratingInvoice && <p className="text-sm text-gray-500 mt-1">Menghasilkan nomor invoice...</p>}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700"><span className="font-semibold">Dipesan Oleh:</span> {selectedItem?.namaCustomer || "-"}</p>
        </div>
        <p className="text-sm text-gray-600">Pilih TTD untuk bagian <strong>Diorder Oleh</strong>:</p>
        <Select label="Pilih TTD" value={selectedOrderTTD} onChange={(e) => setSelectedOrderTTD(e.target.value)} options={[{ value: "", label: "Pilih tanda tangan..." }, ...ttdList.map((ttd) => ({ value: ttd.id, label: `${ttd.nama} - ${ttd.jabatan}` }))]} />
        {selectedOrderTTD && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
            {(() => {
              const ttd = ttdList.find((t) => t.id === selectedOrderTTD);
              if (!ttd) return null;
              return (
                <>
                  <img src={ttd.ttdImage} alt="TTD" className="h-16 object-contain bg-white rounded-lg border border-gray-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ttd.nama}</p>
                    <p className="text-xs text-gray-500">{ttd.jabatan}</p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </Modal>
  );
}
