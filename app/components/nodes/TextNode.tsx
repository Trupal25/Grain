'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from '@xyflow/react';
import { TextNodeData, TEXT_MODELS } from '../../types';
import { enhancePromptAPI } from '@/lib/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlignLeft, Trash2, Copy, Sparkles, RefreshCw, Check } from 'lucide-react';

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
        try {
            const { text: enhanced } = await enhancePromptAPI(text, 'image');
            setText(enhanced);
        } catch (err) {
            console.error('Failed to enhance prompt:', err);
        }
        setIsEnhancing(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Node Body */}
            <div className={`relative w-[320px] min-h-[160px] rounded-[20px] overflow-hidden flex flex-col bg-[#0A0A0A] border transition-all duration-300 ${selected ? 'border-zinc-500/50 ring-1 ring-zinc-700/50' : 'border-white/5 hover:border-white/10'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 flex-1">
                        <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
                        <input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-transparent text-[11px] font-semibold text-zinc-400 tracking-wide uppercase focus:outline-none focus:text-white w-full" placeholder="LABEL" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded ml-2">{(nodeData.model || 'GPT-4o').toUpperCase()}</span>
                </div>
                {/* Content */}
                <div className="flex-1 p-3">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write your prompt or instructions here..."
                        className="w-full h-full bg-transparent text-[13px] leading-relaxed text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none min-h-[120px]"
                        spellCheck={false}
                    />
                </div>
                {/* Character count */}
                <div className="px-3 pb-2">
                    <span className="text-[9px] text-zinc-600">{text.length} characters</span>
                </div>
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected || isHovered} position={Position.Bottom} offset={10} align="center">
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Select value={nodeData.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
                        <SelectTrigger className="h-7 border-0 bg-transparent text-[10px] text-zinc-300 w-[100px] focus:ring-0 hover:bg-white/5 rounded-full"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-300 z-50">{TEXT_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-[10px]">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/5"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 disabled:opacity-50"
                        onClick={handleEnhance}
                        disabled={isEnhancing || !text.trim()}
                        title="Enhance prompt with AI"
                    >
                        {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}><Trash2 className="w-3 h-3" /></Button>
                </div>
            </NodeToolbar>

            {/* Handles */}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default memo(TextNode);
