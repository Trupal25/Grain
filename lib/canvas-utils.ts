import { Node, Connection, Edge } from '@xyflow/react';

export const MIN_WIDTH = {
    image: 160,
    video: 160,
    text: 240,
    note: 240,
    chat: 320,
    youtube: 240,
};

export const MAX_WIDTH = {
    image: 800,
    video: 480,
    text: 800,
    note: 600,
    chat: 1000,
    youtube: 800,
};

export const MIN_HEIGHT = {
    image: 160,
    video: 90,
    text: 120,
    note: 200,
    chat: 400,
    youtube: 140,
};

export const MAX_HEIGHT = {
    image: 800,
    video: 270,
    text: 600,
    note: 600,
    chat: 1000,
    youtube: 450,
};

export function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function isValidConnection(conn: Edge | Connection, nodes: Node[]) {
    if (conn.source === conn.target) return false;

    const sourceNode = nodes.find(n => n.id === conn.source);
    const targetNode = nodes.find(n => n.id === conn.target);

    if (!sourceNode || !targetNode) return false;

    // Rules:
    // Text, Note, Chat can act as inputs to Image, Video, or another Chat
    if (['text', 'note', 'chat'].includes(sourceNode.type as string)) {
        return ['image', 'video', 'chat'].includes(targetNode.type as string);
    }

    // Media nodes (Image, Video, YouTube) can only connect to Chat for context
    if (['image', 'video', 'youtube'].includes(sourceNode.type as string)) {
        if (sourceNode.type === 'image' && targetNode.type === 'video') return true;
        return targetNode.type === 'chat';
    }

    return false;
}
