import { GoogleGenAI, Modality } from '@google/genai';

// Initialize the client
const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
    console.warn('[Grain AI] GOOGLE_AI_API_KEY not set - AI features will not work');
}

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Text generation using Gemini
export async function generateText(prompt: string, model = 'gemini-2.0-flash') {
    if (!ai) throw new Error('AI client not initialized - set GOOGLE_AI_API_KEY');

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text ?? '';
}

// Image generation using Gemini with native image output
export async function generateImage(prompt: string, aspectRatio = '1:1') {
    if (!ai) throw new Error('AI client not initialized - set GOOGLE_AI_API_KEY');

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
export async function generateVideo(prompt: string, durationSeconds = 4) {
    if (!ai) throw new Error('AI client not initialized - set GOOGLE_AI_API_KEY');

    // Start video generation
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt,
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
    if (!ai) throw new Error('AI client not initialized - set GOOGLE_AI_API_KEY');

    const systemPrompt = type === 'image'
        ? 'You are an expert at writing detailed, creative image generation prompts. Enhance the following prompt with vivid details, artistic style, lighting, and composition. Keep it concise (under 200 words). Output only the enhanced prompt, nothing else.'
        : 'You are an expert at writing cinematic video generation prompts. Enhance the following prompt with camera movement, scene description, mood, and pacing. Keep it concise (under 200 words). Output only the enhanced prompt, nothing else.';

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\nOriginal prompt: ${prompt}`,
    });

    return response.text ?? prompt;
}
