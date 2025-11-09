import { v2 as cloudinary } from 'cloudinary';
import { createLogger } from '../logger.js';

const logger = createLogger('Cloudinary');

let isConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isConfigured = true;
  logger.info('Cloudinary configurado correctamente');
} else {
  logger.warn('Cloudinary no configurado - usando modo mock');
}

export const uploadImage = async (fileBuffer, folder = 'parkbnb') => {
  if (!isConfigured) {
    logger.info('[MOCK] Upload de imagen simulado');
    return {
      url: `https://via.placeholder.com/800x600?text=Mock+Image`,
      publicId: `mock_${Date.now()}`,
      mode: 'mock',
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          logger.error('Error subiendo imagen:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId) => {
  if (!isConfigured) {
    logger.info('[MOCK] Delete de imagen simulado');
    return { success: true, mode: 'mock' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Error eliminando imagen:', error);
    throw error;
  }
};

export const generateSignedUploadUrl = (folder = 'parkbnb') => {
  if (!isConfigured) {
    return {
      url: 'https://mock-upload-url.com',
      signature: 'mock_signature',
      timestamp: Date.now(),
      mode: 'mock',
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
};

