import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';

export const uploadImage = async (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `pipsflow/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Image upload failed', 500));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
