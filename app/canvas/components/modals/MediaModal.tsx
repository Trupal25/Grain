'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    title?: string;
}

export function MediaModal({ isOpen, onClose, src, title }: MediaModalProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setIsZoomed(false);
        }
    }, [isOpen]);

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = (title || 'grain-export').replace(/\s+/g, '-').toLowerCase() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if fetch fails (CORS)
            const link = document.createElement('a');
            link.href = src;
            link.target = '_blank';
            link.click();
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-zoom-out"
                    />

                    {/* Toolbar */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-full z-[100000]"
                    >
                        {title && (
                            <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-r border-white/10">
                                {title}
                            </span>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/5"
                            onClick={() => setIsZoomed(!isZoomed)}
                        >
                            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/5"
                            onClick={handleDownload}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-white/10" />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/5"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>

                    {/* Image Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            transition: { type: 'spring', damping: 25, stiffness: 300 }
                        }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`relative z-0 flex items-center justify-center p-12 transition-all duration-300 ${isZoomed ? 'w-full h-full p-0' : 'max-w-[85vw] max-h-[85vh]'}`}
                    >
                        <img
                            src={src}
                            alt={title || 'Preview'}
                            className={`rounded-2xl shadow-2xl transition-all duration-500 select-none ${isZoomed ? 'w-full h-full object-contain rounded-none' : 'max-w-full max-h-full object-contain shadow-white/5 border border-white/5'}`}
                            onDoubleClick={() => setIsZoomed(!isZoomed)}
                        />
                    </motion.div>

                    {/* Bottom Status */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full"
                    >
                        <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            Press ESC to Close <span className="w-1 h-1 rounded-full bg-zinc-700" /> Double Click to Zoom
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
