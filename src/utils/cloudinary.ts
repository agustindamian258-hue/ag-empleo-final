import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../app/firebase';

export async function subirArchivoCloudinary(file: File): Promise<{ url: string; tipo: 'image' | 'video' }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  const tipo = file.type.startsWith('video') ? 'video' : 'image';
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${tipo}/upload`;

  const res = await fetch(endpoint, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Error subiendo a Cloudinary');
  const data = await res.json();
  return { url: data.secure_url, tipo };
}
