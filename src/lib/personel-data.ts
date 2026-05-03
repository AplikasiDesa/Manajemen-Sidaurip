/**
 * @fileOverview Data statis awal untuk inisialisasi database.
 * File ini hanya digunakan untuk migrasi awal ke Firestore.
 */

export const OFFICIALS = [
    { name: "INDRIANI", jabatan: "KASI PEMERINTAHAN", category: "Pemerintah Desa" },
    { name: "KARSIMIN", jabatan: "KAUR KEUANGAN", category: "Pemerintah Desa" },
    { name: "KARSIYAH", jabatan: "STAF KAUR KEUANGAN", category: "Pemerintah Desa" },
    { name: "KODAR", jabatan: "STAF KAUR UMUM PERENCANAAN", category: "Pemerintah Desa" },
    { name: "KUSMINDAR", jabatan: "KEPALA DUSUN", category: "Pemerintah Desa" },
    { name: "MAD SAIKUN", jabatan: "STAF KAUR UMUM PERENCANAAN", category: "Pemerintah Desa" },
    { name: "MANTO SISWOYO", jabatan: "KEPALA DUSUN", category: "Pemerintah Desa" },
    { name: "SARNO", jabatan: "KEPALA DUSUN", category: "Pemerintah Desa" },
    { name: "SOFA BURHANI", jabatan: "SEKRETARIS DESA", category: "Pemerintah Desa" },
    { name: "SUGENG RIYADI", jabatan: "KAUR UMUM PERENCANAAN", category: "Pemerintah Desa" },
    { name: "SUGENG ZAWAWI", jabatan: "KEPALA DUSUN", category: "Pemerintah Desa" },
    { name: "SUHERON", jabatan: "KASI PELAYANAN", category: "Pemerintah Desa" },
    { name: "TASIMIN", jabatan: "KEPALA DESA", category: "Pemerintah Desa" },
    { name: "TEGUH TRIYATNO", jabatan: "KASI KESEJAHTERAAN", category: "Pemerintah Desa" }
];

export const SILTAP_DATA = [
    { name: "TASIMIN", jabatan: "KEPALA DESA", nominal: 3000000 },
    { name: "HERU WAHYONO", jabatan: "SEKRETARIS DESA", nominal: 2500000 },
    { name: "SARKUM SARTONO", jabatan: "KAUR UMUM & PERENCANAAN", nominal: 2200000 },
    { name: "SARYOKO", jabatan: "KAUR KEUANGAN", nominal: 2200000 },
    { name: "WAGINO", jabatan: "KASI PEMERINTAHAN", nominal: 2200000 },
    { name: "SAMSI", jabatan: "KASI PELAYANAN", nominal: 2200000 },
    { name: "TEDY TRISNANTO", jabatan: "KASI KESEJAHTERAAN", nominal: 2200000 },
    { name: "DARSUM DARJO", jabatan: "KEPALA DUSUN SIDAURIP", nominal: 2100000 },
    { name: "KARYO", jabatan: "KEPALA DUSUN MARGASARI", nominal: 2100000 },
];

export const BPD_INSENTIF_DATA = [
    { name: "ANWAR SIDIK", jabatan: "KETUA BPD", nominal: 1000000 },
    { name: "PONIMAN", jabatan: "WAKIL KETUA BPD", nominal: 800000 },
    { name: "SITI MAESAROH", jabatan: "SEKRETARIS BPD", nominal: 700000 },
    { name: "SARYONO", jabatan: "ANGGOTA BPD", nominal: 600000 },
    { name: "SUTRISNO", jabatan: "ANGGOTA BPD", nominal: 600000 },
    { name: "LUKMAN HAKIM", jabatan: "ANGGOTA BPD", nominal: 600000 },
    { name: "TURIMAN", jabatan: "ANGGOTA BPD", nominal: 600000 },
];
