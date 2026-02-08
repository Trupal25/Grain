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
                lineClassName="!border-zinc-600 opacity-50"
                handleClassName="!w-2.5 !h-2.5 !bg-zinc-400 !rounded-full !border-none"
            />

            <div
                className={cn(
                    "w-full h-full flex flex-col bg-[#1e1e1e] border transition-all duration-200 rounded-lg overflow-hidden shadow-sm",
                    selected ? "border-blue-500/60 shadow-[0_0_0_1px_rgba(59,130,246,0.6)]" : "border-zinc-800 hover:border-zinc-700"
                )}
            >
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02] shrink-0 h-9 drag-handle">
                    <div className="flex items-center justify-center w-4 h-4 rounded text-zinc-400">
                        <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-medium text-zinc-300 truncate flex-1 leading-none pt-0.5">
                        {nodeData.title || 'Untitled Note'}
                    </span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleOpen} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300" title="Open Full Document">
                            <Maximize2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Editor Content Area */}
                {/* 'nodrag' prevents React Flow from capturing drag events inside the editor */}
                {/* 'nopan' prevents canvas panning when interacting with scrollbar or text */}
                {/* 'nowheel' prevents canvas zooming when scrolling inside the note */}
                <div className="flex-1 overflow-hidden relative nodrag nopan nowheel bg-[#1e1e1e] cursor-text">
                    <style jsx global>{`
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: #3f3f46 transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                            height: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #3f3f46;
                            border-radius: 3px;
                            border: 1px solid #1e1e1e;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #52525b;
                        }

                        /* BlockNote Overrides for "Note Card" look */
                        .bn-editor {
                            padding: 0 !important;
                        }
                        .bn-block-content {
                            padding-top: 2px !important; 
                            padding-bottom: 2px !important;
                        }

                        /* Scale down headings */
                        .bn-editor h1 {
                            font-size: 1.25rem !important;
                            font-weight: 700 !important;
                            letter-spacing: -0.02em !important;
                            line-height: 1.2 !important;
                            margin-top: 0.5rem !important;
                            margin-bottom: 0.25rem !important;
                        }
                        .bn-editor h2 {
                            font-size: 1.1rem !important;
                            font-weight: 600 !important;
                            margin-top: 0.5rem !important;
                            margin-bottom: 0.25rem !important;
                        }
                        .bn-editor h3 {
                            font-size: 1rem !important;
                            font-weight: 600 !important;
                            margin-top: 0.25rem !important;
                            margin-bottom: 0.25rem !important;
                        }
                        .bn-editor p {
                             font-size: 0.9rem !important;
                             line-height: 1.4 !important;
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

                        /* Hide side menu/drag handles in simpler view */
                        .bn-side-menu {
                            display: none !important;
                        }
                    `}</style>
                    <div className="h-full w-full overflow-y-auto custom-scrollbar px-3 py-2">
                        <Editor
                            initialContent={initialEditorContent}
                            onChange={handleContentChange}
                            editable={true}
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <NodeToolbar isVisible={selected} position={Position.Top} offset={5} className="!bg-transparent !p-0 !border-none">
                <div className="flex items-center gap-0.5 p-1 bg-zinc-900 border border-zinc-700/50 rounded-md shadow-xl backdrop-blur-sm transform -translate-y-2">
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded hover:bg-white/10 text-zinc-400" onClick={handleCopy} title="Copy Content JSON">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <div className="w-px h-3 bg-white/10 mx-0.5" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded hover:bg-red-500/20 text-red-400/80 hover:text-red-400" onClick={() => deleteElements({ nodes: [{ id }] })} title="Delete Node">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </NodeToolbar>

            <Handle type="target" position={Position.Left} className="!bg-zinc-600 !w-1.5 !h-8 !rounded-full !-left-2 opacity-0 group-hover:opacity-100 transition-opacity border-none" />
            <Handle type="source" position={Position.Right} className="!bg-zinc-600 !w-1.5 !h-8 !rounded-full !-right-2 opacity-0 group-hover:opacity-100 transition-opacity border-none" />
        </div>
    );
}

export default memo(NoteNode);
