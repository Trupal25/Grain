import { put, del } from '@vercel/blob';

/**
 * Upload a file buffer to Vercel Blob storage
 */
export async function uploadBlob(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    const blob = await put(filename, file, {
        access: 'public',
        contentType,
    });
    return blob.url;
}

/**
 * Delete a blob by URL
 */
export async function deleteBlob(url: string): Promise<void> {
    await del(url);
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
 * Generate a unique filename for blob storage
 */
export function generateBlobFilename(
    userId: string,
    type: 'image' | 'video' | 'audio',
    extension = 'png'
): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}/${type}/${timestamp}-${random}.${extension}`;
}
