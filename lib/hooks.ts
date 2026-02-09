import { useCallback } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';


/**
 * Hook to find all inputs from connected nodes (text, images, videos, etc.)
 */
export function useNodeInputs(nodeId: string) {
    const { getNodes, getEdges } = useReactFlow();

    const getInputs = useCallback(() => {
        const edges = getEdges();
        const nodes = getNodes();

        // Find edges where this node is the target (incoming connections)
        const incomingEdges = edges.filter((e: Edge) => e.target === nodeId);

        // Get source nodes
        const sourceNodeIds = incomingEdges.map((e: Edge) => e.source);
        const sourceNodes = nodes.filter((n: Node) => sourceNodeIds.includes(n.id));

        const texts: string[] = [];
        const images: string[] = [];
        const videos: string[] = [];
        const youtube: string[] = [];

        sourceNodes.forEach((n: Node) => {
            const data = n.data as any;

            // Extract text/prompts
            if (n.type === 'text') {
                if (data.text) {
                    texts.push(data.text);
                } else {
                    console.warn(`[useNodeInputs] Text node ${n.id} has no text content`, data);
                }
            } else if (n.type === 'note' && data.content) {
                texts.push(data.content);
            } else if (n.type === 'chat' && data.messages?.length > 0) {
                // Get the last assistant message as text input if available
                const lastAssistantMsg = [...data.messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistantMsg) texts.push(lastAssistantMsg.content);
            }

            // Extract images
            if (n.type === 'image' && data.imageUrl) {
                images.push(data.imageUrl);
            }

            // Extract videos
            if (n.type === 'video' && data.videoUrl) {
                videos.push(data.videoUrl);
            }

            // Extract youtube
            if (n.type === 'youtube' && data.videoUrl) {
                youtube.push(data.videoUrl);
            }
        });

        return {
            texts,
            images,
            videos,
            youtube,
            combinedText: texts.join('\n\n')
        };
    }, [nodeId, getNodes, getEdges]);

    return { getInputs };
}

/**
 * API call helpers
 */
export async function generateImageAPI(prompt: string, aspectRatio: string, model?: string, images: string[] = []) {
    console.log('[API] Generating Image:', { prompt, aspectRatio, model, imagesCount: images.length });
    const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, model, images }),
    });

    if (!res.ok) {
        const error = await res.json();
        console.error('[API] Image Generation Failed:', error);
        throw new Error(error.error || 'Failed to generate image');
    }

    const data = await res.json() as { imageUrl: string };
    console.log('[API] Image Generated Successfully');
    return data;
}

export async function generateVideoAPI(prompt: string, duration: string, images: string[] = [], model?: string) {
    console.log('[API] Generating Video:', { prompt, duration, imagesCount: images.length, model });
    const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, images, model }),
    });

    if (!res.ok) {
        const error = await res.json();
        console.error('[API] Video Generation Failed:', error);
        throw new Error(error.error || 'Failed to generate video');
    }

    const data = await res.json() as { videoUrl: string };
    console.log('[API] Video Generated Successfully');
    return data;
}

export async function enhancePromptAPI(prompt: string, type: 'image' | 'video') {
    console.log('[API] Enhancing Prompt:', { prompt, type });
    const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action: 'enhance', type }),
    });

    if (!res.ok) {
        const error = await res.json();
        console.error('[API] Enhance Prompt Failed:', error);
        throw new Error(error.error || 'Failed to enhance prompt');
    }

    const data = await res.json() as { text: string };
    console.log('[API] Prompt Enhanced:', data);
    return data;
}
