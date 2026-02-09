'use client';

import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { ImageNodeData, IMAGE_MODELS, ASPECT_RATIOS } from '../../types';
import { useNodeInputs, generateImageAPI } from '@/lib/hooks';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    ImageIcon,
    Wand2,
    Download,
    Maximize2,
    Sparkles,
    RefreshCw,
    Trash2,
    AlertCircle,
    Upload,
    Play
} from 'lucide-react';
import { MediaModal } from '../modals/MediaModal';

const MIN_SIZE = 100;
const MAX_SIZE = 600;

import { MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, MAX_HEIGHT } from '@/lib/canvas-utils';

function ImageNode({ id, data, selected, width, height }: NodeProps) {
    const nodeData = data as unknown as ImageNodeData;
    const { updateNodeData, deleteElements, setNodes } = useReactFlow();
    const { getInputs } = useNodeInputs(id);
    const inputs = useMemo(() => getInputs(), [getInputs]);

    // Track previous ratio to detect changes
    const prevRatioRef = useRef<string>(nodeData.aspectRatio || '1:1');
    const [aspectRatio, setAspectRatio] = useState(nodeData.aspectRatio || '1:1');

    // Parse current ratio value
    const currentRatioValue = useMemo(() => {
        const [w, h] = aspectRatio.split(':').map(Number);
        return w / h;
    }, [aspectRatio]);

    // Enforce aspect ratio when valid width is present and ratio changes
    useEffect(() => {
        if (width && aspectRatio !== prevRatioRef.current) {
            const newHeight = width / currentRatioValue;
            setNodes((nodes) => nodes.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        style: { ...n.style, width: width, height: newHeight },
                        width: width,
                        height: newHeight
                    };
                }
                return n;
            }));
            prevRatioRef.current = aspectRatio;
        }
    }, [aspectRatio, width, currentRatioValue, id, setNodes]);

    // Validate and sync state with data
    useEffect(() => {
        if (nodeData.aspectRatio && nodeData.aspectRatio !== aspectRatio) {
            setAspectRatio(nodeData.aspectRatio);
        }
    }, [nodeData.aspectRatio, aspectRatio]);

    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Image');
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleGenerate = async () => {
        // Refresh inputs to ensure we have the latest data
        const currentInputs = getInputs();
        console.log('[ImageNode] Inputs refresh:', currentInputs);

        const prompt = nodeData.prompt || currentInputs.combinedText;

        if (!prompt) {
            setError('Connect a Text node with a prompt');
            console.error('[ImageNode] Missing prompt. Inputs:', currentInputs);
            updateNodeData(id, { workflowStatus: 'error' });
            return;
        }

        setError(null);
        updateNodeData(id, { isGenerating: true });

        try {
            console.log('[ImageNode] Generating image with:', { prompt, ratio: nodeData.aspectRatio, model: nodeData.model, imagesCount: currentInputs.images.length });
            const { imageUrl } = await generateImageAPI(prompt, nodeData.aspectRatio, nodeData.model, currentInputs.images);
            console.log('[ImageNode] Generation successful');
            updateNodeData(id, { imageUrl, isGenerating: false, workflowStatus: 'completed' });

            // Load generated image to confirm dimensions and resize
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                const aspect = img.naturalWidth / img.naturalHeight;
                const targetWidth = 400;
                const targetHeight = targetWidth / aspect;

                setNodes((nds) => nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            style: { ...node.style, width: targetWidth, height: targetHeight },
                            width: targetWidth,
                            height: targetHeight,
                        };
                    }
                    return node;
                }));
            };

            toast.success('Image generated');
        } catch (err) {
            console.error('[ImageNode] Generation failed:', err);
            setError(err instanceof Error ? err.message : 'Generation failed');
            updateNodeData(id, { isGenerating: false, workflowStatus: 'error' });
            toast.error('Failed to generate image');
        }
    };

    // Workflow listener
    useEffect(() => {
        if (nodeData.workflowStatus === 'running' && !nodeData.isGenerating) {
            handleGenerate();
        }
    }, [nodeData.workflowStatus, nodeData.isGenerating]);

    const handleDownload = async () => {
        if (!nodeData.imageUrl) return;
        try {
            const response = await fetch(nodeData.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = (label || 'grain-image').replace(/\s+/g, '-').toLowerCase() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(nodeData.imageUrl, '_blank');
        }
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
                const { file: uploadedFileRecord } = await res.json();

                // Load image to get dimensions
                const img = new Image();
                img.src = uploadedFileRecord.url;
                img.onload = () => {
                    const aspect = img.naturalWidth / img.naturalHeight;
                    const newWidth = 400;
                    const newHeight = newWidth / aspect;

                    // Update node dimensions
                    setNodes((nds) => nds.map((node) => {
                        if (node.id === id) {
                            return {
                                ...node,
                                style: { ...node.style, width: newWidth, height: newHeight },
                                width: newWidth,
                                height: newHeight,
                            };
                        }
                        return node;
                    }));

                    // Update node data
                    updateNodeData(id, {
                        imageUrl: uploadedFileRecord.url,
                        aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`
                    });

                    toast.success('Image uploaded');
                };
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

    return (
        <div className="w-full h-full group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Node Resizer - React Flow's built-in resize component */}
            <NodeResizer
                maxWidth={MAX_WIDTH.image}
                maxHeight={MAX_HEIGHT.image}
                minWidth={MIN_WIDTH.image}
                minHeight={MIN_HEIGHT.image}
                isVisible={selected || isHovered}
                keepAspectRatio={true}
                lineClassName="!border-zinc-500"
                handleClassName="!w-2 !h-2 !bg-zinc-400 !border-zinc-600"
            />

            {/* Top Label */}
            <div className="absolute -top-7 left-1 flex items-center gap-2 px-1 py-1 z-20">
                <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="bg-transparent text-[10px] font-semibold text-zinc-500 uppercase tracking-widest focus:outline-none focus:text-white w-28 border-b border-transparent focus:border-white/20 transition-all"
                    placeholder="NAME NODE..."
                />

                {(nodeData as any).isInActiveChain && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter animate-pulse">
                            CHAIN ACTIVE
                        </span>
                    </div>
                )}

                <span className="text-[9px] text-zinc-700 font-mono">
                    {nodeData.model?.split('-')[1]?.toUpperCase() || 'IMAGEN'}
                </span>
            </div>

            {/* Main Node Body - uses 100% to fill the resizable container */}
            <div
                className={cn(
                    "w-full h-full overflow-hidden bg-[#0A0A0A] border transition-all duration-300 rounded-[20px]",
                    selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10',
                    (nodeData as any).isInActiveChain && "ring-1 ring-blue-500/30 ring-offset-2 ring-offset-black",
                )}
                style={{
                    ringColor: (nodeData as any).isInActiveChain ? '#3b82f644' : 'transparent'
                } as any}
            >
                {nodeData.imageUrl ? (
                    <div className="w-full h-full relative group/image cursor-zoom-in" onDoubleClick={() => setIsPreviewOpen(true)}>
                        <img src={nodeData.imageUrl} alt="Generated" className="w-full h-full object-cover nodrag pointer-events-none" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-auto">
                            <Button size="icon" variant="secondary" className="h-5 w-5 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70" onClick={handleDownload}>
                                <Download className="w-2.5 h-2.5" />
                            </Button>
                            <Button size="icon" variant="secondary" className="h-5 w-5 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70" onClick={() => setIsPreviewOpen(true)}>
                                <Maximize2 className="w-2.5 h-2.5" />
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
                        ) : (nodeData.isGenerating || nodeData.workflowStatus === 'running') ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-zinc-400 border border-zinc-300 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(161,161,170,0.4)]">
                                    <Sparkles className="w-3.5 h-3.5 text-black" />
                                </div>
                                <p className="text-[9px] text-zinc-300 uppercase tracking-widest font-bold">In Progress...</p>
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
                                title="Click to upload an image"
                            >
                                <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
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
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[10px] text-zinc-300 w-[100px] focus:ring-0 hover:bg-white/5 rounded-full px-2">
                            <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">
                            {IMAGE_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[10px]">{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Select value={nodeData.aspectRatio} onValueChange={(v) => updateNodeData(id, { aspectRatio: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[10px] text-zinc-300 w-[60px] focus:ring-0 hover:bg-white/5 rounded-full px-2">
                            <SelectValue placeholder="Ratio" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">
                            {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value} className="text-[10px]">{r.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn("h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/10")}
                        onClick={() => (window as any).triggerWorkflow?.(id)}
                        title="Run this node and all downstream nodes"
                    >
                        <Play className="w-3 h-3 fill-current" />
                    </Button>
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

            <MediaModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                src={nodeData.imageUrl || ''}
                title={label}
            />
        </div>
    );
}

export default memo(ImageNode);
