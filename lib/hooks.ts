import { useCallback } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import type { TextNodeData } from '@/app/types';

/**
 * Hook to find prompt text from connected TextNodes
 */
export function useConnectedPrompt(nodeId: string) {
    const { getNodes, getEdges } = useReactFlow();

    const getPrompt = useCallback(() => {
        const edges = getEdges();
        const nodes = getNodes();

        // Find edges where this node is the target (incoming connections)
        const incomingEdges = edges.filter((e: Edge) => e.target === nodeId);

        // Get source nodes
        const sourceNodeIds = incomingEdges.map((e: Edge) => e.source);
        const sourceNodes = nodes.filter((n: Node) => sourceNodeIds.includes(n.id));

        // Find TextNodes and extract their text
        const textNodes = sourceNodes.filter((n: Node) => n.type === 'text');
        const prompts = textNodes
            .map((n: Node) => (n.data as TextNodeData).text)
            .filter(Boolean);

        return prompts.join('\n\n');
    }, [nodeId, getNodes, getEdges]);

    return { getPrompt };
}

/**
 * API call helpers
 */
export async function generateImageAPI(prompt: string, aspectRatio: string) {
    const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate image');
    }

    return res.json() as Promise<{ imageUrl: string }>;
}

export async function generateVideoAPI(prompt: string, duration: string) {
    const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate video');
    }

    return res.json() as Promise<{ videoUrl: string }>;
}

export async function enhancePromptAPI(prompt: string, type: 'image' | 'video') {
    const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action: 'enhance', type }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to enhance prompt');
    }

    return res.json() as Promise<{ text: string }>;
}
