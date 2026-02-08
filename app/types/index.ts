/* Custom node types for the canvas */

export interface BaseNodeData {
    label?: string;
    [key: string]: unknown;
}

/* Image Node */
export interface ImageNodeData extends BaseNodeData {
    imageUrl?: string;
    prompt?: string;
    model: ImageModel;
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    isGenerating?: boolean;
}

export type ImageModel =
    | 'gemini-imagen'
    | 'midjourney'
    | 'dalle-3'
    | 'stable-diffusion-xl'
    | 'flux-pro'
    | 'ideogram';

export const IMAGE_MODELS: { value: ImageModel; label: string }[] = [
    { value: 'gemini-imagen', label: 'Gemini Imagen' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'dalle-3', label: 'DALL-E 3' },
    { value: 'stable-diffusion-xl', label: 'Stable Diffusion XL' },
    { value: 'flux-pro', label: 'Flux Pro' },
    { value: 'ideogram', label: 'Ideogram' },
];

/* Video Node */
export interface VideoNodeData extends BaseNodeData {
    videoUrl?: string;
    thumbnailUrl?: string;
    prompt?: string;
    model: VideoModel;
    duration: '4s' | '8s' | '16s';
    isGenerating?: boolean;
    isPlaying?: boolean;
}

export type VideoModel =
    | 'gemini-veo'
    | 'runway-gen3'
    | 'pika-labs'
    | 'sora'
    | 'kling'
    | 'luma-dream-machine';

export const VIDEO_MODELS: { value: VideoModel; label: string }[] = [
    { value: 'gemini-veo', label: 'Gemini Veo' },
    { value: 'runway-gen3', label: 'Runway Gen-3' },
    { value: 'pika-labs', label: 'Pika Labs' },
    { value: 'sora', label: 'Sora' },
    { value: 'kling', label: 'Kling AI' },
    { value: 'luma-dream-machine', label: 'Luma Dream Machine' },
];

/* Text Node */
export interface TextNodeData extends BaseNodeData {
    text?: string;
    model: TextModel;
}

export type TextModel =
    | 'gpt-4o'
    | 'claude-3-opus'
    | 'gemini-1.5-pro'
    | 'llama-3-70b';

export const TEXT_MODELS: { value: TextModel; label: string }[] = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'llama-3-70b', label: 'Llama 3 70B' },
];

/* Aspect Ratios */
export const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1 Square' },
    { value: '16:9', label: '16:9 Landscape' },
    { value: '9:16', label: '9:16 Portrait' },
    { value: '4:3', label: '4:3 Standard' },
    { value: '3:4', label: '3:4 Tall' },
] as const;

export const DURATIONS = [
    { value: '4s', label: '4 seconds' },
    { value: '8s', label: '8 seconds' },
    { value: '16s', label: '16 seconds' },
] as const;
