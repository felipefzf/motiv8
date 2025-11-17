/**
 * Crea un elemento de imagen a partir de una URL (data:URL)
 * @param {string} url - La URL de la imagen
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Necesario para canvas
    image.src = url;
  });

/**
 * Recorta una imagen.
 * @param {string} imageSrc - La URL (data:URL) de la imagen original
 * @param {object} pixelCrop - El objeto con las coordenadas (x, y, width, height) de react-easy-crop
 * @returns {Promise<Blob>} - Un Blob (archivo) de la imagen recortada
 */
export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Devuelve la imagen recortada como un Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = 'newLogo.png'; // (Nombre de archivo genérico)
      resolve(blob);
    }, 'image/png');
  });
}