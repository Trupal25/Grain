/**
 * Google AI Provider
 * Wraps existing lib/ai.ts functions
 */

import type {
    AIProvider,
    ImageGenerationOptions,
    ImageGenerationResult,
    VideoGenerationOptions,
    VideoGenerationResult,
    TextGenerationOptions,
    TextGenerationResult,
} from './types';
import { generateImage, generateVideo, generateText } from '@/lib/ai';

export const googleProvider: AIProvider = {
    name: 'google',

    supportsImageGeneration: true,
    supportsVideoGeneration: true,
    supportsTextGeneration: true,
    supportsAudioGeneration: false,

    async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const dataUri = await generateImage(options.prompt, options.aspectRatio);

        // Parse data URI
        const [meta, data] = dataUri.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/png';

        return {
            url: dataUri, // Base64 data URI
            base64: data,
            mimeType,
        };
    },

    async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
        const url = await generateVideo(options.prompt, options.duration);

        return {
            url,
            duration: options.duration || 4,
        };
    },

    async generateText(options: TextGenerationOptions): Promise<TextGenerationResult> {
        const text = await generateText(options.prompt, options.model);

        return {
            text,
        };
    },
};
