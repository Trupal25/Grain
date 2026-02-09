'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Boxes,
    History,
    Scan,
    MessageSquare,
    HelpCircle,
    ImageIcon,
    Video,
    AlignLeft,
    MessageCircle,
    MousePointer2,
    Hand,
    Youtube,
    Trash2
} from 'lucide-react';

interface SidebarProps {
    onAddNode: (type: 'image' | 'video' | 'text' | 'chat' | 'youtube') => void;
    activeTool: 'pointer' | 'hand';
    onToolChange: (tool: 'pointer' | 'hand') => void;
    onDeleteSelected: () => void;
    hasSelection: boolean;
}

function Sidebar({ onAddNode, activeTool, onToolChange, onDeleteSelected, hasSelection }: SidebarProps) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-row gap-4 pointer-events-auto">
            {/* Main Floating Dock */}
            <div className="flex flex-row items-center gap-3 p-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-white/5">

                <div className="p-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10 transition-all hover:scale-105"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center" className="w-48 bg-[#1A1A1A] border-zinc-800 text-zinc-300 mb-2 p-1 rounded-xl shadow-2xl z-[70]">
                            <DropdownMenuLabel className="text-xs font-normal text-zinc-500 px-2 py-1.5">Add to Canvas</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => onAddNode('image')} className="text-sm focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2">
                                <ImageIcon className="w-4 h-4 mr-2 text-purple-400" />
                                Image Generation
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAddNode('video')} className="text-sm focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2">
                                <Video className="w-4 h-4 mr-2 text-blue-400" />
                                Video Scene
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAddNode('text')} className="text-sm focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2">
                                <AlignLeft className="w-4 h-4 mr-2 text-green-400" />
                                Text Prompt
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAddNode('chat')} className="text-sm focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2">
                                <MessageCircle className="w-4 h-4 mr-2 text-orange-400" />
                                AI Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAddNode('youtube')} className="text-sm focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2">
                                <Youtube className="w-4 h-4 mr-2 text-red-500" />
                                YouTube Embed
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="w-px h-8 bg-white/10 mx-1" />

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            activeTool === 'pointer' ? "bg-white text-black hover:bg-white" : "text-zinc-500 hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => onToolChange('pointer')}
                        title="Selection (V)"
                    >
                        <MousePointer2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            activeTool === 'hand' ? "bg-white text-black hover:bg-white" : "text-zinc-500 hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => onToolChange('hand')}
                        title="Hand (H)"
                    >
                        <Hand className="w-4 h-4" />
                    </Button>
                </div>

                <div className="w-px h-8 bg-white/10 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Clusters"
                >
                    <Boxes className="w-5 h-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    title="History"
                >
                    <History className="w-5 h-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Frame"
                >
                    <Scan className="w-5 h-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Comments"
                >
                    <MessageSquare className="w-5 h-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Help"
                >
                    <HelpCircle className="w-5 h-5" />
                </Button>




                {hasSelection && (
                    <>
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-full text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] border border-red-500/10"
                            title="Delete Selected"
                            onClick={onDeleteSelected}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </>
                )}
            </div>

            {/* User Avatar */}
            {/* <div className="flex items-center justify-center">
                <button className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium shadow-lg hover:ring-2 hover:ring-indigo-400 transition-all">
                    T
                </button>
            </div> */}
        </div>
    );
}

export default memo(Sidebar);
