/**
 * @fileOverview Daftar kredensial internal untuk Portal Absensi.
 * Hanya menyertakan admin sistem utama. Personel lain dikelola via Firestore.
 */

export const INTERNAL_USERS = [
  { 
    username: "adminsidaurip", 
    email: "admin@sidaurip.id", 
    password: "admin00", 
    role: "admin_absensi", 
    nama: "ADMINISTRATOR ABSENSI" 
  }
];
