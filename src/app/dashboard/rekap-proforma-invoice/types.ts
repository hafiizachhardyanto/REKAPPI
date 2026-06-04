"use client";

export interface ProdukItem {
  namaProduk: string;
  fot: string;
  produsen: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  hargaPerZakDus: number;
  bobotPerUnit: number;
  jumlahIsiBotol: number;
  totalHarga: number;
  includePPN?: boolean;
  ppnNominal?: number;
}

export interface SuratMuatItem {
  nomorSubDO?: string;
  nomorPO?: string;
  nomorPI?: string;
  jenisPupuk: string;
  party?: string;
  pengambilanZAK: number;
  bobotPerUnit: number;
  totalKG: number;
  sisa?: string;
  fot?: string;
}

export interface SuratMuatInfo {
  id: string;
  nomorSeri: string;
  tanggal: string;
  items: SuratMuatItem[];
  totalKG: number;
  nomorPolisi: string;
  driverUnit: string;
  nomorPI: string | string[];
  nomorSIM?: string;
  jenisSurat?: string;
  subJenisDO?: string;
  kepadaNama?: string;
  kepadaPerusahaan?: string;
  kepadaAlamat?: string;
  namaCustomer?: string | string[];
}

export interface ProformaInvoice {
  id: string;
  tanggal: string;
  nomorPI: string;
  namaCustomer: string;
  alamatCustomer: string;
  npwp: string;
  metodePembayaran: string;
  produkItems: ProdukItem[];
  uangMuka: number;
  includePPN: boolean;
  ppnNominal: number;
  ongkosKirim: number;
  subtotal: number;
  jumlahTertagih: number;
  terbilang: string;
  tanggalJatuhTempo: string;
  keterangan: string;
  ttdNama: string;
  ttdJabatan: string;
  ttdImage: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sisaPengambilanKG?: number;
  statusPengangkutan?: string;
  invoiceBaseNumber?: string;
  jumlahUangDibayar?: number;
  tanggalPembayaran?: string;
  statusPelunasan?: string;
  riwayatPembayaran?: RiwayatPembayaran[];
}

export interface StockItem {
  id: string;
  namaBarang: string;
  bobotPerUnit: number;
  stokAkhirUnit: number;
  stokAkhirKG: number;
  barangKeluarUnit: number;
  barangKeluarKG: number;
}

export interface EditSuratItem {
  nomorSubDO: string;
  nomorPO: string;
  jenisPupuk: string;
  party: string;
  pengambilanZAK: string;
  bobotPerUnit: number;
  sisa: string;
  maxZAK: number;
  fot: string;
}

export interface ExistingSurat {
  id: string;
  nomorSeri: string;
}

export interface TTDData {
  id: string;
  nama: string;
  jabatan: string;
  ttdImage: string;
}

export interface BeritaAcaraItem {
  no: number;
  tanggalMuat: string;
  namaProduk: string;
  fot: string;
  qty: string;
  noSJ: string;
  driver: string;
  nopol: string;
}

export interface RiwayatPembayaran {
  tanggal: string;
  jumlah: number;
}

export type SuratMuatMap = Record<string, SuratMuatInfo[]>;
