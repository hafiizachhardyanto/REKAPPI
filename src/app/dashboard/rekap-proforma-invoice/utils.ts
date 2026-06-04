"use client";

export const getRomanMonth = (month: number) => {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[month - 1] || "I";
};

export const parseNomorSeri = (nomorSeri: string) => {
  const parts = nomorSeri.split("/");
  if (parts.length !== 4) return null;
  const prefix = parts[0];
  const year = parseInt(parts[1]);
  const roman = parts[2];
  const urut = parseInt(parts[3]);
  if (prefix !== "BAGB-SP" || isNaN(year) || isNaN(urut)) return null;
  return { prefix, year, roman, urut };
};

export const validateNomorSeriFormat = (value: string) => {
  const giRegex = /^BAGB-SP\/\d{4}\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/;
  const doRegex = /^BAGB-SP-DO.+-\d{4}$/;
  return giRegex.test(value.trim()) || doRegex.test(value.trim());
};

export const parseInvoiceNumber = (nomor: string) => {
  const match = nomor.match(/^BAGB-INV(?:-S(\d+))?-(\d{4})$/);
  if (!match) return null;
  return {
    isPartial: !!match[1],
    partialNum: match[1] ? parseInt(match[1]) : 0,
    baseNum: parseInt(match[2]),
  };
};

export const formatRupiah = (num: number) => {
  if (!num && num !== 0) return "Rp -";
  return "Rp " + num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const numberToWords = (num: number): string => {
  if (num === 0) return "NOL RUPIAH";
  const ones = ["", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "DELAPAN", "SEMBILAN"];
  const teens = ["SEPULUH", "SEBELAS", "DUA BELAS", "TIGA BELAS", "EMPAT BELAS", "LIMA BELAS", "ENAM BELAS", "TUJUH BELAS", "DELAPAN BELAS", "SEMBILAN BELAS"];
  const tens = ["", "", "DUA PULUH", "TIGA PULUH", "EMPAT PULUH", "LIMA PULUH", "ENAM PULUH", "TUJUH PULUH", "DELAPAN PULUH", "SEMBILAN PULUH"];
  const thousands = ["", "RIBU", "JUTA", "MILIAR", "TRILIUN"];
  const convertThreeDigits = (n: number): string => {
    let result = "";
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    if (hundreds > 0) {
      if (hundreds === 1) result += "SERATUS ";
      else result += ones[hundreds] + " RATUS ";
    }
    if (remainder > 0) {
      if (remainder < 10) result += ones[remainder] + " ";
      else if (remainder < 20) result += teens[remainder - 10] + " ";
      else {
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;
        result += tens[ten] + " ";
        if (one > 0) result += ones[one] + " ";
      }
    }
    return result.trim();
  };
  if (num < 0) return "MINUS " + numberToWords(-num);
  let result = "";
  let i = 0;
  let tempNum = num;
  while (tempNum > 0) {
    const chunk = tempNum % 1000;
    if (chunk > 0) {
      let chunkWords = convertThreeDigits(chunk);
      if (i === 1 && chunk === 1) chunkWords = "SERIBU";
      else if (i > 0) chunkWords += " " + thousands[i];
      result = chunkWords + " " + result;
    }
    tempNum = Math.floor(tempNum / 1000);
    i++;
  }
  return result.trim() + " RUPIAH";
};

export const getStatusBadge = (status: string) => {
  if (status === "complete") return { class: "bg-green-100 text-green-700", label: "Selesai Dimuat" };
  if (status === "partial") return { class: "bg-yellow-100 text-yellow-700", label: "Sebagian Dimuat" };
  return { class: "bg-gray-100 text-gray-600", label: "Belum Dimuat" };
};

export const getPaymentBadge = (status: string) => {
  if (status === "Lunas") return { class: "bg-green-100 text-green-700 border-green-200", label: "Lunas" };
  if (status === "Cicilan") return { class: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Cicilan" };
  return { class: "bg-red-100 text-red-700 border-red-200", label: "Belum Lunas" };
};
