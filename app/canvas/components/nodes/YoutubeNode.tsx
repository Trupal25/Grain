'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { YoutubeNodeData } from '../../types';
import { Button } from '@/components/ui/button';
import { Youtube, Trash2, ExternalLink, Play } from 'lucide-react';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 180;
const MAX_HEIGHT = 450;

function YoutubeNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as YoutubeNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const [isHovered, setIsHovered] = useState(false);

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(nodeData.videoUrl || '');

    return (
        <div
            className="w-full h-full group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                maxWidth={MAX_WIDTH}
                maxHeight={MAX_HEIGHT}
                isVisible={selected || isHovered}
                lineClassName="!border-red-500"
                handleClassName="!w-2 !h-2 !bg-red-500 !border-red-600"
            />

            <div className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing z-30 rounded-t-2xl" />

            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <Youtube className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">YouTube Embed</span>
            </div>

            <div
                className={`w-full h-full overflow-hidden bg-black border transition-all duration-300 rounded-2xl ${selected ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-white/5 hover:border-white/10'
                    }`}
            >
                {videoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <Youtube className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-zinc-200 font-medium mb-1">No Video Linked</h3>
                        <p className="text-zinc-500 text-xs max-w-[200px]">Paste a YouTube URL onto the canvas to embed it here.</p>
                    </div>
                )}
            </div>

            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                    {nodeData.videoUrl && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-zinc-400 hover:text-white"
                            onClick={() => window.open(nodeData.videoUrl, '_blank')}
                        >
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    )}
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteElements({ nodes: [{ id }] })}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </NodeToolbar>

            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(YoutubeNode);
