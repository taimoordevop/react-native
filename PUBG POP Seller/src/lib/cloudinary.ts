/**
 * Cloudinary unsigned upload helper.
 * Cloud Name : dekbhye1
 * Upload Preset: unsigned_uploads  (create in Cloudinary dashboard → Settings → Upload → Upload presets)
 */

const CLOUD_NAME   = 'dekbhye1';
const UPLOAD_PRESET = 'unsigned_uploads';
const BASE_URL     = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Upload a local file URI to Cloudinary using unsigned upload.
 *
 * @param assetUri      - local file URI (file:// or content://)
 * @param folder        - Cloudinary folder, e.g. 'proof-videos/orderId'
 * @param resourceType  - 'image' | 'video'
 * @param onProgress    - optional callback with 0–100 progress (uses XMLHttpRequest)
 */
export async function uploadToCloudinary(
  assetUri: string,
  folder: string,
  resourceType: 'image' | 'video',
  onProgress?: (pct: number) => void,
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();

  // Derive filename + mime type from URI
  const filename = assetUri.split('/').pop() ?? `upload_${Date.now()}`;
  const ext = filename.split('.').pop()?.toLowerCase() ?? (resourceType === 'video' ? 'mp4' : 'jpg');
  const mimeType =
    resourceType === 'video'
      ? ext === 'mov' ? 'video/quicktime' : 'video/mp4'
      : ext === 'png' ? 'image/png' : 'image/jpeg';

  // React Native FormData accepts { uri, name, type } objects
  formData.append('file', { uri: assetUri, name: filename, type: mimeType } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  if (resourceType === 'video') {
    // Ask Cloudinary to auto-optimise quality on their end
    formData.append('quality', 'auto');
  }

  const endpoint = `${BASE_URL}/${resourceType}/upload`;

  // Use XMLHttpRequest so we can track upload progress
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          onProgress?.(100);
          resolve(result);
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (err.error?.message) msg = err.error.message;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 5 * 60 * 1000; // 5-minute timeout for large videos

    xhr.send(formData);
  });
}

/**
 * Convenience wrapper — upload a screenshot image.
 * Folder: payment-proofs/{orderId}/{userId}
 */
export async function uploadProofImage(
  orderId: string,
  userId: string,
  localUri: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const result = await uploadToCloudinary(
    localUri,
    `payment-proofs/${orderId}/${userId}`,
    'image',
    onProgress,
  );
  return result.secure_url;
}

/**
 * Convenience wrapper — upload a proof video.
 * Folder: proof-videos/{orderId}/{supplierId}
 */
export async function uploadProofVideo(
  orderId: string,
  supplierId: string,
  localUri: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const result = await uploadToCloudinary(
    localUri,
    `proof-videos/${orderId}/${supplierId}`,
    'video',
    onProgress,
  );
  return result.secure_url;
}
