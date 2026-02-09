import { UTApi } from 'uploadthing/server';

// Initialize UTApi with explicit token check
const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Upload a file buffer to UploadThing
 */
export async function uploadBlob(
    file: Buffer,
    filename: string, // Kept for compatibility, but UploadThing handles naming
    contentType: string // Kept for logic but UT infers type or uses passed `File` object
): Promise<string> {
    if (!process.env.UPLOADTHING_TOKEN) {
        console.error('[UploadThing] Missing UPLOADTHING_TOKEN env var');
        throw new Error('UploadThing token is missing');
    }

    console.log(`[UploadThing] Uploading file: ${filename} (${contentType})`);

    // Convert Buffer to File for UploadThing
    // We create a File object to preserve the filename if possible, although UT generates its own keys usually.
    const fileObj = new File([file as any], filename, { type: contentType });

    const response = await utapi.uploadFiles([fileObj]);

    const [uploadResult] = response;

    if (uploadResult.error) {
        console.error('[UploadThing] Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error.message);
    }

    const { ufsUrl } = uploadResult.data;
    console.log('[UploadThing] Upload successful:', ufsUrl);
    return ufsUrl;
}

/**
 * Delete a file by URL (or key)
 * UploadThing requires the file key, not just the URL.
 * We might need to extract the key from the URL if we only stored the URL.
 * UT URLs are typically https://utfs.io/f/<KEY>
 */
export async function deleteBlob(url: string): Promise<void> {
    const key = url.split('/').pop();
    if (key) {
        await utapi.deleteFiles(key);
    }
}

/**
 * Convert base64 data URI to buffer with extracted mime type
 */
export function base64ToBuffer(base64DataUri: string): {
    buffer: Buffer;
    mimeType: string;
} {
    const [meta, data] = base64DataUri.split(',');
    const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        buffer: Buffer.from(data, 'base64'),
        mimeType,
    };
}

/**
 * Generate a unique filename for storage
 */
export function generateBlobFilename(
    userId: string,
    type: 'image' | 'video' | 'audio',
    extension = 'png'
): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}-${type}-${timestamp}-${random}.${extension}`;
}
