import type { Announcement, Complaint, LetterSubmission } from './types';

export const letterTypes = [
  'Surat Keterangan Tidak Mampu',
  'Surat Pengantar SKCK',
  'Surat Pengantar Pindah',
  'Surat Keterangan Usaha',
  'Surat Keterangan Lahir',
  'Surat Keterangan Kematian',
  'Surat Keterangan Belum Menikah',
  'Surat Keterangan Domisili',
  'Surat Ijin Keramaian',
  'Surat Keterangan Moyang',
  'Surat Keterangan Pemakaman',
  'Surat Keterangan Wali',
  'Surat Keterangan Reaktivasi BPJS Kesehatan',
  'Surat Keterangan Umum',
  'Surat Pengantar Umum',
];

export const initialComplaints: Complaint[] = [
    {
        id: '1',
        text: 'Jalan di RT 03/RW 02 rusak parah and berlubang. Sangat berbahaya bagi pengendara motor terutama di malam hari. Mohon segera diperbaiki.',
        date: '2024-08-01',
        summary: 'Warga mengeluhkan jalan rusak dan berlubang di RT 03/RW 02 yang membahayakan pengendara, meminta perbaikan segera.',
        sentiment: 'negative',
        keywords: ['jalan rusak', 'berlubang', 'berbahaya', 'perbaikan'],
    },
    {
        id: '2',
        text: 'Saya ingin memberikan masukan agar di area taman desa ditambahkan lebih banyak tempat sampah. Saat ini seringkali sampah berserakan karena kurangnya fasilitas.',
        date: '2024-07-25',
        summary: 'Warga memberikan saran untuk menambah jumlah tempat sampah di area taman desa untuk mengatasi masalah sampah yang berserakan.',
        sentiment: 'neutral',
        keywords: ['tempat sampah', 'taman desa', 'fasilitas', 'kebersihan'],
    }
];

export const initialSubmissions: LetterSubmission[] = [
 
];
