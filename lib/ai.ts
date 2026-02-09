import { GoogleGenAI, Modality } from '@google/genai';

// Initialize the client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn('[Grain AI] GEMINI_API_KEY not set - AI features will not work');
}

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Map simple model names to versioned ones for the v1beta API
const MODEL_ALIASES: Record<string, string> = {
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro-preview-02-04-2025',
    'gemini-2.5-flash': 'gemini-2.5-flash-preview-02-04-2025',
    'gemini-2.5-flash-native-audio': 'gemini-2.5-flash-native-audio-latest',
    'imagen-3': 'imagen-3.0-generate-001',
    'imagen-3-fast': 'imagen-3.0-fast-generate-001',
    'veo-2': 'veo-2.0-generate-001',
    'veo-3': 'veo-3.0-generate-001',
    'veo-3-fast': 'veo-3.0-fast-generate-001',
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
async function urlToData(url: string) {
    try {
        console.log('[AI Lib] Fetching image for base64:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        let contentType = response.headers.get('content-type') || 'image/png';

        // Strip charset or other parameters
        contentType = contentType.split(';')[0].trim();

        console.log('[AI Lib] Fetched image successfully:', { mimeType: contentType, length: base64.length });

        return {
            data: base64,
            mimeType: contentType
        };
    } catch (e) {
        console.error('[AI Lib] urlToData failed:', e);
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
                    const imgData = await urlToData(url);
                    if (imgData) {
                        parts.push({
                            inlineData: {
                                data: imgData.data,
                                mimeType: imgData.mimeType
                            }
                        });
                    }
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
export async function generateImage(prompt: string, aspectRatio = '1:1', model = 'imagen-3') {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    const targetModel = model.startsWith('gemini') ? 'gemini-2.0-flash-exp-image-generation' : getModelName(model);

    // Use Gemini 2.0 Flash or Imagen based on model selection
    if (targetModel.includes('imagen')) {
        // For Imagen 3 models, typically used via Vertex AI, but here we attempt to use the model name
        // directly if supported by the public API, otherwise fall back or warn.
        // For now, we will pass the model name through.
    }

    console.log('[AI Lib] Generating image with model:', targetModel);
    console.log('[AI Lib] Prompt:', prompt);
    const response = await ai.models.generateContent({
        model: targetModel,
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
export async function generateVideo(prompt: string, durationSeconds = 5, images: string[] = [], model = 'veo-2') {
    if (!ai) throw new Error('AI client not initialized - set GEMINI_API_KEY');

    // Prepare image reference if available
    let inputImage: any = undefined;
    if (images.length > 0) {
        const imgData = await urlToData(images[0]);
        if (imgData) {
            // Provide redundant keys to handle potential SDK/backend shim issues
            // The error says "bytesBase64Encoded" is required in the underlying struct
            inputImage = {
                imageBytes: imgData.data,
                bytesBase64Encoded: imgData.data,
                data: imgData.data,
                mimeType: imgData.mimeType
            };
            console.log('[AI Lib] Video input image prepared with redundant keys');
        }
    }

    // Start video generation
    console.log('[AI Lib] Generating video with model:', getModelName(model));
    console.log('[AI Lib] Prompt:', prompt);
    let operation;

    if (inputImage) {
        operation = await ai.models.generateVideos({
            model: getModelName(model),
            prompt,
            image: inputImage,
            config: {
                durationSeconds,
                aspectRatio: '16:9',
            },
        });
    } else {
        operation = await ai.models.generateVideos({
            model: getModelName(model),
            prompt,
            config: {
                durationSeconds,
                aspectRatio: '16:9',
            },
        });
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.get({ operation: operation });
    }

    const video = (operation.response as any)?.generatedVideos?.[0];
    if (!video?.video?.uri) {
        throw new Error('No video generated');
    }

    const uri = video.video.uri;
    console.log('[AI Lib] Video generated at URI:', uri);

    // If it's a Google API URL and we have an API key, append it for fetching
    if (uri.includes('googleapis.com') && apiKey && !uri.includes('key=')) {
        const separator = uri.includes('?') ? '&' : '?';
        return `${uri}${separator}key=${apiKey}`;
    }

    return uri;
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
