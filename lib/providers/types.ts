/**
 * Provider Types for Multi-Model AI Routing
 */

export type ProviderType = 'google' | 'openai' | 'replicate' | 'fal';

export interface ImageGenerationOptions {
    prompt: string;
    aspectRatio?: string;
    model?: string;
    negativePrompt?: string;
    seed?: number;
}

export interface ImageGenerationResult {
    url: string;
    base64?: string;
    mimeType: string;
    width?: number;
    height?: number;
}

export interface VideoGenerationOptions {
    prompt: string;
    duration?: number;
    aspectRatio?: string;
    model?: string;
}

export interface VideoGenerationResult {
    url: string;
    duration: number;
    width?: number;
    height?: number;
}

export interface TextGenerationOptions {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

export interface TextGenerationResult {
    text: string;
    tokensUsed?: number;
}

export interface AudioGenerationOptions {
    prompt: string;
    model?: string;
    duration?: number;
    voice?: string;
}

export interface AudioGenerationResult {
    url: string;
    duration: number;
}

/**
 * Provider Interface - All providers must implement these methods
 */
export interface AIProvider {
    name: ProviderType;

    // Feature flags
    supportsImageGeneration: boolean;
    supportsVideoGeneration: boolean;
    supportsTextGeneration: boolean;
    supportsAudioGeneration: boolean;

    // Generation methods
    generateImage?(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
    generateVideo?(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
    generateText?(options: TextGenerationOptions): Promise<TextGenerationResult>;
    generateAudio?(options: AudioGenerationOptions): Promise<AudioGenerationResult>;
}

/**
 * Model configuration for UI selectors
 */
export interface ModelConfig {
    id: string;
    name: string;
    provider: ProviderType;
    type: 'image' | 'video' | 'text' | 'audio';
    description?: string;
    creditCost: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    // Google Models
    { id: 'gemini-imagen', name: 'Gemini Imagen', provider: 'google', type: 'image', creditCost: 5, description: 'Google Gemini image generation' },
    { id: 'gemini-veo', name: 'Gemini Veo', provider: 'google', type: 'video', creditCost: 20, description: 'Google Gemini video generation' },
    { id: 'gemini-flash', name: 'Gemini Flash', provider: 'google', type: 'text', creditCost: 1, description: 'Fast text generation' },

    // OpenAI Models (to be implemented)
    { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', type: 'image', creditCost: 8, description: 'OpenAI DALL-E 3' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'text', creditCost: 2, description: 'OpenAI GPT-4o' },

    // Replicate Models (to be implemented)
    { id: 'flux-pro', name: 'Flux Pro', provider: 'replicate', type: 'image', creditCost: 6, description: 'Black Forest Labs Flux Pro' },
    { id: 'stable-video', name: 'Stable Video', provider: 'replicate', type: 'video', creditCost: 15, description: 'Stability AI video' },

    // Fal.ai Models (to be implemented)
    { id: 'fal-flux', name: 'Fal Flux', provider: 'fal', type: 'image', creditCost: 4, description: 'Fal.ai Flux model' },
];

export function getModelsByType(type: 'image' | 'video' | 'text' | 'audio'): ModelConfig[] {
    return AVAILABLE_MODELS.filter(m => m.type === type);
}

export function getModelById(id: string): ModelConfig | undefined {
    return AVAILABLE_MODELS.find(m => m.id === id);
}
