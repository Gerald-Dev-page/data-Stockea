// src/utils/imageCompressor.js

/**
 * Redimensiona y comprime una imagen al formato WebP en el navegador
 * @param {File} file - Archivo original subido por el usuario
 * @param {number} maxWidth - Ancho máximo permitido (default 1200px)
 * @param {number} quality - Calidad de compresión WebP entre 0 y 1 (default 0.8)
 * @returns {Promise<Blob>} - Imagen procesada en formato image/webp
 */
export const comprimirAWebP = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionar manteniendo relación de aspecto si excede maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar directamente a WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error en la compresión WebP'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};