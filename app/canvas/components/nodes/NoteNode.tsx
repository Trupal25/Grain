'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { NoteNodeData } from '../../types';
import Editor from '@/components/editor/Editor';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Trash2, Maximize2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PartialBlock } from '@blocknote/core';

function NoteNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as NoteNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    // Memoize initial content to prevent editor re-initialization on every render
    const initialEditorContent = useMemo(() => {
        try {
            return (typeof nodeData.content === 'string'
                ? JSON.parse(nodeData.content)
                : nodeData.content) as PartialBlock[];
        } catch (e) {
            return undefined;
        }
    }, []); // Empty dependency array to ensuring it only runs once on mount

    const handleContentChange = useCallback((newContent: any) => {
        // Debounce or direct update? Direct for now, simpler.
        // Update local node data so it is saved with the canvas
        updateNodeData(id, { content: newContent });
    }, [id, updateNodeData]);

    const handleCopy = () => {
        const textToCopy = typeof nodeData.content === 'string' ? nodeData.content : JSON.stringify(nodeData.content);
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success('Note content copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpen = () => {
        if (nodeData.noteId || nodeData.id) {
            router.push(`/document/${nodeData.noteId || nodeData.id}`);
        }
    };

    return (
        <div className="w-full h-full group relative">
            <NodeResizer
                minWidth={300}
                minHeight={200}
                isVisible={selected}
                lineClassName="!border-blue-500/30 opacity-50"
                handleClassName="!w-3 !h-3 !bg-blue-500/50 !rounded-full !border-2 !border-zinc-900 shadow-lg"
            />

            <div
                className={cn(
                    "w-full h-full flex flex-col transition-all duration-300 rounded-lg overflow-hidden shadow-2xl",
                    "bg-[#1A1A1A] border border-white/[0.08]",
                    selected
                        ? "ring-1 ring-blue-500/50 border-blue-500/50"
                        : "hover:border-white/20"
                )}
            >
                {/* Header - Minimalist & Refined */}
                <div className="flex items-center px-3 bg-white/[0.01] border-b border-white/[0.04] shrink-0 h-8 drag-handle justify-between">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.08em] truncate">
                        {nodeData.title || 'Untitled'}
                    </span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleOpen}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-zinc-600 hover:text-zinc-300"
                            title="Open Full Document"
                        >
                            <Maximize2 className="w-2.5 h-2.5" />
                        </button>
                    </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-hidden relative nodrag nopan nowheel bg-black/10 cursor-text">
                    <style jsx global>{`
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(255,255,255,0.1) transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
                            height: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.15);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.25);
                        }

                        /* BlockNote Overrides */
                        .bn-editor {
                            padding: 0 !important;
                            background: transparent !important;
                        }
                        .bn-block-content {
                            padding-top: 1px !important; 
                            padding-bottom: 1px !important;
                            background: transparent !important;
                        }
                        
                        .bn-editor h1 {
                            font-size: 1.15rem !important;
                            font-weight: 700 !important;
                            margin-top: 0.75rem !important;
                            margin-bottom: 0.35rem !important;
                        }
                        .bn-editor h2 {
                            font-size: 1.05rem !important;
                            font-weight: 600 !important;
                        }
                        .bn-editor p {
                             font-size: 0.875rem !important;
                             color: #a1a1aa !important;
                             line-height: 1.5 !important;
                        }

                        /* Hide placeholders */
                        .bn-editor .bn-block-content[data-content-type="paragraph"] [data-text=""]::before {
                            content: "" !important;
                        }
                        .bn-editor .bn-block-content .bn-inline-content:has(> .bn-string-content[data-text=""])::before, 
                        .ProseMirror p.is-empty::before {
                             content: "" !important;
                             display: none !important;
                        }

                        .bn-side-menu {
                            display: none !important;
                        }
                    `}</style>
                    <div className="h-full w-full overflow-y-auto custom-scrollbar px-4 py-3">
                        <Editor
                            initialContent={initialEditorContent}
                            onChange={handleContentChange}
                            editable={true}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Toolbar - Ultra Glassy */}
            <NodeToolbar isVisible={selected} position={Position.Top} offset={12} className="!bg-transparent !p-0 !border-none">
                <div className="flex items-center gap-1 p-1 bg-zinc-900/80 border border-white/10 rounded-lg shadow-2xl backdrop-blur-xl transform -translate-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                        onClick={handleCopy}
                        title="Copy Content JSON"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <div className="w-px h-4 bg-white/10 mx-0.5" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-md hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all"
                        onClick={() => deleteElements({ nodes: [{ id }] })}
                        title="Delete Node"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </NodeToolbar>

            {/* Minimal High-Contrast Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-blue-500/50 !w-1.5 !h-10 !rounded-full !-left-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 border-none shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-blue-500/50 !w-1.5 !h-10 !rounded-full !-right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 border-none shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            />
        </div>
    );
}

export default memo(NoteNode);
