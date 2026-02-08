'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from '@xyflow/react';
import { ImageNodeData, IMAGE_MODELS, ASPECT_RATIOS } from '../../types';
import { useConnectedPrompt, generateImageAPI } from '@/lib/hooks';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    ImageIcon,
    Wand2,
    Download,
    Maximize2,
    Sparkles,
    RefreshCw,
    Trash2,
    AlertCircle,
    Upload
} from 'lucide-react';

const MIN_SIZE = 120;
const MAX_SIZE = 600;
const DEFAULT_SIZE = 200;

function ImageNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as ImageNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const { getPrompt } = useConnectedPrompt(id);

    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Image');
    const [error, setError] = useState<string | null>(null);
    const [size, setSize] = useState<number>((nodeData.size as number) || DEFAULT_SIZE);
    const [isResizing, setIsResizing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resizeRef = useRef({ startY: 0, startSize: 0 });

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

    // Save size to node data when it changes
    useEffect(() => {
        const timer = setTimeout(() => updateNodeData(id, { size }), 100);
        return () => clearTimeout(timer);
    }, [size, id, updateNodeData]);

    const handleGenerate = async () => {
        const prompt = nodeData.prompt || getPrompt();

        if (!prompt) {
            setError('Connect a Text node with a prompt');
            return;
        }

        setError(null);
        updateNodeData(id, { isGenerating: true });

        try {
            const { imageUrl } = await generateImageAPI(prompt, nodeData.aspectRatio);
            updateNodeData(id, { imageUrl, isGenerating: false });
            toast.success('Image generated');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
            updateNodeData(id, { isGenerating: false });
            toast.error('Failed to generate image');
        }
    };

    const handleDownload = () => {
        if (!nodeData.imageUrl) return;
        const link = document.createElement('a');
        link.href = nodeData.imageUrl;
        link.download = `${label || 'image'}.png`;
        link.click();
    };

    // Upload functionality
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
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
                updateNodeData(id, { imageUrl: url });
                toast.success('Image uploaded');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Resize functionality
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = { startY: e.clientY, startSize: size };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - resizeRef.current.startY;
            const newSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, resizeRef.current.startSize + deltaY));
            setSize(newSize);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [size]);

    return (
        <div className="group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Top Label */}
            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="bg-transparent text-[10px] font-semibold text-zinc-500 uppercase tracking-widest focus:outline-none focus:text-white w-28 border-b border-transparent focus:border-white/20 transition-all"
                    placeholder="NAME NODE..."
                />
                <span className="text-[9px] text-zinc-700 font-mono">
                    {nodeData.model?.split('-')[1]?.toUpperCase() || 'IMAGEN'}
                </span>
            </div>

            {/* Main Node Body */}
            <div
                className={`relative overflow-hidden bg-[#0A0A0A] border transition-all duration-300 rounded-[20px] ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}
                style={{ width: size, height: size }}
            >
                {nodeData.imageUrl ? (
                    <div className="w-full h-full relative group/image">
                        <img src={nodeData.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70" onClick={handleDownload}>
                                <Download className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70">
                                <Maximize2 className="w-3 h-3" />
                            </Button>
                        </div>
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
                        ) : nodeData.isGenerating ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                    <Sparkles className="w-3.5 h-3.5 text-white/50" />
                                </div>
                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Generating...</p>
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
                                title="Click to upload an image"
                            >
                                <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                        )}
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    className={`absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center transition-opacity ${isResizing || isHovered || selected ? 'opacity-100' : 'opacity-0'}`}
                    onMouseDown={handleResizeStart}
                >
                    <div className="w-8 h-1 rounded-full bg-white/30 hover:bg-white/50 transition-colors" />
                </div>
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleUploadClick} disabled={isUploading}>
                        <Upload className="w-3 h-3" />
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[9px] text-zinc-300 w-[80px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{IMAGE_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[9px]">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.aspectRatio} onValueChange={(v) => updateNodeData(id, { aspectRatio: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[9px] text-zinc-300 w-[45px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Ratio" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value} className="text-[9px]">{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
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

export default memo(ImageNode);
