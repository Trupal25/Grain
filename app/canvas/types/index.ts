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
    size?: number;
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
    width?: number;
    height?: number;
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
    width?: number;
    height?: number;
}

export type TextModel =
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-lite';

export const TEXT_MODELS: { value: TextModel; label: string }[] = [
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
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

/* Note Node */
export interface NoteNodeData extends BaseNodeData {
    id?: string;
    title?: string;
    content?: string;
}

/* Chat Node */
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatNodeData extends BaseNodeData {
    messages: ChatMessage[];
    isProcessing?: boolean;
    model: TextModel;
}

/* Youtube Node */
export interface YoutubeNodeData extends BaseNodeData {
    videoUrl?: string;
    width?: number;
    height?: number;
}
