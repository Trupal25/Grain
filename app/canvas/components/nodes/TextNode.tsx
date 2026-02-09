'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { TextNodeData, TEXT_MODELS } from '../../types';
import { enhancePromptAPI } from '@/lib/hooks';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlignLeft, Trash2, Copy, Sparkles, RefreshCw, Check } from 'lucide-react';

import { MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, MAX_HEIGHT } from '@/lib/canvas-utils';

function TextNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as TextNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();

    const [text, setText] = useState(nodeData.text || '');
    const [isHovered, setIsHovered] = useState(false);
    const [label, setLabel] = useState(nodeData.label || 'Prompt');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [copied, setCopied] = useState(false);

    const hoverTimer = useRef<NodeJS.Timeout | undefined>(undefined);

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

    const handleEnhance = async () => {
        if (!text.trim()) return;

        setIsEnhancing(true);
        console.log('[TextNode] Enhancing prompt:', text);
        try {
            const { text: enhanced } = await enhancePromptAPI(text, 'image');
            console.log('[TextNode] Enhanced result:', enhanced);
            setText(enhanced);
            toast.success('Prompt enhanced');
        } catch (err) {
            console.error('[TextNode] Failed to enhance prompt:', err);
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

    return (
        <div className="w-full h-full group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Node Resizer - React Flow's built-in resize component */}
            <NodeResizer
                maxWidth={MAX_WIDTH.text}
                maxHeight={MAX_HEIGHT.text}
                minWidth={MIN_WIDTH.text}
                minHeight={MIN_HEIGHT.text}
                isVisible={selected || isHovered}
                lineClassName="!border-zinc-500"
                handleClassName="!w-2 !h-2 !bg-zinc-400 !border-zinc-600"
            />

            {/* Node Body */}
            <div
                className={`w-full h-full min-w-[180px] min-h-[40px] overflow-hidden flex flex-col bg-[#0A0A0A] border transition-all duration-300 rounded-[8px] group ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}
            >
                {/* Drag Handle Area */}
                <div className="h-2 w-full bg-white/5 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors" />

                <div className="flex-1 relative overflow-hidden">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write prompt..."
                        className="absolute inset-0 w-full h-full bg-transparent text-[11px] leading-snug text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none p-2 font-mono nodrag nowheel overflow-y-auto outline-none transition-all scrollbar-auto"
                        spellCheck={false}
                    />
                    {/* Hover actions overlay */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300">
                            {copied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-5 border-0 bg-transparent text-[9px] text-zinc-400 w-[60px] focus:ring-0 hover:bg-white/5 rounded-full px-1"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{TEXT_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[9px]">{m.label.replace('Gemini ', '').replace(' Flash', '')}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-full text-zinc-400 hover:text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                        onClick={handleEnhance}
                        disabled={isEnhancing || !text.trim()}
                        title="Enhance"
                    >
                        {isEnhancing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                            console.log('[TextNode] Deleting node:', id);
                            deleteElements({ nodes: [{ id }] });
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </NodeToolbar>

            {/* Handles */}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(TextNode);
