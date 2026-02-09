'use client';

import { memo, useState, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { YoutubeNodeData } from '../../types';
import { Button } from '@/components/ui/button';
import { Youtube, Trash2, ExternalLink, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

import { getYoutubeId, MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, MAX_HEIGHT } from '@/lib/canvas-utils';

function YoutubeNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as YoutubeNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const [isHovered, setIsHovered] = useState(false);

    const videoId = useMemo(() => getYoutubeId(nodeData.videoUrl || ''), [nodeData.videoUrl]);

    return (
        <div
            className="w-full h-full group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <NodeResizer
                maxWidth={MAX_WIDTH.youtube}
                maxHeight={MAX_HEIGHT.youtube}
                minWidth={MIN_WIDTH.youtube}
                minHeight={MIN_HEIGHT.youtube}
                isVisible={selected || isHovered}
                lineClassName="!border-red-500"
                handleClassName="!w-2 !h-2 !bg-red-500 !border-red-600"
            />

            {/* Grab Handle - Inset to not block resizer handles */}
            <div className="absolute top-0 left-8 right-8 h-8 cursor-grab active:cursor-grabbing z-20 rounded-t-2xl" />

            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <Youtube className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">YouTube Embed</span>
                {(nodeData as any).isInActiveChain && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[7px] font-bold text-blue-400 uppercase tracking-tighter animate-pulse">
                            CHAIN ACTIVE
                        </span>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "w-full h-full overflow-hidden bg-black border transition-all duration-300 rounded-2xl",
                    selected ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-white/5 hover:border-white/10',
                    (nodeData as any).isInActiveChain && "ring-1 ring-blue-500/30 ring-offset-2 ring-offset-black",
                )}
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
