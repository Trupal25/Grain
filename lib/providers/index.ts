/**
 * Provider Factory
 * Routes AI requests to the appropriate provider based on model selection
 */

import type {
    AIProvider,
    ProviderType,
    ImageGenerationOptions,
    ImageGenerationResult,
    VideoGenerationOptions,
    VideoGenerationResult,
    TextGenerationOptions,
    TextGenerationResult,
    AudioGenerationOptions,
    AudioGenerationResult,
} from './types';
import { googleProvider } from './google';
import { getModelById } from './types';

// Provider registry
const providers: Record<ProviderType, AIProvider> = {
    google: googleProvider,
    // These will be implemented in later phases
    openai: {
        name: 'openai',
        supportsImageGeneration: true,
        supportsVideoGeneration: false,
        supportsTextGeneration: true,
        supportsAudioGeneration: true,
        async generateImage() {
            throw new Error('OpenAI provider not yet implemented');
        },
        async generateText() {
            throw new Error('OpenAI provider not yet implemented');
        },
    },
    replicate: {
        name: 'replicate',
        supportsImageGeneration: true,
        supportsVideoGeneration: true,
        supportsTextGeneration: false,
        supportsAudioGeneration: true,
        async generateImage() {
            throw new Error('Replicate provider not yet implemented');
        },
        async generateVideo() {
            throw new Error('Replicate provider not yet implemented');
        },
    },
    fal: {
        name: 'fal',
        supportsImageGeneration: true,
        supportsVideoGeneration: true,
        supportsTextGeneration: false,
        supportsAudioGeneration: false,
        async generateImage() {
            throw new Error('Fal.ai provider not yet implemented');
        },
    },
};

/**
 * Get provider by type
 */
export function getProvider(type: ProviderType): AIProvider {
    return providers[type];
}

/**
 * Get provider for a specific model ID
 */
export function getProviderForModel(modelId: string): AIProvider | null {
    const model = getModelById(modelId);
    if (!model) return null;
    return providers[model.provider];
}

/**
 * Generate image using the specified model
 */
export async function generateImageWithModel(
    modelId: string,
    options: Omit<ImageGenerationOptions, 'model'>
): Promise<ImageGenerationResult> {
    const provider = getProviderForModel(modelId);
    if (!provider) {
        throw new Error(`Unknown model: ${modelId}`);
    }
    if (!provider.supportsImageGeneration || !provider.generateImage) {
        throw new Error(`Provider ${provider.name} does not support image generation`);
    }
    return provider.generateImage({ ...options, model: modelId });
}

/**
 * Generate video using the specified model
 */
export async function generateVideoWithModel(
    modelId: string,
    options: Omit<VideoGenerationOptions, 'model'>
): Promise<VideoGenerationResult> {
    const provider = getProviderForModel(modelId);
    if (!provider) {
        throw new Error(`Unknown model: ${modelId}`);
    }
    if (!provider.supportsVideoGeneration || !provider.generateVideo) {
        throw new Error(`Provider ${provider.name} does not support video generation`);
    }
    return provider.generateVideo({ ...options, model: modelId });
}

/**
 * Generate text using the specified model
 */
export async function generateTextWithModel(
    modelId: string,
    options: Omit<TextGenerationOptions, 'model'>
): Promise<TextGenerationResult> {
    const provider = getProviderForModel(modelId);
    if (!provider) {
        throw new Error(`Unknown model: ${modelId}`);
    }
    if (!provider.supportsTextGeneration || !provider.generateText) {
        throw new Error(`Provider ${provider.name} does not support text generation`);
    }
    return provider.generateText({ ...options, model: modelId });
}

/**
 * Generate audio using the specified model
 */
export async function generateAudioWithModel(
    modelId: string,
    options: Omit<AudioGenerationOptions, 'model'>
): Promise<AudioGenerationResult> {
    const provider = getProviderForModel(modelId);
    if (!provider) {
        throw new Error(`Unknown model: ${modelId}`);
    }
    if (!provider.supportsAudioGeneration || !provider.generateAudio) {
        throw new Error(`Provider ${provider.name} does not support audio generation`);
    }
    return provider.generateAudio({ ...options, model: modelId });
}

// Re-export types
export * from './types';
