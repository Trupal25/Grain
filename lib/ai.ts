import { GoogleGenAI, Modality } from '@google/genai';

// Initialize the client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn('[Grain AI] GEMINI_API_KEY not set - AI features will not work');
}

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Map simple model names to versioned ones for the v1beta API
const MODEL_ALIASES: Record<string, string> = {
    'gemini-1.5-pro': 'gemini-2.5-pro',
    'gemini-1.5-flash': 'gemini-2.0-flash-lite',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gpt-4o': 'gemini-2.0-flash-lite',
    'claude-3-opus': 'gemini-2.5-pro',
};

function getModelName(model: string) {
    return MODEL_ALIASES[model] || model;
}

// Text generation using Gemini
export async function generateText(prompt: string, model = 'gemini-2.0-flash-lite') {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    const response = await ai.models.generateContent({
        model: getModelName(model),
        contents: prompt,
    });

    return response.text ?? '';
}

// Helper to fetch and convert image URL to base64
async function urlToBase64(url: string) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        return {
            inlineData: {
                data: base64,
                mimeType: contentType
            }
        };
    } catch (e) {
        console.error('Failed to convert image to base64:', e);
        return null;
    }
}

// Chat generation using Gemini
export async function generateChat(
    messages: { role: 'user' | 'assistant', content: string }[],
    model = 'gemini-2.0-flash-lite',
    attachments: string[] = [],
    context = ''
) {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    // Prepare content parts
    const history = await Promise.all(messages.map(async (msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const parts: any[] = [{ text: msg.content }];

        // Inject context and attachments into the last user message
        if (isLastMessage && msg.role === 'user') {
            if (context) {
                parts[0].text = `[CONNECTED CONTEXT]\n${context}\n\n[USER INQUIRY]\n${msg.content}`;
            }

            // Process image attachments
            for (const url of attachments) {
                if (url.match(/\.(jpg|jpeg|png|webp|gif)$|^data:image/i)) {
                    const imgPart = await urlToBase64(url);
                    if (imgPart) parts.push(imgPart);
                }
            }
        }

        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts
        };
    }));

    const response = await ai.models.generateContent({
        model: getModelName(model),
        contents: history,
    });

    return response.text ?? '';
}

// Image generation using Gemini with native image output
export async function generateImage(prompt: string, aspectRatio = '1:1') {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    // Use Gemini 2.0 Flash with image generation capability
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: `Generate an image: ${prompt}. Aspect ratio: ${aspectRatio}`,
        config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
    });

    // Extract image from response parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('No response from model');

    for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    throw new Error('No image generated - try a different prompt');
}

// Video generation using Veo
export async function generateVideo(prompt: string, durationSeconds = 4, images: string[] = []) {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    // Prepare image reference if available
    let inputImage: any = undefined;
    if (images.length > 0) {
        // Use the first image as a reference for Veo
        const imgPart = await urlToBase64(images[0]);
        if (imgPart) {
            inputImage = imgPart;
        }
    }

    // Start video generation
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt,
        ...(inputImage && { image: inputImage }),
        config: {
            durationSeconds,
            aspectRatio: '16:9',
        },
    });

    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.get({ operation: operation });
    }

    const video = operation.response?.generatedVideos?.[0];
    if (!video?.video?.uri) {
        throw new Error('No video generated');
    }

    return video.video.uri;
}

// Enhance prompt using Gemini
export async function enhancePrompt(prompt: string, type: 'image' | 'video') {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    const systemPrompt = type === 'image'
        ? 'You are an expert at writing detailed, creative image generation prompts. Enhance the following prompt with vivid details, artistic style, lighting, and composition. Keep it concise (under 200 words). Output only the enhanced prompt, nothing else.'
        : 'You are an expert at writing cinematic video generation prompts. Enhance the following prompt with camera movement, scene description, mood, and pacing. Keep it concise (under 200 words). Output only the enhanced prompt, nothing else.';

    const response = await ai.models.generateContent({
        model: getModelName('gemini-2.0-flash-lite'),
        contents: `${systemPrompt}\n\nOriginal prompt: ${prompt}`,
    });

    return response.text ?? prompt;
}
