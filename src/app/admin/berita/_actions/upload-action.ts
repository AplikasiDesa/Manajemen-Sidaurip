
'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Server Action untuk mengunggah gambar ke Cloudinary.
 * Mengembalikan URL yang sudah dioptimasi (resize, auto quality, auto format).
 */
export async function uploadNewsImage(base64Data: string) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: 'sidaurip_news',
    });

    // Terapkan optimasi pada URL secara otomatis sesuai permintaan user
    // w_800 -> lebar maksimal 800px
    // q_auto -> kompresi otomatis terbaik
    // f_auto -> format otomatis (webp/avif tergantung browser)
    const originalUrl = uploadResponse.secure_url;
    const optimizedUrl = originalUrl.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    
    return optimizedUrl;
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Gagal mengunggah gambar ke server penyimpanan.');
  }
}
