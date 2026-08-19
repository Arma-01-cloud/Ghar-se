/**
 * Client-Side Image Compression Utility for UR GROZY Grocery Orders
 *
 * Compresses camera and gallery photos before uploading to Supabase Storage.
 * Resizes excessively large dimensions, steps down quality iteratively to target 100-300 KB,
 * and maintains high sharpness for handwritten/printed grocery lists.
 */

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25 MB max raw input

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image.' };
  }

  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);

  if (!ALLOWED_MIME_TYPES.has(fileType) && !hasValidExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please choose a JPG, PNG, or WebP photo.'
    };
  }

  if (file.size > MAX_INPUT_BYTES) {
    return {
      valid: false,
      error: 'Image file is too large (max 25 MB). Please choose a smaller photo.'
    };
  }

  return { valid: true };
}

/**
 * Creates an HTMLImageElement from a Blob or File
 */
function loadImageElement(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression. Please select a valid photo.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert Canvas to Blob with specified mimeType and quality
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      quality
    );
  });
}

/**
 * Main Image Compression Function
 *
 * @param {File|Blob} file The raw image file from file input/camera
 * @param {Object} options Optional tuning parameters
 * @returns {Promise<Object>} Compressed image result with blob, preview dataUrl, sizes, etc.
 */
export async function compressGroceryImage(file, options = {}) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    targetMinBytes = 90 * 1024,   // ~90 KB
    targetMaxBytes = 320 * 1024,  // ~320 KB
    preferredMimeType = 'image/webp',
    fallbackMimeType = 'image/jpeg'
  } = options;

  const originalSize = file.size;
  const originalFormatted = formatBytes(originalSize);

  // Load image into DOM Image object to read natural dimensions
  const img = await loadImageElement(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error("We couldn't process this image. Please try another photo.");
  }

  // Calculate target dimensions maintaining aspect ratio
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Create offscreen canvas for resizing
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error("We couldn't process this image. Canvas is not supported on this device.");
  }

  // Fill with clean background (for PNG transparencies if converted to JPEG/WebP)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // High quality bicubic smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Test WebP canvas support
  let chosenFormat = preferredMimeType;
  let testBlob = await canvasToBlob(canvas, preferredMimeType, 0.85);

  // If WebP is not supported by browser canvas, fallback to JPEG
  if (!testBlob || testBlob.type !== preferredMimeType) {
    chosenFormat = fallbackMimeType;
    testBlob = await canvasToBlob(canvas, fallbackMimeType, 0.85);
  }

  let finalBlob = testBlob;
  let currentQuality = 0.85;

  // Step down quality if the compressed size is still larger than targetMaxBytes
  const qualitySteps = [0.80, 0.72, 0.65, 0.58, 0.50];
  for (const q of qualitySteps) {
    if (finalBlob.size <= targetMaxBytes) break;
    const candidateBlob = await canvasToBlob(canvas, chosenFormat, q);
    if (candidateBlob && candidateBlob.size > 0) {
      finalBlob = candidateBlob;
      currentQuality = q;
    }
  }

  // Final fallback check: if somehow compressed is larger than original and original is small, keep original
  if (originalSize <= targetMaxBytes && finalBlob.size > originalSize) {
    finalBlob = file;
    chosenFormat = file.type || preferredMimeType;
  }

  // Generate clean preview Data URL / Object URL
  const dataUrl = canvas.toDataURL(chosenFormat, currentQuality);
  const compressedSize = finalBlob.size;
  const compressedFormatted = formatBytes(compressedSize);
  const extension = chosenFormat === 'image/webp' ? 'webp' : 'jpg';

  // Build File instance for upload
  const cleanFileName = `grocery_list_${Date.now()}.${extension}`;
  const compressedFile = new File([finalBlob], cleanFileName, {
    type: chosenFormat,
    lastModified: Date.now()
  });

  return {
    file: compressedFile,
    blob: finalBlob,
    dataUrl,
    format: chosenFormat,
    extension,
    width: targetWidth,
    height: targetHeight,
    originalSize,
    compressedSize,
    originalFormatted,
    compressedFormatted,
    qualityUsed: currentQuality
  };
}