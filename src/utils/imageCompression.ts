/**
 * Compress an image file using Canvas API
 * Returns { blob, originalSize, compressedSize }
 */
export const compressImage = (
  file: File,
  maxDimension = 800,
  initialQuality = 0.8
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize to max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // First pass at 0.8 quality
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));

            if (blob.size > 500 * 1024) {
              // Second pass at lower quality
              canvas.toBlob(
                (blob2) => {
                  if (!blob2) return reject(new Error('Compression failed'));
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                  resolve({
                    blob: blob2,
                    originalSize: file.size,
                    compressedSize: blob2.size,
                    dataUrl,
                  });
                },
                'image/jpeg',
                0.6
              );
            } else {
              const dataUrl = canvas.toDataURL('image/jpeg', initialQuality);
              resolve({
                blob,
                originalSize: file.size,
                compressedSize: blob.size,
                dataUrl,
              });
            }
          },
          'image/jpeg',
          initialQuality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Convert base64 data URL to base64 string (no prefix)
 */
export const dataUrlToBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || '';
};
