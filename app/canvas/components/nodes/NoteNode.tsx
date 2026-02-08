'use client';

import { memo, useState, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { NoteNodeData } from '../../types';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const extractTextFromTiptap = (json: any): string => {
    if (!json) return '';
    try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        if (data.type === 'doc' && Array.isArray(data.content)) {
            return data.content.map((block: any) => {
                if (block.content && Array.isArray(block.content)) {
                    return block.content.map((c: any) => c.text || '').join('');
                }
                return '';
            }).join('\n');
        }
        return typeof json === 'string' ? json : JSON.stringify(data);
    } catch (e) {
        return typeof json === 'string' ? json : '';
    }
};

function NoteNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as NoteNodeData;
    const { deleteElements } = useReactFlow();
    const router = useRouter();

    const [copied, setCopied] = useState(false);
    const contentText = useMemo(() => extractTextFromTiptap(nodeData.content), [nodeData.content]);

    const handleCopy = () => {
        navigator.clipboard.writeText(contentText);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpen = () => {
        if (nodeData.noteId || nodeData.id) {
            router.push(`/document/${nodeData.noteId || nodeData.id}`);
        }
    };

    return (
        <div className="w-full h-full group relative">
            <NodeResizer minWidth={200} minHeight={100} isVisible={selected} lineClassName="!border-zinc-500" handleClassName="!w-2 !h-2 !bg-zinc-400" />

            <div className={`w-full h-full min-w-[200px] min-h-[100px] flex flex-col bg-[#1A1A1A] border transition-all duration-300 rounded-xl overflow-hidden ${selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-white/10 hover:border-white/20'}`}>
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-medium text-zinc-300 truncate">{nodeData.title || nodeData.label || 'Untitled Note'}</span>
                </div>

                {/* Content Preview */}
                <div className="flex-1 p-3 overflow-hidden bg-black/20">
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap line-clamp-[10] select-none pointer-events-none">
                        {contentText || <span className="italic opacity-50">Empty note...</span>}
                    </p>
                </div>

                {/* Footer info */}
                <div className="px-3 py-1.5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Note Context</span>
                    <span className="text-[9px] text-zinc-600">{contentText.length} chars</span>
                </div>
            </div>

            <NodeToolbar isVisible={selected} position={Position.Bottom} offset={10}>
                <div className="flex items-center gap-1 p-1 bg-[#1A1A1A] border border-white/10 rounded-full shadow-xl">
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={handleOpen} title="Open Document">
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                    </Button>
                    <div className="w-px h-3 bg-white/10" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-red-400 hover:bg-red-500/10" onClick={() => deleteElements({ nodes: [{ id }] })}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </NodeToolbar>

            <Handle type="target" position={Position.Left} className="!bg-zinc-600 !w-2 !h-4 !rounded-sm !-left-2" />
            <Handle type="source" position={Position.Right} className="!bg-zinc-600 !w-2 !h-4 !rounded-sm !-right-2" />
        </div>
    );
}

export default memo(NoteNode);
