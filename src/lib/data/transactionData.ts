export interface TransactionData {
  faktur: string;
  kategori: string;
  layanan: string;
  tanggal: string;
  status: "Sukses" | "Kadaluarsa" | "Belum Dibayar";
}

export const transactions: TransactionData[] = [
  {
    faktur: "ORDER*****M2M",
    kategori: "Roblox Via Login",
    layanan: "660 Robux",
    tanggal: "2025-12-08 17:27:18",
    status: "Belum Dibayar",
  },
  {
    faktur: "ORDER*****H9K",
    kategori: "Free Fire",
    layanan: "Free Fire 400 Diamond",
    tanggal: "2025-12-08 17:24:46",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****QNN",
    kategori: "Roblox Via Login",
    layanan: "500 Robux",
    tanggal: "2025-12-08 17:19:08",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****PSN",
    kategori: "Magic Chess Go Go",
    layanan: "Magic Chess Go Go Weekly Card",
    tanggal: "2025-12-08 17:09:47",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****OUN",
    kategori: "Free Fire",
    layanan: "Free Fire Membership Bulanan",
    tanggal: "2025-12-08 16:53:51",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****BLG",
    kategori: "Mobile Legends",
    layanan: "MOBILE LEGENDS Weekly Diamond Pass 2x",
    tanggal: "2025-12-08 16:44:41",
    status: "Kadaluarsa",
  },
  {
    faktur: "ORDER*****8BF",
    kategori: "Roblox Via Login",
    layanan: "1000 Robux",
    tanggal: "2025-12-08 16:35:57",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****MHX",
    kategori: "Mobile Legends",
    layanan: "MOBILE LEGEND - 370 Diamond",
    tanggal: "2025-12-08 16:29:58",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****M6Y",
    kategori: "Mobile Legends",
    layanan: "MOBILE LEGENDS Weekly Diamond Pass 2x",
    tanggal: "2025-12-08 16:20:13",
    status: "Sukses",
  },
  {
    faktur: "ORDER*****R1Z",
    kategori: "Roblox Via Login",
    layanan: "320 Robux",
    tanggal: "2025-12-08 16:15:28",
    status: "Sukses",
  },
];
