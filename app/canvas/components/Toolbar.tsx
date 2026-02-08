'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Youtube, Plus, Zap, LayoutGrid } from 'lucide-react';

interface ToolbarProps {
    onAddNode: (type: 'image' | 'video') => void;
}

function Toolbar({ onAddNode }: ToolbarProps) {
    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-full shadow-2xl shadow-black/20 ring-1 ring-white/5">

                {/* Brand */}
                <div className="flex items-center gap-2 pl-3 pr-4 border-r border-white/5 mr-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-white to-zinc-400 flex items-center justify-center shadow-lg shadow-white/10">
                        <span className="text-[10px] font-bold text-black tracking-tighter">Gr</span>
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-zinc-100">Grain</span>
                </div>

                {/* Node Buttons */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddNode('image')}
                    className="h-9 px-4 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Image
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddNode('video')}
                    className="h-9 px-4 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                >
                    <Youtube className="w-4 h-4 mr-2" />
                    Video
                </Button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <LayoutGrid className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default memo(Toolbar);
