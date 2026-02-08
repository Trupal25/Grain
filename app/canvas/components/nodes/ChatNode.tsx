'use client';

import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow, NodeResizer } from '@xyflow/react';
import { ChatNodeData, TEXT_MODELS, ChatMessage, TextModel } from '../../types';
import { useNodeInputs } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Send,
    Trash2,
    Copy,
    Check,
    Paperclip,
    RotateCcw,
    X,
    FileImage,
    Loader2,
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MIN_WIDTH = 400;
const MAX_WIDTH = 1000;
const MIN_HEIGHT = 450;
const MAX_HEIGHT = 1000;

function ChatNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as ChatNodeData;
    const { updateNodeData, deleteElements } = useReactFlow();
    const { getInputs } = useNodeInputs(id);

    const [messages, setMessages] = useState<ChatMessage[]>(nodeData.messages || []);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ url: string, name: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset textarea height when input is cleared
    useEffect(() => {
        if (input === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [input]);

    // Auto-scroll logic
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior
            });
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timeout);
    }, [messages, isProcessing]);

    useEffect(() => {
        updateNodeData(id, { messages, model: nodeData.model || 'gemini-2.0-flash-lite' });
    }, [messages, id, updateNodeData, nodeData.model]);

    const inputs = useMemo(() => getInputs(), [getInputs]);

    const handleSendMessage = async () => {
        if (!input.trim() && !attachedFile && inputs.texts.length === 0 && inputs.images.length === 0) return;
        if (isProcessing) return;

        let content = input.trim();

        // Add context from connected nodes if no local input is provided but connections exist
        if (!content && inputs.combinedText) {
            content = "Use the connected context to answer my questions.";
        }

        if (attachedFile) {
            content += `\n\n[Attachment: ${attachedFile.name}](${attachedFile.url})`;
        }

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setAttachedFile(null);
        setIsProcessing(true);

        try {
            const response = await fetch('/api/generate/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    model: nodeData.model || 'gemini-2.0-flash-lite',
                    attachments: [
                        ...(attachedFile ? [attachedFile.url] : []),
                        ...inputs.images,
                        ...inputs.videos,
                        ...inputs.youtube
                    ],
                    context: [
                        inputs.combinedText,
                        inputs.youtube.length > 0 ? `Attached YouTube Videos for context: ${inputs.youtube.join(', ')}` : ''
                    ].filter(Boolean).join('\n\n')
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response');
            }

            const dataRes = await response.json();
            const assistantMessage: ChatMessage = { role: 'assistant', content: dataRes.text };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Chat error:', err);
            const errorMsg = err instanceof Error && err.message.includes('429')
                ? 'Google Free Tier limit reached. Try again in a minute.'
                : (err instanceof Error ? err.message : 'Chat failed');
            toast.error(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                setAttachedFile({ url, name: file.name });
                toast.success('File attached');
            } else {
                toast.error('Upload failed');
            }
        } catch (error) {
            toast.error('Upload error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className="w-full h-full group relative flex flex-col font-sans selection:bg-zinc-800"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style jsx global>{`
                .chat-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.05) transparent;
                }
                .chat-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .chat-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .chat-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                /* Selection fix for code blocks */
                .prose pre {
                    background-color: rgba(24, 24, 27, 0.5) !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    border-radius: 12px !important;
                    padding: 1rem !important;
                }
                .prose code {
                    color: #e4e4e7 !important;
                    background: transparent !important;
                    padding: 0 !important;
                }
            `}</style>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                maxWidth={MAX_WIDTH}
                maxHeight={MAX_HEIGHT}
                isVisible={selected || isHovered}
                lineClassName="!border-zinc-800"
                handleClassName="!w-2.5 !h-2.5 !bg-zinc-700 !border-zinc-800 !rounded-full"
            />

            {/* Toolbar */}
            <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
                <div className="flex items-center gap-1.5 p-1 bg-zinc-950/90 backdrop-blur-xl border border-white/5 rounded-full shadow-2xl ring-1 ring-white/5">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-zinc-500 hover:text-white"
                        onClick={() => setMessages([])}
                        title="Reset Chat"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-white/10" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => deleteElements({ nodes: [{ id }] })}
                        title="Delete Node"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </NodeToolbar>

            {/* Main Node Body */}
            <div className={cn(
                "w-full h-full flex flex-col bg-[#0A0A0A] border transition-all duration-300 rounded-3xl overflow-hidden",
                selected ? "border-zinc-700 ring-4 ring-white/5" : "border-white/5 shadow-2xl"
            )}>
                {/* Grab Handle Header */}
                <div className="h-4 w-full flex items-center justify-center bg-black/40 border-b border-white/5 cursor-grab active:cursor-grabbing group/handle">
                    <div className="w-10 h-1 rounded-full bg-zinc-800 group-hover/handle:bg-zinc-700 transition-colors" />
                </div>

                {/* Chat Feed */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-8 chat-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(24,24,27,0.5),transparent)] nowheel nodrag"
                >
                    <AnimatePresence initial={false}>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                                <Bot className="w-12 h-12" />
                                <p className="text-xs font-mono tracking-widest uppercase">Awaiting Instructions</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex flex-col gap-2",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center gap-2 mb-1 px-1",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                        {msg.role === 'user' ? 'You' : 'Assistant'}
                                    </span>
                                </div>
                                <div className={cn(
                                    "max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-white text-black rounded-tr-sm"
                                        : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-sm"
                                )}>
                                    <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isProcessing && (
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-bounce" />
                            </div>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Generating</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Section */}
                <div className="p-4 bg-black/50 border-t border-white/5 backdrop-blur-sm nowheel nodrag">
                    {/* Connection Inputs Preview */}
                    <AnimatePresence>
                        {(inputs.images.length > 0 || inputs.texts.length > 0) && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2 overflow-x-auto pb-2 chat-scrollbar">
                                {inputs.images.map((img: string, idx: number) => (
                                    <div key={idx} className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 ring-2 ring-blue-500/20 shadow-lg">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-blue-500/10" />
                                        <div className="absolute bottom-0 right-0 p-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    </div>
                                ))}
                                {inputs.texts.length > 0 && (
                                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Connected Context</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Attachment Preview */}
                    <AnimatePresence>
                        {attachedFile && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-2"
                            >
                                <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-white/5 rounded-xl">
                                    <FileImage className="w-4 h-4 text-zinc-400" />
                                    <span className="text-xs text-zinc-300 truncate flex-1">{attachedFile.name}</span>
                                    <button onClick={() => setAttachedFile(null)} className="text-zinc-500 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-3 p-2 bg-zinc-900/50 border border-white/10 rounded-2xl focus-within:border-zinc-500 transition-all shadow-inner">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // Auto-grow
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="How can I help you?"
                            className="w-full bg-transparent border-none text-[14px] text-zinc-200 p-2 resize-none max-h-40 min-h-[44px] focus:ring-0 focus:outline-none placeholder:text-zinc-700"
                            rows={1}
                        />

                        <div className="flex items-center justify-between gap-2 px-1 pb-1">
                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                {/* Model Selector */}
                                <Select
                                    value={nodeData.model || 'gemini-2.0-flash-lite'}
                                    onValueChange={(v) => updateNodeData(id, { model: v as TextModel })}
                                >
                                    <SelectTrigger className="h-9 border-none bg-white/5 text-[11px] text-zinc-400 w-auto min-w-[140px] focus:ring-0 hover:bg-white/10 rounded-xl px-3 gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-zinc-800 text-zinc-400 rounded-xl">
                                        {TEXT_MODELS.map(m => (
                                            <SelectItem key={m.value} value={m.value} className="text-[11px] focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={(!input.trim() && !attachedFile) || isProcessing}
                                className={cn(
                                    "h-9 px-4 flex items-center justify-center rounded-xl font-bold text-xs tracking-wider transition-all duration-300",
                                    (input.trim() || attachedFile) && !isProcessing
                                        ? "bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                        : "bg-zinc-800 text-zinc-600 opacity-50"
                                )}
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Left} className="!w-2 !h-6 !bg-zinc-800 !border-none !rounded-none" />
            <Handle type="source" position={Position.Right} className="!w-2 !h-6 !bg-zinc-800 !border-none !rounded-none" />
        </div>
    );
}

export default memo(ChatNode);
