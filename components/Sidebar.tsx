'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
    Home,
    Search,
    Plus,
    FileText,
    Layout,
    Link2,
    ImageIcon,
    MoreHorizontal,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
    className?: string;
    onToggleTree?: () => void;
    isTreeVisible?: boolean;
}

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    active?: boolean;
    shortcut?: string;
    isCollapsed: boolean;
    onToggle?: () => void;
}

const NavItem = ({
    icon: Icon,
    label,
    onClick,
    active,
    shortcut,
    isCollapsed,
    onToggle
}: NavItemProps) => (
    <TooltipProvider>
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <button
                    onClick={() => {
                        if (active && onToggle) {
                            onToggle();
                        } else {
                            onClick();
                        }
                    }}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full",
                        active
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                    {!isCollapsed && (
                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-300">
                            {label}
                        </span>
                    )}
                </button>
            </TooltipTrigger>
            {isCollapsed && (
                <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-white">
                    <div className="flex items-center gap-2">
                        <span>{label}</span>
                        {shortcut && <span className="text-zinc-500 text-xs bg-zinc-800 px-1 rounded">{shortcut}</span>}
                    </div>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
);

export function Sidebar({ className, onToggleTree, isTreeVisible }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isCollapsed] = useState(true);

    const activeFilter = searchParams.get('filter');
    const isTrash = searchParams.get('view') === 'trash';

    const navigateTo = (path: string, params?: Record<string, string>) => {
        if (params) {
            const query = new URLSearchParams(params).toString();
            router.push(`${path}?${query}`);
            if (onToggleTree && isTreeVisible === false) onToggleTree();
        } else {
            router.push(path);
            if (onToggleTree && isTreeVisible === false) onToggleTree();
        }
    };

    const isActive = (filter?: string, view?: string) => {
        if (view === 'trash') return pathname === '/dashboard' && isTrash;

        if (filter === 'documents' && pathname.startsWith('/document/')) return true;
        if (filter === 'projects' && pathname.startsWith('/canvas')) return true;

        if (pathname !== '/dashboard') return false;
        if (filter) return activeFilter === filter;
        return !activeFilter && !isTrash;
    };

    return (
        <div
            className={cn(
                "flex flex-col bg-[#0A0A0A] border-r border-zinc-800 transition-all duration-300 ease-in-out sticky top-0 z-40 h-screen py-4 shrink-0",
                isCollapsed ? "w-[68px] px-3" : "w-60 px-4",
                className
            )}
        >


            {/* Logo area */}
            <div className={cn("mb-8 flex items-center", isCollapsed ? "justify-center" : "px-2")}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center shrink-0 shadow-lg shadow-white/5">
                    <div className="w-4 h-4 rounded-full bg-black/90" />
                </div>
                {!isCollapsed && (
                    <span className="ml-3 font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Grain
                    </span>
                )}
            </div>

            {/* Create Button */}
            <div className="mb-6">
                <button
                    onClick={() => navigateTo('/dashboard', { create: 'true' })}
                    className={cn(
                        "flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-all duration-200 rounded-xl font-medium shadow-lg shadow-white/5",
                        isCollapsed ? "w-10 h-10 justify-center p-0 mx-auto" : "w-full py-2.5 px-3"
                    )}
                >
                    <Plus className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>New Item</span>}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                <div className={cn("text-xs font-semibold text-zinc-600 mb-2 uppercase tracking-wider", isCollapsed ? "text-center" : "px-3")}>
                    {isCollapsed ? "—" : "Menu"}
                </div>

                <NavItem
                    icon={Home}
                    label="Home"
                    onClick={() => navigateTo('/dashboard')}
                    active={isActive()}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
                <NavItem
                    icon={Search}
                    label="Search"
                    onClick={() => navigateTo('/dashboard', { search: 'true' })}
                    shortcut="⌘K"
                    isCollapsed={isCollapsed}
                />
                <NavItem
                    icon={MessageSquare}
                    label="Assistant"
                    onClick={() => { }}
                    isCollapsed={isCollapsed}
                />

                <div className="h-px bg-zinc-800 my-3 mx-1" />

                <div className={cn("text-xs font-semibold text-zinc-600 mb-2 uppercase tracking-wider", isCollapsed ? "text-center" : "px-3")}>
                    {isCollapsed ? "—" : "Library"}
                </div>

                <NavItem
                    icon={FileText}
                    label="Notes"
                    onClick={() => navigateTo('/dashboard', { filter: 'documents' })}
                    active={isActive('documents')}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
                <NavItem
                    icon={ImageIcon}
                    label="Media"
                    onClick={() => navigateTo('/dashboard', { filter: 'files' })}
                    active={isActive('files')}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
                <NavItem
                    icon={Link2}
                    label="Links"
                    onClick={() => navigateTo('/dashboard', { filter: 'links' })}
                    active={isActive('links')}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
                <NavItem
                    icon={Layout}
                    label="Canvases"
                    onClick={() => navigateTo('/dashboard', { filter: 'projects' })}
                    active={isActive('projects')}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
            </div>

            {/* Bottom Section */}
            <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-1">
                <NavItem
                    icon={Trash2}
                    label="Trash"
                    onClick={() => navigateTo('/dashboard', { view: 'trash' })}
                    active={isActive(undefined, 'trash')}
                    isCollapsed={isCollapsed}
                    onToggle={onToggleTree}
                />
                <NavItem
                    icon={Settings}
                    label="Settings"
                    onClick={() => { }}
                    isCollapsed={isCollapsed}
                />

                <div className={cn("mt-4 flex items-center", isCollapsed ? "justify-center" : "px-1")}>
                    <UserButton afterSignOutUrl="/" appearance={{
                        elements: {
                            avatarBox: "w-8 h-8 rounded-xl"
                        }
                    }} />
                    {!isCollapsed && (
                        <div className="ml-3 flex flex-col">
                            <span className="text-sm font-medium text-white">Profile</span>
                            <span className="text-xs text-zinc-500">Manage account</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
