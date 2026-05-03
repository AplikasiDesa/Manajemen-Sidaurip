/**
 * @fileOverview Konfigurasi terpusat untuk integrasi layanan Google.
 * Seluruh referensi Spreadsheet telah dihapus untuk mendukung migrasi penuh ke Firestore.
 */

interface GoogleConfig {
  /**
   * URL hasil deploy Google Apps Script yang berfungsi sebagai backend.
   */
  appsScriptUrl: string;

  /**
   * ID Kalender Google yang akan digunakan untuk manajemen agenda.
   */
  calendarId: string;

  /**
   * ID folder "parent" di Google Drive tempat laporan-laporan baru akan disimpan.
   */
  parentFolderId: string;
}

export const GOOGLE_CONFIG: GoogleConfig = {
  // URL Deployment Terbaru yang mendukung fitur fallback Drive
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyd9rylwhzTJLmxTcdMKaPeyHt_jmz1lnLYYjOSZnLCncxJmY9xatp24DQe01tyH3uz4A/exec",
  calendarId: "sidauripmandiri@gmail.com",
  parentFolderId: "1-yZW2Z7V5J2j2aVp9p4aJ3R8Q9J4v8tU",
};
