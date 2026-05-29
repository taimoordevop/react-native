/**
 * Cloudinary unsigned upload helper.
 * Cloud Name : dekbhye1
 * Upload Preset: unsigned_uploads  (create in Cloudinary dashboard → Settings → Upload → Upload presets)
 */

const CLOUD_NAME   = 'dekbhye1';
const UPLOAD_PRESET = 'unsigned_uploads';
const API_KEY       = '999456281951553';
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
 * Uses fetch (more reliable in React Native than XMLHttpRequest).
 * Progress callbacks are simulated: 50% on start, 100% on completion.
 *
 * @param assetUri      - local file URI (file:// or content://)
 * @param folder        - Cloudinary folder, e.g. 'proof-videos/orderId'
 * @param resourceType  - 'image' | 'video'
 * @param onProgress    - optional callback with 0–100 progress
 */
export async function uploadToCloudinary(
  assetUri: string,
  folder: string,
  resourceType: 'image' | 'video',
  onProgress?: (pct: number) => void,
): Promise<CloudinaryUploadResult> {
  // Derive filename + mime type from URI
  const filename = assetUri.split('/').pop() ?? `upload_${Date.now()}`;
  const ext = filename.split('.').pop()?.toLowerCase() ?? (resourceType === 'video' ? 'mp4' : 'jpg');
  const mimeType =
    resourceType === 'video'
      ? ext === 'mov' ? 'video/quicktime' : 'video/mp4'
      : ext === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('api_key', API_KEY);
  formData.append('folder', folder);
  if (resourceType === 'video') {
    // Hint Cloudinary to treat as video and apply a conservative transformation
    // (q_auto, mp4, max width 720, crop limit). The exact transformation must be
    // allowed by the unsigned preset in the Cloudinary dashboard.
    formData.append('resource_type', 'video');
    formData.append('transformation', 'q_auto,f_mp4,w_720,c_limit');
  } else {
    formData.append('resource_type', 'image');
  }

  // React Native FormData accepts { uri, name, type } objects
  formData.append('file', {
    uri: assetUri,
    name: filename,
    type: mimeType,
  } as any);

  const endpoint = `${BASE_URL}/${resourceType}/upload`;

  // Initial progress kick-off
  onProgress?.(5);

  console.log('[Cloudinary] Uploading to:', endpoint, 'folder:', folder, 'type:', resourceType, 'file:', filename);

  // Simulate smoother progress while the network request is in flight.
  // fetch in React Native does not expose upload progress events.
  let progressValue = 5;
  const maxDuringUpload = resourceType === 'video' ? 88 : 96;
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    progressTimer = setInterval(() => {
      progressValue = Math.min(progressValue + 2, maxDuringUpload);
      onProgress(progressValue);
      if (progressValue >= maxDuringUpload && progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    }, 800);
  }

  // Longer timeout for large video uploads (8 minutes), shorter for images.
  const timeoutMs = resourceType === 'video' ? 8 * 60 * 1000 : 2 * 60 * 1000;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const controller = new AbortController();
  timeoutHandle = setTimeout(() => {
    console.warn('[Cloudinary] Upload timed out after', timeoutMs, 'ms');
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Do NOT set Content-Type header — fetch sets it with the correct boundary
    });
  } catch (netErr) {
    if ((netErr as Error).name === 'AbortError') {
      console.error('[Cloudinary] Upload aborted due to timeout');
      throw new Error('Upload timed out — try a shorter video or a faster connection.');
    }
    console.error('[Cloudinary] Network error:', netErr);
    throw new Error('Network error — check your internet connection.');
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    if (progressTimer) clearInterval(progressTimer);
  }

  const responseText = await response.text();
  console.log('[Cloudinary] Response status:', response.status, '| body preview:', responseText.slice(0, 200));

  if (response.ok) {
    try {
      const result = JSON.parse(responseText) as CloudinaryUploadResult;
      onProgress?.(100);
      return result;
    } catch {
      console.error('[Cloudinary] Invalid JSON response:', responseText.slice(0, 200));
      throw new Error('Invalid response from Cloudinary');
    }
  }

  // Parse error body
  let msg = `Upload failed (HTTP ${response.status})`;
  try {
    const errBody = JSON.parse(responseText) as { error?: { message?: string } };
    if (errBody.error?.message) msg = errBody.error.message;
  } catch { /* use default msg */ }
  console.error('[Cloudinary] Upload error:', msg, '| body:', responseText.slice(0, 300));
  throw new Error(msg);
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
