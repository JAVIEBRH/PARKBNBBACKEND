/**
 * Obtiene el URI de una imagen
 */
export const getImageUri = (image) => {
  if (typeof image === 'string') return image;
  if (image?.url) return image.url;
  if (image?.uri) return image.uri;
  return null;
};

/**
 * Valida que una imagen tenga tamaño correcto
 */
export const isValidImageSize = (fileSize, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * Obtiene el nombre de archivo de una URI
 */
export const getFileNameFromUri = (uri) => {
  return uri.split('/').pop();
};

/**
 * Crea FormData para upload de imagen
 */
export const createImageFormData = (imageAsset, fieldName = 'photo') => {
  const formData = new FormData();

  formData.append(fieldName, {
    uri: imageAsset.uri,
    type: imageAsset.type || 'image/jpeg',
    name: imageAsset.fileName || `photo-${Date.now()}.jpg`,
  });

  return formData;
};

/**
 * Obtiene dimensiones de imagen
 */
export const getImageDimensions = (uri) => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};

/**
 * Genera placeholder para imagen
 */
export const getPlaceholderImage = (text = 'No Image') => {
  return `https://via.placeholder.com/800x600?text=${encodeURIComponent(text)}`;
};




