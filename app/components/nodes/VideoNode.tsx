'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from '@xyflow/react';
import { VideoNodeData, VIDEO_MODELS, DURATIONS } from '../../types';
import { useConnectedPrompt, generateVideoAPI } from '@/lib/hooks';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Video, Play, Pause, Clapperboard, Wand2, Maximize2, Download, RefreshCw, Trash2, AlertCircle } from 'lucide-react';

function VideoNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as VideoNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const { getPrompt } = useConnectedPrompt(id);

    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Video');
    const [error, setError] = useState<string | null>(null);
    const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleMouseEnter = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setIsHovered(true);
    };
    const handleMouseLeave = () => {
        hoverTimer.current = setTimeout(() => setIsHovered(false), 300);
    };

    useEffect(() => {
        const timer = setTimeout(() => updateNodeData(id, { label }), 500);
        return () => clearTimeout(timer);
    }, [label, id, updateNodeData]);

    const togglePlay = () => {
        if (videoRef.current) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleGenerate = async () => {
        const prompt = nodeData.prompt || getPrompt();

        if (!prompt) {
            setError('Connect a Text node with a prompt');
            return;
        }

        setError(null);
        updateNodeData(id, { isGenerating: true });

        try {
            const { videoUrl } = await generateVideoAPI(prompt, nodeData.duration);
            updateNodeData(id, { videoUrl, isGenerating: false });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
            updateNodeData(id, { isGenerating: false });
        }
    };

    return (
        <div className="group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Top Label */}
            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent text-[10px] font-semibold text-zinc-500 uppercase tracking-widest focus:outline-none focus:text-white w-28 border-b border-transparent focus:border-white/20 transition-all" placeholder="NAME SCENE..." />
                <span className="text-[9px] text-zinc-700 font-mono">{nodeData.model?.split('-')[1]?.toUpperCase() || 'VEO'}</span>
            </div>

            {/* Main Node Body */}
            <div className={`relative w-[280px] h-[160px] rounded-[20px] overflow-hidden bg-[#0A0A0A] border transition-all duration-300 ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}>
                {nodeData.videoUrl ? (
                    <div className="relative w-full h-full group/video">
                        <video ref={videoRef} src={nodeData.videoUrl} poster={nodeData.thumbnailUrl} className="w-full h-full object-cover" loop onEnded={() => setIsPlaying(false)} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20">
                                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
                            </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-medium text-white/90">{nodeData.duration}</div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        {nodeData.isGenerating ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                    <Clapperboard className="w-4 h-4 text-white/50" />
                                </div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Generating video...</p>
                                <p className="text-[9px] text-zinc-600">This may take a few minutes</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <AlertCircle className="w-5 h-5 text-red-400/60" />
                                <p className="text-[10px] text-red-400/80 max-w-[200px]">{error}</p>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <Video className="w-4 h-4 text-zinc-600" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-7 border-0 bg-transparent text-[10px] text-zinc-300 w-[90px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{VIDEO_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[10px]">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.duration} onValueChange={(v) => updateNodeData(id, { duration: v })}>
                        <SelectTrigger className="h-7 border-0 bg-transparent text-[10px] text-zinc-300 w-[55px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Dur" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{DURATIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-[10px]">{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}><Trash2 className="w-3 h-3" /></Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="sm"
                        className="h-6 text-[10px] bg-white text-black hover:bg-zinc-200 rounded-full px-2.5 font-bold disabled:opacity-50"
                        onClick={handleGenerate}
                        disabled={nodeData.isGenerating}
                    >
                        {nodeData.isGenerating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                        {nodeData.isGenerating ? 'GENERATING' : 'GENERATE'}
                    </Button>
                </div>
            </NodeToolbar>

            {/* Handles */}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(VideoNode);
