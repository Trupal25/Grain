'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { VideoNodeData, VIDEO_MODELS, DURATIONS } from '../../types';
import { useNodeInputs, generateVideoAPI } from '@/lib/hooks';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Video, Play, Pause, Clapperboard, Wand2, Download, RefreshCw, Trash2, AlertCircle, Upload } from 'lucide-react';

const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const MIN_HEIGHT = 90;
const MAX_HEIGHT = 270;

function VideoNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as VideoNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const { getInputs } = useNodeInputs(id);

    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Video');
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
        const inputs = getInputs();
        const prompt = nodeData.prompt || inputs.combinedText;

        if (!prompt) {
            setError('Connect a Text node with a prompt');
            updateNodeData(id, { workflowStatus: 'error' });
            return;
        }

        setError(null);
        updateNodeData(id, { isGenerating: true });

        try {
            const { videoUrl } = await generateVideoAPI(prompt, nodeData.duration, inputs.images);
            updateNodeData(id, { videoUrl, isGenerating: false, workflowStatus: 'completed' });
            toast.success('Video generated');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
            updateNodeData(id, { isGenerating: false, workflowStatus: 'error' });
            toast.error('Failed to generate video');
        }
    };

    // Workflow listener
    useEffect(() => {
        if (nodeData.workflowStatus === 'running' && !nodeData.isGenerating) {
            handleGenerate();
        }
    }, [nodeData.workflowStatus, nodeData.isGenerating]);

    const handleDownload = () => {
        if (!nodeData.videoUrl) return;
        const link = document.createElement('a');
        link.href = nodeData.videoUrl;
        link.download = `${label || 'video'}.mp4`;
        link.click();
    };

    // Upload functionality
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please select a video file');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const { url } = await res.json();
                updateNodeData(id, { videoUrl: url });
                toast.success('Video uploaded');
            } else {
                toast.error('Failed to upload video');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload video');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="w-full h-full group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Node Resizer - React Flow's built-in resize component */}
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                maxWidth={MAX_WIDTH}
                maxHeight={MAX_HEIGHT}
                isVisible={selected || isHovered}
                lineClassName="!border-zinc-500"
                handleClassName="!w-2 !h-2 !bg-zinc-400 !border-zinc-600"
            />

            {/* Grab Handle for Dragging */}
            <div className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing z-30 rounded-t-2xl" />

            {/* Top Label */}
            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent text-[10px] font-semibold text-zinc-500 uppercase tracking-widest focus:outline-none focus:text-white w-28 border-b border-transparent focus:border-white/20 transition-all" placeholder="NAME SCENE..." />
                <span className="text-[9px] text-zinc-700 font-mono">{nodeData.model?.split('-')[1]?.toUpperCase() || 'VEO'}</span>
            </div>

            {/* Main Node Body */}
            <div
                className={`w-full h-full min-w-[160px] min-h-[90px] overflow-hidden bg-[#0A0A0A] border transition-all duration-300 rounded-[16px] ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}
            >
                {nodeData.videoUrl ? (
                    <div className="relative w-full h-full group/video">
                        <video ref={videoRef} src={nodeData.videoUrl} poster={nodeData.thumbnailUrl} className="w-full h-full object-cover" loop onEnded={() => setIsPlaying(false)} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20">
                                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                            <button onClick={handleDownload} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20">
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[8px] font-medium text-white/90">{nodeData.duration}</div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                    <Upload className="w-3.5 h-3.5 text-white/50" />
                                </div>
                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Uploading...</p>
                            </div>
                        ) : (nodeData.isGenerating || nodeData.workflowStatus === 'running') ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Clapperboard className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Directing...</p>
                            </div>
                        ) : nodeData.workflowStatus === 'queued' ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <RefreshCw className="w-3.5 h-3.5 text-zinc-600 animate-spin-slow" />
                                </div>
                                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Queued...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                                <AlertCircle className="w-4 h-4 text-red-400/60" />
                                <p className="text-[9px] text-red-400/80 max-w-[140px]">{error}</p>
                            </div>
                        ) : (
                            <div
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all"
                                onClick={handleUploadClick}
                                title="Click to upload a video"
                            >
                                <Video className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleUploadClick} disabled={isUploading}>
                        <Upload className="w-3 h-3" />
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[9px] text-zinc-300 w-[70px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{VIDEO_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[9px]">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.duration} onValueChange={(v) => updateNodeData(id, { duration: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[9px] text-zinc-300 w-[45px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Dur" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{DURATIONS.map(d => <SelectItem key={d.value} value={d.value} className="text-[9px]">{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}><Trash2 className="w-3 h-3" /></Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="sm"
                        className="h-5 text-[9px] bg-white text-black hover:bg-zinc-200 rounded-full px-2 font-bold disabled:opacity-50"
                        onClick={handleGenerate}
                        disabled={nodeData.isGenerating}
                    >
                        {nodeData.isGenerating ? <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" /> : <Wand2 className="w-2.5 h-2.5 mr-1" />}
                        {nodeData.isGenerating ? 'GEN' : 'GENERATE'}
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
