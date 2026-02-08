'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from '@xyflow/react';
import { TextNodeData, TEXT_MODELS } from '../../types';
import { enhancePromptAPI } from '@/lib/hooks';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlignLeft, Trash2, Copy, Sparkles, RefreshCw, Check } from 'lucide-react';

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 400;
const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 120;

function TextNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as TextNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();

    const [text, setText] = useState(nodeData.text || '');
    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Prompt');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [size, setSize] = useState<{ width: number; height: number }>({
        width: (nodeData.width as number) || DEFAULT_WIDTH,
        height: (nodeData.height as number) || DEFAULT_HEIGHT,
    });
    const [isResizing, setIsResizing] = useState(false);

    const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

    const handleMouseEnter = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setIsHovered(true);
    };
    const handleMouseLeave = () => {
        hoverTimer.current = setTimeout(() => setIsHovered(false), 300);
    };

    useEffect(() => {
        const timer = setTimeout(() => updateNodeData(id, { text, label }), 500);
        return () => clearTimeout(timer);
    }, [text, label, id, updateNodeData]);

    // Save size to node data
    useEffect(() => {
        const timer = setTimeout(() => updateNodeData(id, { width: size.width, height: size.height }), 100);
        return () => clearTimeout(timer);
    }, [size, id, updateNodeData]);

    const handleEnhance = async () => {
        if (!text.trim()) return;

        setIsEnhancing(true);
        try {
            const { text: enhanced } = await enhancePromptAPI(text, 'image');
            setText(enhanced);
            toast.success('Prompt enhanced');
        } catch (err) {
            console.error('Failed to enhance prompt:', err);
            toast.error('Failed to enhance prompt');
        }
        setIsEnhancing(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    // Resize functionality
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: size.width,
            startHeight: size.height,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - resizeRef.current.startX;
            const deltaY = moveEvent.clientY - resizeRef.current.startY;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX));
            const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY));
            setSize({ width: newWidth, height: newHeight });
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
            {/* Node Body */}
            <div
                className={`relative overflow-hidden flex flex-col bg-[#0A0A0A] border transition-all duration-300 rounded-[16px] ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}
                style={{ width: size.width, minHeight: size.height }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 flex-1">
                        <AlignLeft className="w-3 h-3 text-zinc-500" />
                        <input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent text-[10px] font-semibold text-zinc-400 tracking-wide uppercase focus:outline-none focus:text-white w-full" placeholder="LABEL" />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded ml-2">{(nodeData.model || 'GPT-4o').toUpperCase()}</span>
                </div>
                {/* Content */}
                <div className="flex-1 p-3">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write your prompt..."
                        className="w-full h-full bg-transparent text-[12px] leading-relaxed text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none"
                        style={{ minHeight: size.height - 60 }}
                        spellCheck={false}
                    />
                </div>
                {/* Character count */}
                <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-600">{text.length} chars</span>
                </div>

                {/* Resize Handle - Bottom Right Corner */}
                <div
                    className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end transition-opacity ${isResizing || isHovered || selected ? 'opacity-100' : 'opacity-0'}`}
                    onMouseDown={handleResizeStart}
                >
                    <div className="w-2 h-2 border-r-2 border-b-2 border-white/30 hover:border-white/50 transition-colors rounded-br" />
                </div>
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent text-[9px] text-zinc-300 w-[80px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{TEXT_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[9px]">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/5"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                        onClick={handleEnhance}
                        disabled={isEnhancing || !text.trim()}
                        title="Enhance prompt with AI"
                    >
                        {isEnhancing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}><Trash2 className="w-2.5 h-2.5" /></Button>
                </div>
            </NodeToolbar>

            {/* Handles */}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(TextNode);
