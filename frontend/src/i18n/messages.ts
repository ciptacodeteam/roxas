// src/utils/messageTransformer.ts (Contoh Lokasi)

/**
 * Mengubah objek pesan menjadi array objek.
 * * @param messages Objek dengan nilai bertipe Record<string, any> (atau tipe yang lebih spesifik).
 * @returns Array dari nilai-nilai objek pesan.
 */
export function transformMessages(messages: Record<string, unknown>): unknown[] {
  const transformed: unknown[] = [];
  
  // Menggunakan Object.values() untuk mendapatkan array dari nilai secara langsung
  // dan menghindari iterasi Object.entries() yang tidak perlu.
  Object.values(messages).forEach((value) => {
    // Karena kita menggunakan tipe unknown[], penugasan ini aman
    transformed.push(value);
  });
  
  return transformed;
}

// 💡 Alternatif yang lebih ringkas dan idiomatis:
/*
export function transformMessages(messages: Record<string, unknown>): unknown[] {
    return Object.values(messages);
}
*/