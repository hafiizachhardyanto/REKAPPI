"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, where,
  serverTimestamp, getDoc, addDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { exportToExcel } from "@/app/utils/exportExcel";
import {
  ProformaInvoice, SuratMuatInfo, SuratMuatItem, SuratMuatMap,
  StockItem, ExistingSurat, TTDData, EditSuratItem, BeritaAcaraItem, RiwayatPembayaran,
} from "./types";
import { getRomanMonth, formatRupiah, validateNomorSeriFormat, parseInvoiceNumber, getStatusBadge, getPaymentBadge } from "./utils";

export function useRekapPI() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<ProformaInvoice[]>([]);
  const [suratMuatMap, setSuratMuatMap] = useState<SuratMuatMap>({});
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [existingSuratList, setExistingSuratList] = useState<ExistingSurat[]>([]);
  const [ttdList, setTtdList] = useState<TTDData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const [selectedItem, setSelectedItem] = useState<ProformaInvoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSuratModalOpen, setIsEditSuratModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratMuatInfo | null>(null);
  const [nomorSeriError, setNomorSeriError] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSurat, setInvoiceSurat] = useState<SuratMuatInfo | null>(null);
  const [selectedOrderTTD, setSelectedOrderTTD] = useState("");
  const [invoiceNomor, setInvoiceNomor] = useState("");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ jumlahUangDibayar: "", tanggalPembayaran: "", statusPelunasan: "" });
  const [bastExists, setBastExists] = useState(false);
  const [invoiceExists, setInvoiceExists] = useState(false);

  const [editForm, setEditForm] = useState({
    tanggal: "", nomorPI: "", namaCustomer: "", alamatCustomer: "", npwp: "",
    metodePembayaran: "Transfer", uangMuka: "", ongkosKirim: "", keterangan: "",
    produkItems: [] as import("./types").ProdukItem[],
  });

  const [editSuratForm, setEditSuratForm] = useState({
    tanggal: "", nomorSeri: "", nomorPolisi: "", driverUnit: "", nomorSIM: "",
    jenisSurat: "gudangInduk", subJenisDO: "", kepadaNama: "", kepadaPerusahaan: "",
    kepadaAlamat: "", items: [] as EditSuratItem[],
  });

  const fetchData = useCallback(async () => {
    try {
      const q = query(collection(db, "proformaInvoice"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id, tanggal: d.tanggal || "", nomorPI: d.nomorPI || "",
          namaCustomer: d.namaCustomer || "", alamatCustomer: d.alamatCustomer || "",
          npwp: d.npwp || "", metodePembayaran: d.metodePembayaran || "Transfer",
          produkItems: d.produkItems || [], uangMuka: d.uangMuka || 0,
          includePPN: d.includePPN || false, ppnNominal: d.ppnNominal || 0,
          ongkosKirim: d.ongkosKirim || 0, subtotal: d.subtotal || 0,
          jumlahTertagih: d.jumlahTertagih || 0, terbilang: d.terbilang || "",
          tanggalJatuhTempo: d.tanggalJatuhTempo || "", keterangan: d.keterangan || "",
          ttdNama: d.ttdNama || "", ttdJabatan: d.ttdJabatan || "", ttdImage: d.ttdImage || "",
          createdBy: d.createdBy || "", createdAt: d.createdAt?.toDate(),
          updatedAt: d.updatedAt?.toDate(), sisaPengambilanKG: d.sisaPengambilanKG,
          statusPengangkutan: d.statusPengangkutan, invoiceBaseNumber: d.invoiceBaseNumber,
          jumlahUangDibayar: d.jumlahUangDibayar || 0, tanggalPembayaran: d.tanggalPembayaran || "",
          statusPelunasan: d.statusPelunasan || "Belum Lunas", riwayatPembayaran: d.riwayatPembayaran || [],
        } as ProformaInvoice;
      });
      setData(items);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, []);

  const fetchSuratMuat = useCallback(async () => {
    try {
      const q = query(collection(db, "suratPengangkutan"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const map: SuratMuatMap = {};
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const rawPI = d.nomorPI;
        const piList: string[] = [];
        if (Array.isArray(rawPI)) { rawPI.forEach((p) => { if (p && typeof p === "string") piList.push(p); }); }
        else if (rawPI && typeof rawPI === "string") { piList.push(rawPI); }
        const rawCustomer = d.namaCustomer;
        const firstCustomer = Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer;
        const info: SuratMuatInfo = {
          id: docSnap.id, nomorSeri: d.nomorSeri || "", tanggal: d.tanggal || "",
          items: d.items || [], totalKG: d.totalPengambilanKG || 0, nomorPolisi: d.nomorPolisi || "",
          driverUnit: d.driverUnit || "", nomorPI: rawPI || "", nomorSIM: d.nomorSIM || "",
          jenisSurat: d.jenisSurat || "gudangInduk", subJenisDO: d.subJenisDO || null,
          kepadaNama: d.kepadaNama || firstCustomer || "", kepadaPerusahaan: d.kepadaPerusahaan || firstCustomer || "",
          kepadaAlamat: d.kepadaAlamat || "", namaCustomer: rawCustomer || "",
        };
        piList.forEach((pi) => { if (!map[pi]) map[pi] = []; map[pi].push(info); });
      });
      setSuratMuatMap(map);
    } catch (error) { console.error(error); }
  }, []);

  const fetchStockGudang = useCallback(async () => {
    try {
      const q = query(collection(db, "stockGudang"), orderBy("namaBarang", "asc"));
      const snapshot = await getDocs(q);
      setStockList(snapshot.docs.map((docSnap) => ({
        id: docSnap.id, namaBarang: docSnap.data().namaBarang || "", bobotPerUnit: docSnap.data().bobotPerUnit || 50,
        stokAkhirUnit: docSnap.data().stokAkhirUnit || 0, stokAkhirKG: docSnap.data().stokAkhirKG || 0,
        barangKeluarUnit: docSnap.data().barangKeluarUnit || 0, barangKeluarKG: docSnap.data().barangKeluarKG || 0,
      } as StockItem)));
    } catch (error) { console.error(error); }
  }, []);

  const fetchExistingSurat = useCallback(async () => {
    try {
      const q = query(collection(db, "suratPengangkutan"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setExistingSuratList(snapshot.docs.map((docSnap) => ({ id: docSnap.id, nomorSeri: docSnap.data().nomorSeri || "" } as ExistingSurat)));
    } catch (error) { console.error(error); }
  }, []);

  const fetchTTD = useCallback(async () => {
    try {
      const q = query(collection(db, "ttd"), orderBy("nama", "asc"));
      const snapshot = await getDocs(q);
      setTtdList(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as TTDData)));
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => { fetchData(); fetchSuratMuat(); fetchStockGudang(); fetchExistingSurat(); fetchTTD(); }, [fetchData, fetchSuratMuat, fetchStockGudang, fetchExistingSurat, fetchTTD]);

  useEffect(() => {
    if (selectedItem) { checkBastExists(selectedItem.nomorPI); checkInvoiceExists(selectedItem.nomorPI); }
    else { setBastExists(false); setInvoiceExists(false); }
  }, [selectedItem]);

  const checkBastExists = async (nomorPI: string) => {
    try {
      const q1 = query(collection(db, "beritaAcara"), where("nomorPI", "==", nomorPI));
      const snap1 = await getDocs(q1);
      const q2 = query(collection(db, "beritaAcara"), where("nomorPI", "array-contains", nomorPI));
      const snap2 = await getDocs(q2);
      setBastExists(!snap1.empty || !snap2.empty);
    } catch { setBastExists(false); }
  };

  const checkInvoiceExists = async (nomorPI: string) => {
    try {
      const piRow = data.find((d) => d.nomorPI === nomorPI);
      if (piRow && piRow.invoiceBaseNumber) { setInvoiceExists(true); return; }
      const suratQ1 = query(collection(db, "suratPengangkutan"), where("nomorPI", "==", nomorPI));
      const suratSnap1 = await getDocs(suratQ1);
      const suratQ2 = query(collection(db, "suratPengangkutan"), where("nomorPI", "array-contains", nomorPI));
      const suratSnap2 = await getDocs(suratQ2);
      let hasInvoice = false;
      [suratSnap1, suratSnap2].forEach((snap) => { snap.forEach((d) => { if (d.data().nomorInvoice) hasInvoice = true; }); });
      setInvoiceExists(hasInvoice);
    } catch { setInvoiceExists(false); }
  };

  const getStockForProduct = (namaProduk: string) => {
    return stockList.find((s) => s.namaBarang.toUpperCase().includes(namaProduk.toUpperCase()) || namaProduk.toUpperCase().includes(s.namaBarang.toUpperCase()));
  };

  const getSuratMuatForPI = (nomorPI: string): SuratMuatInfo[] => {
    const results: SuratMuatInfo[] = [];
    Object.values(suratMuatMap).forEach((list) => {
      list.forEach((surat) => {
        let match = false;
        if (Array.isArray(surat.nomorPI)) { match = surat.nomorPI.includes(nomorPI); }
        else if (typeof surat.nomorPI === "string") { match = surat.nomorPI === nomorPI; }
        if (match && !results.find((r) => r.id === surat.id)) { results.push(surat); }
      });
    });
    return results;
  };

  const getTotalOrdered = (item: ProformaInvoice) => item.produkItems.reduce((sum, p) => sum + (p.kuantitas || 0), 0);

  const getTotalLoaded = (nomorPI: string) => {
    const suratList = getSuratMuatForPI(nomorPI);
    return suratList.reduce((sum: number, s: SuratMuatInfo) => {
      return sum + (s.items || []).reduce((itemSum: number, it: SuratMuatItem) => {
        const itemPI = it.nomorPI || "";
        if (itemPI && itemPI !== nomorPI) return itemSum;
        return itemSum + ((it.pengambilanZAK || 0) * (it.bobotPerUnit || 50));
      }, 0);
    }, 0);
  };

  const getStatusPengangkutan = (item: ProformaInvoice) => {
    const totalOrdered = getTotalOrdered(item);
    const totalLoaded = getTotalLoaded(item.nomorPI);
    if (totalLoaded >= totalOrdered) return "complete";
    if (totalLoaded > 0) return "partial";
    return item.statusPengangkutan || "pending";
  };

  const getPaymentStatus = (item: ProformaInvoice) => {
    const paid = (item.riwayatPembayaran || []).reduce((sum, r) => sum + (r.jumlah || 0), 0) || item.jumlahUangDibayar || 0;
    const total = item.jumlahTertagih || 0;
    if (paid >= total && total > 0) return "Lunas";
    if (paid > 0) return "Cicilan";
    return "Belum Lunas";
  };

  const getProdukLoadStatus = (item: ProformaInvoice) => {
    const suratList = getSuratMuatForPI(item.nomorPI);
    return item.produkItems.map((prod) => {
      const ordered = prod.kuantitas || 0;
      let loaded = 0;
      suratList.forEach((surat: SuratMuatInfo) => {
        (surat.items || []).forEach((it: SuratMuatItem) => {
          const itemPI = it.nomorPI || "";
          if (itemPI && itemPI !== item.nomorPI) return;
          if (it.jenisPupuk && (it.jenisPupuk.toUpperCase().includes(prod.namaProduk.toUpperCase()) || prod.namaProduk.toUpperCase().includes(it.jenisPupuk.toUpperCase()))) {
            loaded += (it.pengambilanZAK || 0) * (it.bobotPerUnit || 50);
          }
        });
      });
      const remaining = Math.max(0, ordered - loaded);
      let status = "pending";
      if (loaded >= ordered) status = "complete";
      else if (loaded > 0) status = "partial";
      return { namaProduk: prod.namaProduk, ordered, loaded, remaining, status };
    });
  };

  const getNextBastNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const roman = getRomanMonth(now.getMonth() + 1);
    const prefix = `BAGB/BAB/${roman}/${year}`;
    const q = query(collection(db, "beritaAcara"), where("nomorSeri", ">=", prefix), where("nomorSeri", "<=", prefix + "\uf8ff"), orderBy("nomorSeri", "asc"));
    const snapshot = await getDocs(q);
    const numbers: number[] = [];
    snapshot.docs.forEach((d) => {
      const parts = d.data().nomorSeri?.split("/") || [];
      const last = parseInt(parts[parts.length - 1]);
      if (!isNaN(last)) numbers.push(last);
    });
    numbers.sort((a, b) => a - b);
    let nextNum = 1;
    for (const num of numbers) { if (num === nextNum) { nextNum++; } else if (num > nextNum) { break; } }
    return `${prefix}/${String(nextNum).padStart(4, "0")}`;
  };

  const checkNomorSeriExists = (value: string, excludeNomorSeri?: string) => {
    if (!value.trim()) { setNomorSeriError(""); return false; }
    if (!validateNomorSeriFormat(value)) { setNomorSeriError("Format nomor seri tidak valid."); return true; }
    const exists = existingSuratList.some((s) => s.nomorSeri.trim().toUpperCase() === value.trim().toUpperCase() && s.nomorSeri.trim().toUpperCase() !== (excludeNomorSeri || "").trim().toUpperCase());
    if (exists) { setNomorSeriError("Nomor seri sudah ada dalam database. Silakan gunakan nomor seri lain."); return true; }
    setNomorSeriError(""); return false;
  };

  const getNextInvoiceBaseNumber = async (): Promise<string> => {
    const piQuery = query(collection(db, "proformaInvoice"), where("invoiceBaseNumber", "!=", ""));
    const piSnapshot = await getDocs(piQuery);
    const suratQuery = query(collection(db, "suratPengangkutan"), where("nomorInvoice", "!=", ""));
    const suratSnapshot = await getDocs(suratQuery);
    const usedBases: number[] = [];
    piSnapshot.docs.forEach((d) => { const bn = d.data().invoiceBaseNumber; if (bn) usedBases.push(parseInt(bn)); });
    suratSnapshot.docs.forEach((d) => { const ni = d.data().nomorInvoice; if (ni) { const parsed = parseInvoiceNumber(ni); if (parsed) usedBases.push(parsed.baseNum); } });
    usedBases.sort((a, b) => a - b);
    let nextBase = 1;
    for (const num of usedBases) { if (num === nextBase) { nextBase++; } else if (num > nextBase) { break; } }
    return String(nextBase).padStart(4, "0");
  };

  const generateInvoiceNumber = async (surat: SuratMuatInfo): Promise<string> => {
    if (!selectedItem) return "";
    const suratRef = doc(db, "suratPengangkutan", surat.id);
    const suratSnap = await getDoc(suratRef);
    const existingNomor = suratSnap.data()?.nomorInvoice;
    if (existingNomor) { const parsed = parseInvoiceNumber(existingNomor); if (parsed) return existingNomor; }
    const piRef = doc(db, "proformaInvoice", selectedItem.id);
    const piSnap = await getDoc(piRef);
    let baseNumber = piSnap.data()?.invoiceBaseNumber;
    if (!baseNumber) { baseNumber = await getNextInvoiceBaseNumber(); await updateDoc(piRef, { invoiceBaseNumber: baseNumber }); }
    const suratQ1 = query(collection(db, "suratPengangkutan"), where("nomorPI", "==", selectedItem.nomorPI));
    const suratSnap1 = await getDocs(suratQ1);
    const suratQ2 = query(collection(db, "suratPengangkutan"), where("nomorPI", "array-contains", selectedItem.nomorPI));
    const suratSnap2 = await getDocs(suratQ2);
    const usedPartials = new Set<number>();
    [suratSnap1, suratSnap2].forEach((snap) => {
      snap.docs.forEach((d) => {
        const ni = d.data().nomorInvoice;
        if (ni && ni.includes("-S") && ni.endsWith(`-${baseNumber}`)) {
          const match = ni.match(/-S(\d+)-/);
          if (match) usedPartials.add(parseInt(match[1]));
        }
      });
    });
    let nextPartial = 1;
    while (usedPartials.has(nextPartial)) nextPartial++;
    const nomor = `BAGB-INV-S${nextPartial}-${baseNumber}`;
    await updateDoc(suratRef, { nomorInvoice: nomor });
    return nomor;
  };


  const handleOpenFullInvoice = async (row: ProformaInvoice) => {
    setSelectedItem(row); setInvoiceSurat(null); setSelectedOrderTTD(""); setInvoiceNomor(""); setIsInvoiceModalOpen(true); setIsGeneratingInvoice(true);
    try {
      const piRef = doc(db, "proformaInvoice", row.id);
      const piSnap = await getDoc(piRef);
      let baseNumber = piSnap.data()?.invoiceBaseNumber;
      if (!baseNumber) { baseNumber = await getNextInvoiceBaseNumber(); await updateDoc(piRef, { invoiceBaseNumber: baseNumber }); }
      setInvoiceNomor(`BAGB-INV-${baseNumber}`);
    } catch (error) { console.error(error); } finally { setIsGeneratingInvoice(false); }
  };

  const handleOpenInvoice = async (surat: SuratMuatInfo) => {
    setInvoiceSurat(surat); setSelectedOrderTTD(""); setInvoiceNomor(""); setIsInvoiceModalOpen(true); setIsGeneratingInvoice(true);
    try { const nomor = await generateInvoiceNumber(surat); setInvoiceNomor(nomor); } catch (error) { console.error(error); } finally { setIsGeneratingInvoice(false); }
  };

  const handleResetBast = async (nomorPI: string) => {
    if (!confirm("Reset Berita Acara? Nomor seri akan dikembalikan ke pool.")) return;
    try {
      const q1 = query(collection(db, "beritaAcara"), where("nomorPI", "==", nomorPI));
      const snap1 = await getDocs(q1);
      for (const d of snap1.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      const q2 = query(collection(db, "beritaAcara"), where("nomorPI", "array-contains", nomorPI));
      const snap2 = await getDocs(q2);
      for (const d of snap2.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      setBastExists(false); fetchData();
    } catch (error) { console.error(error); }
  };

  const handleResetInvoice = async (nomorPI: string) => {
    if (!confirm("Reset Invoice? Nomor seri akan dikembalikan ke pool.")) return;
    try {
      const piRow = data.find((d) => d.nomorPI === nomorPI);
      if (piRow) { await updateDoc(doc(db, "proformaInvoice", piRow.id), { invoiceBaseNumber: null, updatedAt: serverTimestamp() }); }
      const suratQ1 = query(collection(db, "suratPengangkutan"), where("nomorPI", "==", nomorPI));
      const suratSnap1 = await getDocs(suratQ1);
      for (const d of suratSnap1.docs) { await updateDoc(doc(db, "suratPengangkutan", d.id), { nomorInvoice: null, updatedAt: serverTimestamp() }); }
      const suratQ2 = query(collection(db, "suratPengangkutan"), where("nomorPI", "array-contains", nomorPI));
      const suratSnap2 = await getDocs(suratQ2);
      for (const d of suratSnap2.docs) { await updateDoc(doc(db, "suratPengangkutan", d.id), { nomorInvoice: null, updatedAt: serverTimestamp() }); }
      setInvoiceExists(false); fetchData();
    } catch (error) { console.error(error); }
  };

  const handleDetail = (item: ProformaInvoice) => { setSelectedItem(item); setIsDetailModalOpen(true); };

  const handleEdit = (item: ProformaInvoice) => {
    setSelectedItem(item);
    setEditForm({
      tanggal: item.tanggal, nomorPI: item.nomorPI, namaCustomer: item.namaCustomer,
      alamatCustomer: item.alamatCustomer, npwp: item.npwp || "", metodePembayaran: item.metodePembayaran,
      uangMuka: String(item.uangMuka || ""), ongkosKirim: String(item.ongkosKirim || ""),
      keterangan: item.keterangan || "", produkItems: (item.produkItems || []).map((p) => ({ ...p })),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSurat = (surat: SuratMuatInfo) => {
    setSelectedSurat(surat); setNomorSeriError("");
    setEditSuratForm({
      tanggal: surat.tanggal, nomorSeri: surat.nomorSeri, nomorPolisi: surat.nomorPolisi,
      driverUnit: surat.driverUnit, nomorSIM: surat.nomorSIM || "", jenisSurat: surat.jenisSurat || "gudangInduk",
      subJenisDO: surat.subJenisDO || "", kepadaNama: surat.kepadaNama || "", kepadaPerusahaan: surat.kepadaPerusahaan || "",
      kepadaAlamat: surat.kepadaAlamat || "",
      items: (surat.items || []).map((it) => {
        const pengambilan = it.pengambilanZAK || 0;
        const sisa = parseFloat(it.sisa || "0") || 0;
        return { nomorSubDO: it.nomorSubDO || "", nomorPO: it.nomorPO || "", jenisPupuk: it.jenisPupuk || "", party: it.party || "", pengambilanZAK: String(pengambilan), bobotPerUnit: it.bobotPerUnit || 50, sisa: String(sisa), maxZAK: pengambilan + sisa, fot: it.fot || "" };
      }),
    });
    setIsEditSuratModalOpen(true);
  };

  const handleUpdateFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      let subtotal = 0;
      const updatedProdukItems = editForm.produkItems.map((p) => {
        const qty = p.kuantitas || 0;
        const price = p.hargaSatuan || 0;
        const total = qty * price;
        subtotal += total;
        return { ...p, totalHarga: total };
      });
      const uangMuka = parseFloat(editForm.uangMuka) || 0;
      const ongkosKirim = parseFloat(editForm.ongkosKirim) || 0;
      let ppn = 0;
      if (editForm.produkItems.some((p) => p.includePPN)) {
        ppn = editForm.produkItems.reduce((sum, p) => { if (p.includePPN) return sum + ((p.kuantitas || 0) * (p.hargaSatuan || 0) * 0.11); return sum; }, 0);
      }
      const jumlahTertagih = subtotal - uangMuka + ppn + ongkosKirim;
      await updateDoc(doc(db, "proformaInvoice", selectedItem.id), {
        tanggal: editForm.tanggal, nomorPI: editForm.nomorPI.trim(), namaCustomer: editForm.namaCustomer.trim(),
        alamatCustomer: editForm.alamatCustomer.trim(), npwp: editForm.npwp.trim(), metodePembayaran: editForm.metodePembayaran,
        produkItems: updatedProdukItems, uangMuka: uangMuka, includePPN: editForm.produkItems.some((p) => p.includePPN),
        ppnNominal: ppn, ongkosKirim: ongkosKirim, subtotal: subtotal, jumlahTertagih: jumlahTertagih,
        keterangan: editForm.keterangan.trim(), updatedAt: serverTimestamp(),
      });
      setIsEditModalOpen(false); fetchData();
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };


  const handleUpdateSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurat || !selectedItem) return;
    const newNomorSeri = editSuratForm.nomorSeri.trim();
    if (checkNomorSeriExists(newNomorSeri, selectedSurat.nomorSeri)) { return; }
    setIsSubmitting(true);
    try {
      const oldItems = selectedSurat.items || [];
      const newItems = editSuratForm.items.map((it) => ({
        nomorSubDO: it.nomorSubDO, nomorPO: it.nomorPO, jenisPupuk: it.jenisPupuk, party: it.party,
        pengambilanZAK: parseFloat(it.pengambilanZAK) || 0, bobotPerUnit: it.bobotPerUnit,
        totalKG: (parseFloat(it.pengambilanZAK) || 0) * it.bobotPerUnit, sisa: it.sisa, fot: it.fot || "",
      }));
      const totalPengambilanKG = newItems.reduce((sum, it) => sum + it.totalKG, 0);
      const updateData: any = {
        tanggal: editSuratForm.tanggal, nomorSeri: newNomorSeri, nomorPolisi: editSuratForm.nomorPolisi.trim(),
        driverUnit: editSuratForm.driverUnit.trim(), nomorSIM: editSuratForm.nomorSIM.trim() || null,
        items: newItems, totalPengambilanKG: totalPengambilanKG, updatedAt: serverTimestamp(),
      };
      if (editSuratForm.jenisSurat !== "gudangInduk") {
        updateData.jenisSurat = editSuratForm.jenisSurat; updateData.subJenisDO = editSuratForm.subJenisDO || null;
        updateData.kepadaNama = editSuratForm.kepadaNama.trim(); updateData.kepadaPerusahaan = editSuratForm.kepadaPerusahaan.trim();
        updateData.kepadaAlamat = editSuratForm.kepadaAlamat.trim();
      }
      await updateDoc(doc(db, "suratPengangkutan", selectedSurat.id), updateData);
      const transaksiQuery = query(collection(db, "transaksiBarangKeluar"), where("nomorSeri", "==", selectedSurat.nomorSeri));
      const transaksiSnapshot = await getDocs(transaksiQuery);
      if (!transaksiSnapshot.empty) { await updateDoc(doc(db, "transaksiBarangKeluar", transaksiSnapshot.docs[0].id), { ...updateData, nomorSeri: newNomorSeri }); }
      const oldTotalKG = oldItems.reduce((sum, it) => sum + ((it.pengambilanZAK || 0) * (it.bobotPerUnit || 50)), 0);
      const delta = oldTotalKG - totalPengambilanKG;
      const piNomors = Array.isArray(selectedSurat.nomorPI) ? selectedSurat.nomorPI : [selectedSurat.nomorPI].filter(Boolean);
      for (const piNomor of piNomors) {
        const piRow = data.find((d) => d.nomorPI === piNomor);
        if (!piRow) continue;
        const piRef = doc(db, "proformaInvoice", piRow.id);
        const piSnap = await getDoc(piRef);
        if (piSnap.exists()) {
          const piData = piSnap.data();
          const currentSisa = piData.sisaPengambilanKG !== undefined ? piData.sisaPengambilanKG : 0;
          const newSisa = Math.max(0, currentSisa + delta);
          const totalOrdered = piRow.produkItems.reduce((sum, p) => sum + (p.kuantitas || 0), 0);
          let newStatus = "pending";
          if (newSisa <= 0) newStatus = "complete"; else if (newSisa < totalOrdered) newStatus = "partial";
          await updateDoc(piRef, { sisaPengambilanKG: newSisa, statusPengangkutan: newStatus, updatedAt: serverTimestamp() });
        }
      }
      const isGI = !selectedSurat.jenisSurat || selectedSurat.jenisSurat === "gudangInduk";
      if (isGI) {
        const productMapOld: Record<string, number> = {};
        const productMapNew: Record<string, number> = {};
        oldItems.forEach((it) => { const key = it.jenisPupuk; productMapOld[key] = (productMapOld[key] || 0) + ((it.pengambilanZAK || 0) * (it.bobotPerUnit || 50)); });
        newItems.forEach((it) => { const key = it.jenisPupuk; productMapNew[key] = (productMapNew[key] || 0) + (it.totalKG || 0); });
        const allProducts = new Set([...Object.keys(productMapOld), ...Object.keys(productMapNew)]);
        for (const prod of allProducts) {
          const oldKG = productMapOld[prod] || 0; const newKG = productMapNew[prod] || 0; const deltaKG = oldKG - newKG;
          const stock = getStockForProduct(prod);
          if (stock && deltaKG !== 0) {
            const stockRef = doc(db, "stockGudang", stock.id);
            const stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
              const sData = stockSnap.data();
              const currentUnit = sData.stokAkhirUnit || 0; const currentKG = sData.stokAkhirKG || 0;
              const currentKeluarUnit = sData.barangKeluarUnit || 0; const currentKeluarKG = sData.barangKeluarKG || 0;
              const bobot = stock.bobotPerUnit || 50; const deltaUnit = deltaKG / bobot;
              await updateDoc(stockRef, {
                stokAkhirUnit: Math.max(0, currentUnit + deltaUnit), stokAkhirKG: Math.max(0, currentKG + deltaKG),
                barangKeluarUnit: Math.max(0, currentKeluarUnit - deltaUnit), barangKeluarKG: Math.max(0, currentKeluarKG - deltaKG),
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }
      setIsEditSuratModalOpen(false); fetchData(); fetchSuratMuat(); fetchStockGudang(); fetchExistingSurat();
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleDeleteSurat = async (surat: SuratMuatInfo) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus surat pengangkutan ${surat.nomorSeri}?`)) return;
    try {
      const totalKG = (surat.items || []).reduce((sum, it) => sum + ((it.pengambilanZAK || 0) * (it.bobotPerUnit || 50)), 0);
      const piNomors = Array.isArray(surat.nomorPI) ? surat.nomorPI : [surat.nomorPI].filter(Boolean);
      for (const piNomor of piNomors) {
        const piRow = data.find((d) => d.nomorPI === piNomor);
        if (!piRow) continue;
        const piRef = doc(db, "proformaInvoice", piRow.id);
        const piSnap = await getDoc(piRef);
        if (piSnap.exists()) {
          const piData = piSnap.data();
          const currentSisa = piData.sisaPengambilanKG !== undefined ? piData.sisaPengambilanKG : 0;
          const newSisa = currentSisa + totalKG;
          const totalOrdered = piRow.produkItems.reduce((sum, p) => sum + (p.kuantitas || 0), 0);
          let newStatus = "pending";
          if (newSisa >= totalOrdered) newStatus = "pending"; else if (newSisa > 0) newStatus = "partial"; else newStatus = "complete";
          await updateDoc(piRef, { sisaPengambilanKG: newSisa, statusPengangkutan: newStatus, updatedAt: serverTimestamp() });
        }
      }
      const isGI = !surat.jenisSurat || surat.jenisSurat === "gudangInduk";
      if (isGI) {
        const productMap: Record<string, number> = {};
        (surat.items || []).forEach((it: SuratMuatItem) => { const key = it.jenisPupuk; productMap[key] = (productMap[key] || 0) + ((it.pengambilanZAK || 0) * (it.bobotPerUnit || 50)); });
        for (const prod of Object.keys(productMap)) {
          const kg = productMap[prod]; const stock = getStockForProduct(prod);
          if (stock) {
            const stockRef = doc(db, "stockGudang", stock.id); const stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
              const sData = stockSnap.data();
              const currentUnit = sData.stokAkhirUnit || 0; const currentKG = sData.stokAkhirKG || 0;
              const currentKeluarUnit = sData.barangKeluarUnit || 0; const currentKeluarKG = sData.barangKeluarKG || 0;
              const bobot = stock.bobotPerUnit || 50; const unit = kg / bobot;
              await updateDoc(stockRef, { stokAkhirUnit: currentUnit + unit, stokAkhirKG: currentKG + kg, barangKeluarUnit: Math.max(0, currentKeluarUnit - unit), barangKeluarKG: Math.max(0, currentKeluarKG - kg), updatedAt: serverTimestamp() });
            }
          }
        }
      }
      const transaksiQuery = query(collection(db, "transaksiBarangKeluar"), where("nomorSeri", "==", surat.nomorSeri));
      const transaksiSnapshot = await getDocs(transaksiQuery);
      if (!transaksiSnapshot.empty) { await deleteDoc(doc(db, "transaksiBarangKeluar", transaksiSnapshot.docs[0].id)); }
      await deleteDoc(doc(db, "suratPengangkutan", surat.id));
      fetchData(); fetchSuratMuat(); fetchStockGudang(); fetchExistingSurat();
    } catch (error) { console.error(error); }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini? Semua surat pengangkutan, berita acara, invoice, dan riwayat transaksi terkait juga akan dihapus.")) return;
    setIsLoading(true);
    try {
      const piDoc = data.find((d) => d.id === id);
      if (!piDoc) { setIsLoading(false); return; }
      const nomorPI = piDoc.nomorPI;
      const suratDocsMap = new Map<string, any>();
      const suratQuery1 = query(collection(db, "suratPengangkutan"), where("nomorPI", "==", nomorPI));
      const suratSnap1 = await getDocs(suratQuery1); suratSnap1.docs.forEach((d) => suratDocsMap.set(d.id, d));
      const suratQuery2 = query(collection(db, "suratPengangkutan"), where("nomorPI", "array-contains", nomorPI));
      const suratSnap2 = await getDocs(suratQuery2); suratSnap2.docs.forEach((d) => suratDocsMap.set(d.id, d));
      const deletedSuratSeriSet = new Set<string>();
      for (const [, suratDoc] of suratDocsMap) {
        const suratData = suratDoc.data(); const items = suratData.items || [];
        const isGI = !suratData.jenisSurat || suratData.jenisSurat === "gudangInduk";
        if (isGI) {
          for (const item of items) {
            const stock = getStockForProduct(item.jenisPupuk);
            if (stock) {
              const stockRef = doc(db, "stockGudang", stock.id); const stockSnap = await getDoc(stockRef);
              if (stockSnap.exists()) {
                const sData = stockSnap.data();
                const zak = parseFloat(String(item.pengambilanZAK)) || 0;
                const bobot = item.bobotPerUnit || stock.bobotPerUnit || 50;
                const kg = zak * bobot;
                await updateDoc(stockRef, {
                  stokAkhirUnit: (sData.stokAkhirUnit || 0) + zak, stokAkhirKG: (sData.stokAkhirKG || 0) + kg,
                  barangKeluarUnit: Math.max(0, (sData.barangKeluarUnit || 0) - zak), barangKeluarKG: Math.max(0, (sData.barangKeluarKG || 0) - kg),
                  updatedAt: serverTimestamp(),
                });
              }
            }
          }
        }
        if (suratData.nomorSeri) { deletedSuratSeriSet.add(suratData.nomorSeri); }
      }
      for (const [docId] of suratDocsMap) { await deleteDoc(doc(db, "suratPengangkutan", docId)); }
      const deletedSuratSeri = Array.from(deletedSuratSeriSet);
      if (deletedSuratSeri.length > 0) {
        for (let i = 0; i < deletedSuratSeri.length; i += 10) {
          const batch = deletedSuratSeri.slice(i, i + 10);
          const q = query(collection(db, "transaksiBarangKeluar"), where("nomorSeri", "in", batch));
          const snap = await getDocs(q);
          for (const d of snap.docs) { await deleteDoc(doc(db, "transaksiBarangKeluar", d.id)); }
        }
      }
      const transaksiQuery1 = query(collection(db, "transaksiBarangKeluar"), where("nomorPI", "==", nomorPI));
      const transaksiSnap1 = await getDocs(transaksiQuery1);
      for (const d of transaksiSnap1.docs) { await deleteDoc(doc(db, "transaksiBarangKeluar", d.id)); }
      const transaksiQuery2 = query(collection(db, "transaksiBarangKeluar"), where("nomorPIList", "array-contains", nomorPI));
      const transaksiSnap2 = await getDocs(transaksiQuery2);
      for (const d of transaksiSnap2.docs) { await deleteDoc(doc(db, "transaksiBarangKeluar", d.id)); }
      const baQuery1 = query(collection(db, "beritaAcara"), where("nomorPI", "==", nomorPI));
      const baSnap1 = await getDocs(baQuery1); for (const d of baSnap1.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      const baQuery2 = query(collection(db, "beritaAcara"), where("nomorPI", "array-contains", nomorPI));
      const baSnap2 = await getDocs(baQuery2); for (const d of baSnap2.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      await deleteDoc(doc(db, "proformaInvoice", id));
      await fetchData(); await fetchSuratMuat(); await fetchStockGudang(); await fetchExistingSurat();
    } catch (error) { console.error(error); alert("Gagal menghapus data. Silakan coba lagi."); } finally { setIsLoading(false); }
  };

  const handleGenerateBast = async (item: ProformaInvoice) => {
    try {
      const nomor = await getNextBastNumber();
      const suratList = getSuratMuatForPI(item.nomorPI);
      const bastItems: BeritaAcaraItem[] = []; let no = 1;
      suratList.forEach((surat) => {
        const suratItems = (surat.items || []).filter((it) => { const itemPI = it.nomorPI || ""; return !itemPI || itemPI === item.nomorPI; });
        if (suratItems.length === 0) return;
        const totalZAK = suratItems.reduce((sum, it) => sum + (it.pengambilanZAK || 0), 0);
        const produkNames = suratItems.map((it) => it.jenisPupuk).filter(Boolean).join(", ");
        const fotSet = new Set(suratItems.map((it) => it.fot || "").filter(Boolean));
        const fot = Array.from(fotSet).join(", ");
        bastItems.push({ no: no++, tanggalMuat: surat.tanggal, namaProduk: produkNames, fot: fot, qty: `${totalZAK} ZAK`, noSJ: surat.nomorSeri, driver: surat.driverUnit || "", nopol: surat.nomorPolisi || "" });
      });
      const q1 = query(collection(db, "beritaAcara"), where("nomorPI", "==", item.nomorPI));
      const snap1 = await getDocs(q1); for (const d of snap1.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      const q2 = query(collection(db, "beritaAcara"), where("nomorPI", "array-contains", item.nomorPI));
      const snap2 = await getDocs(q2); for (const d of snap2.docs) { await deleteDoc(doc(db, "beritaAcara", d.id)); }
      await addDoc(collection(db, "beritaAcara"), {
        nomorSeri: nomor, nomorPI: item.nomorPI, namaCustomer: item.namaCustomer,
        tanggal: new Date().toISOString().split("T")[0],
        pihakPertama: { nama: "", jabatan: "", perusahaan: "PT Bukit Agrochemical Baru" },
        pihakKedua: { nama: item.namaCustomer, alamat: item.alamatCustomer },
        items: bastItems, createdAt: serverTimestamp(),
      });
      setBastExists(true);
    } catch (error) { console.error(error); }
  };

  const handleOpenPaymentEdit = (item: ProformaInvoice) => {
    setSelectedItem(item);
    setPaymentForm({ jumlahUangDibayar: "", tanggalPembayaran: new Date().toISOString().split("T")[0], statusPelunasan: item.statusPelunasan || getPaymentStatus(item) });
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const newJumlah = parseFloat(paymentForm.jumlahUangDibayar) || 0;
      const newTanggal = paymentForm.tanggalPembayaran.trim();
      const existingRiwayat = selectedItem.riwayatPembayaran || [];
      const updatedRiwayat = [...existingRiwayat, { tanggal: newTanggal, jumlah: newJumlah }];
      const totalPaid = updatedRiwayat.reduce((sum, r) => sum + r.jumlah, 0);
      const total = selectedItem.jumlahTertagih || 0;
      let status = "Belum Lunas";
      if (totalPaid >= total && total > 0) status = "Lunas"; else if (totalPaid > 0) status = "Cicilan";
      await updateDoc(doc(db, "proformaInvoice", selectedItem.id), { riwayatPembayaran: updatedRiwayat, jumlahUangDibayar: totalPaid, tanggalPembayaran: newTanggal, statusPelunasan: status, updatedAt: serverTimestamp() });
      setIsPaymentModalOpen(false); fetchData();
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleExportExcel = () => {
    const exportData: any[] = [];
    filteredData.forEach((item) => {
      const produkRows = item.produkItems.map((p, idx) => ({
        "No": idx + 1, "Nama Produk": p.namaProduk, "FOT": p.fot || "", "Produsen": p.produsen || "",
        "Kuantitas": p.kuantitas || 0, "Satuan": p.satuan || "", "Harga Satuan": p.hargaSatuan || 0,
        "Harga Per ZAK/DUS": p.hargaPerZakDus || 0, "Total Harga": p.totalHarga || 0,
        "PPN 11%": p.includePPN ? (p.ppnNominal || ((p.kuantitas || 0) * (p.hargaSatuan || 0) * 0.11)) : 0,
      }));
      const suratList = getSuratMuatForPI(item.nomorPI);
      const suratRows = suratList.map((s, idx) => ({ "No Surat": idx + 1, "Nomor Seri": s.nomorSeri, "Tanggal Surat": s.tanggal, "Driver": s.driverUnit, "No Polisi": s.nomorPolisi, "Total KG": s.totalKG }));
      exportData.push({
        "Tanggal PI": item.tanggal, "Nomor PI": item.nomorPI, "Nama Customer": item.namaCustomer, "Alamat": item.alamatCustomer,
        "NPWP": item.npwp || "", "Metode Pembayaran": item.metodePembayaran, "Subtotal": item.subtotal, "Total PPN": item.ppnNominal,
        "Uang Muka": item.uangMuka || 0, "Ongkos Kirim": item.ongkosKirim || 0, "Jumlah Tertagih": item.jumlahTertagih,
        "Terbilang": item.terbilang, "Jatuh Tempo": item.tanggalJatuhTempo, "Keterangan": item.keterangan,
        "Status Pengangkutan": getStatusPengangkutan(item), "Status Pelunasan": item.statusPelunasan || getPaymentStatus(item),
        "Jumlah Dibayar": item.jumlahUangDibayar || 0, "Tanggal Pembayaran": item.tanggalPembayaran || "", "Sisa (KG)": item.sisaPengambilanKG || 0,
        "Dibuat Oleh": item.createdBy, "Produk Count": item.produkItems.length, "Produk Detail": JSON.stringify(produkRows),
        "Surat Muat Count": suratList.length, "Surat Muat Detail": JSON.stringify(suratRows),
      });
    });
    exportToExcel(exportData, `Rekap_Proforma_Invoice_${new Date().toISOString().split("T")[0]}`, "Rekap PI");
  };

  const handleSuratItemChange = (idx: number, field: string, value: string) => {
    setEditSuratForm((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[idx], [field]: value };
      if (field === "pengambilanZAK") {
        const zak = parseFloat(value) || 0; const maxZAK = item.maxZAK || 0;
        if (maxZAK > 0) { if (zak >= maxZAK) { item.pengambilanZAK = String(maxZAK); item.sisa = "0"; } else { item.sisa = String(Math.max(0, maxZAK - zak)); } }
      }
      newItems[idx] = item;
      return { ...prev, items: newItems };
    });
  };

  const addSuratItem = () => { setEditSuratForm((prev) => ({ ...prev, items: [...prev.items, { nomorSubDO: "", nomorPO: "", jenisPupuk: "", party: "", pengambilanZAK: "", bobotPerUnit: 50, sisa: "", maxZAK: 0, fot: "" }] })); };
  const removeSuratItem = (idx: number) => { setEditSuratForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) })); };

  const handleGenerateNomorSeriEdit = () => {
    if (editSuratForm.jenisSurat === "gudangInduk") {
      const current = editSuratForm.nomorSeri; const parts = current.split("/");
      if (parts.length !== 4) return;
      const prefix = `${parts[0]}/${parts[1]}/${parts[2]}`;
      const numbers: number[] = [];
      existingSuratList.forEach((s) => {
        if (s.nomorSeri === selectedSurat?.nomorSeri) return;
        if (s.nomorSeri.startsWith(prefix + "/")) { const p = s.nomorSeri.split("/"); const last = parseInt(p[p.length - 1]); if (!isNaN(last)) numbers.push(last); }
      });
      numbers.sort((a, b) => a - b); let nextUrut = 1;
      for (const num of numbers) { if (num === nextUrut) nextUrut++; else if (num > nextUrut) break; }
      setEditSuratForm((prev) => ({ ...prev, nomorSeri: `${prefix}/${String(nextUrut).padStart(4, "0")}` })); setNomorSeriError("");
    } else {
      const firstItem = editSuratForm.items.find((it) => it.nomorSubDO.trim() !== "");
      const nomorDO = firstItem?.nomorSubDO?.trim() || ""; const sopir = editSuratForm.driverUnit.trim(); const perusahaan = editSuratForm.kepadaPerusahaan.trim();
      if (!nomorDO || !sopir || !perusahaan) return;
      const prefix = `BAGB-SP-DO${nomorDO} ${sopir} - ${perusahaan} - `;
      const existing = existingSuratList.filter((s) => s.nomorSeri.startsWith(prefix) && s.nomorSeri !== selectedSurat?.nomorSeri);
      const numbers = existing.map((s) => { const lastPart = s.nomorSeri.slice(prefix.length); return parseInt(lastPart) || 0; });
      numbers.sort((a, b) => a - b); let nextUrut = 1;
      for (const num of numbers) { if (num === nextUrut) nextUrut++; else if (num > nextUrut) break; }
      setEditSuratForm((prev) => ({ ...prev, nomorSeri: `${prefix}${String(nextUrut).padStart(4, "0")}` })); setNomorSeriError("");
    }
  };

  const handleEditProdukChange = (index: number, field: string, value: string) => { setEditForm((prev) => { const newItems = [...prev.produkItems]; newItems[index] = { ...newItems[index], [field]: value }; return { ...prev, produkItems: newItems }; }); };
  const addEditProdukItem = () => { setEditForm((prev) => ({ ...prev, produkItems: [...prev.produkItems, { namaProduk: "", fot: "", produsen: "", kuantitas: 0, satuan: "KG", hargaSatuan: 0, hargaPerZakDus: 0, bobotPerUnit: 50, jumlahIsiBotol: 1, totalHarga: 0, includePPN: false, ppnNominal: 0 }] })); };
  const removeEditProdukItem = (index: number) => { if (editForm.produkItems.length > 1) { setEditForm((prev) => ({ ...prev, produkItems: prev.produkItems.filter((_, i) => i !== index) })); } };

  const filteredData = data.filter((item) => {
    const matchSearch = item.nomorPI?.toLowerCase().includes(searchTerm.toLowerCase()) || item.namaCustomer?.toLowerCase().includes(searchTerm.toLowerCase());
    const date = new Date(item.tanggal);
    const matchTanggal = filterTanggal ? item.tanggal === filterTanggal : true;
    const matchBulan = filterBulan ? (date.getMonth() + 1).toString().padStart(2, "0") === filterBulan : true;
    const matchTahun = filterTahun ? date.getFullYear().toString() === filterTahun : true;
    return matchSearch && matchTanggal && matchBulan && matchTahun;
  });

  return {
    router, user, data, suratMuatMap, stockList, existingSuratList, ttdList, isLoading,
    searchTerm, setSearchTerm, filterTanggal, setFilterTanggal, filterBulan, setFilterBulan, filterTahun, setFilterTahun,
    selectedItem, setSelectedItem, isDetailModalOpen, setIsDetailModalOpen, isEditModalOpen, setIsEditModalOpen,
    isEditSuratModalOpen, setIsEditSuratModalOpen, isSubmitting, selectedSurat, setSelectedSurat, nomorSeriError, setNomorSeriError,
    isInvoiceModalOpen, setIsInvoiceModalOpen, invoiceSurat, setInvoiceSurat, selectedOrderTTD, setSelectedOrderTTD,
    invoiceNomor, setInvoiceNomor, isGeneratingInvoice, setIsGeneratingInvoice, isPaymentModalOpen, setIsPaymentModalOpen,
    paymentForm, setPaymentForm, bastExists, setBastExists, invoiceExists, setInvoiceExists,
    editForm, setEditForm, editSuratForm, setEditSuratForm,
    fetchData, fetchSuratMuat, fetchStockGudang, fetchExistingSurat, fetchTTD,
    getStockForProduct, getSuratMuatForPI, getTotalOrdered, getTotalLoaded, getStatusPengangkutan, getPaymentStatus, getProdukLoadStatus,
    checkNomorSeriExists, getNextBastNumber, getNextInvoiceBaseNumber, generateInvoiceNumber,
    handleOpenFullInvoice, handleOpenInvoice, handleResetBast, handleResetInvoice,
    handleDetail, handleEdit, handleEditSurat, handleUpdateFull, handleUpdateSurat, handleDeleteSurat, handleDelete,
    handleGenerateBast, handleOpenPaymentEdit, handleUpdatePayment, handleExportExcel,
    handleSuratItemChange, addSuratItem, removeSuratItem, handleGenerateNomorSeriEdit,
    handleEditProdukChange, addEditProdukItem, removeEditProdukItem, filteredData,
  };
}
