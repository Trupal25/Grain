/* Custom node types for the canvas */

export interface BaseNodeData {
    label?: string;
    workflowGroupId?: string;
    workflowStatus?: 'idle' | 'queued' | 'running' | 'completed' | 'error';
    [key: string]: unknown;
}

export interface WorkflowGroup {
    id: string;
    name: string;
    color: string;
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
    | 'gemini-3-image'
    | 'gemini-2.0-flash';

export const IMAGE_MODELS: { value: ImageModel; label: string }[] = [
    { value: 'gemini-3-image', label: 'Gemini 3 Pro (Image)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

/* Video Node */
export interface VideoNodeData extends BaseNodeData {
    videoUrl?: string;
    thumbnailUrl?: string;
    prompt?: string;
    model: VideoModel;
    duration: '5s' | '6s' | '8s';
    isGenerating?: boolean;
    isPlaying?: boolean;
    width?: number;
    height?: number;
}

export type VideoModel =
    | 'veo-2'
    | 'veo-3'
    | 'veo-3-fast'
    | 'veo-3.1';

export const VIDEO_MODELS: { value: VideoModel; label: string }[] = [
    { value: 'veo-2', label: 'Veo 2' },
    { value: 'veo-3', label: 'Veo 3' },
    { value: 'veo-3-fast', label: 'Veo 3 Fast' },
    { value: 'veo-3.1', label: 'Veo 3.1 Preview' },
];

/* Text Node */
export interface TextNodeData extends BaseNodeData {
    text?: string;
    model: TextModel;
    width?: number;
    height?: number;
}

export type TextModel =
    | 'gemini-3-pro'
    | 'gemini-3-flash'
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-lite';

export const TEXT_MODELS: { value: TextModel; label: string }[] = [
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro (Preview)' },
    { value: 'gemini-3-flash', label: 'Gemini 3 Flash (Preview)' },
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
    { value: '5s', label: '5 seconds' },
    { value: '6s', label: '6 seconds' },
    { value: '8s', label: '8 seconds' },
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
    attachments?: { url: string; name?: string; type?: string }[];
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
