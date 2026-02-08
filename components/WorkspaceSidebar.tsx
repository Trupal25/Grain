'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Home, Grid3X3, Layers, Plus, PanelLeft, Trash2, Star, FileText, Layout } from 'lucide-react';
import { Folder as FolderType, Document as DocumentType, Project as ProjectType } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

interface FolderTreeItemProps {
    folder: FolderType;
    allFolders: FolderType[];
    allDocuments: DocumentType[];
    allProjects: ProjectType[];
    expandedFolders: Set<string>;
    toggleFolderExpand: (e: React.MouseEvent, folderId: string) => void;
    onSelectFolder: (folder: FolderType) => void;
    onSelectDocument: (document: DocumentType) => void;
    onSelectProject: (project: ProjectType) => void;
    currentFolderId: string | null;
}

function FolderTreeItem({
    folder,
    allFolders,
    allDocuments,
    allProjects,
    expandedFolders,
    toggleFolderExpand,
    onSelectFolder,
    onSelectDocument,
    onSelectProject,
    currentFolderId
}: FolderTreeItemProps) {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const children = allFolders.filter(f => f.parentFolderId === folder.id).sort(sortByName);
    const folderDocs = allDocuments.filter(d => d.folderId === folder.id);
    const folderProjects = allProjects.filter(p => p.folderId === folder.id);
    const folderFiles = [...folderDocs, ...folderProjects].sort(sortByName);
    const hasChildren = children.length > 0 || folderFiles.length > 0;

    return (
        <div className="flex flex-col">
            <button
                onClick={() => onSelectFolder(folder)}
                className={cn(
                    "w-full flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition-colors group",
                    isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                )}
            >
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFolderExpand(e, folder.id);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )
                    ) : (
                        <div className="w-3 h-3" />
                    )}
                </div>
                <span className="text-base leading-none">{folder.icon || '📁'}</span>
                <span className="truncate flex-1 text-left">{folder.name}</span>
            </button>
            {isExpanded && hasChildren && (
                <div className="ml-4 pl-2 border-l border-zinc-800 mt-0.5 space-y-0.5">
                    {children.map(child => (
                        <FolderTreeItem
                            key={child.id}
                            folder={child}
                            allFolders={allFolders}
                            allDocuments={allDocuments}
                            allProjects={allProjects}
                            expandedFolders={expandedFolders}
                            toggleFolderExpand={toggleFolderExpand}
                            onSelectFolder={onSelectFolder}
                            onSelectDocument={onSelectDocument}
                            onSelectProject={onSelectProject}
                            currentFolderId={currentFolderId}
                        />
                    ))}
                    {folderFiles.map(file => {
                        const isDoc = 'type' in file && (file.type === 'canvas' || file.type === 'note');
                        if (isDoc) {
                            const doc = file as DocumentType;
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => onSelectDocument(doc)}
                                    className="w-full flex items-center gap-2 px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/reactflow/note', JSON.stringify({
                                            noteId: doc.id,
                                            title: doc.name,
                                            content: doc.content
                                        }));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <span className="truncate flex-1 text-left">{doc.name}</span>
                                </button>
                            );
                        } else {
                            const proj = file as ProjectType;
                            return (
                                <button
                                    key={proj.id}
                                    onClick={() => onSelectProject(proj)}
                                    className="w-full flex items-center gap-2 px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <Layout className="w-3.5 h-3.5 text-purple-400" />
                                    </div>
                                    <span className="truncate flex-1 text-left">{proj.name}</span>
                                </button>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
}

interface WorkspaceSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    allFolders: FolderType[];
    allDocuments: DocumentType[];
    allProjects: ProjectType[];
    credits: number;
    currentFolderId: string | null;
    onSelectFolder: (folder: FolderType) => void;
    onSelectDocument: (document: DocumentType) => void;
    onSelectProject: (project: ProjectType) => void;
    onNavigateHome: () => void;
    onNavigateTrash?: () => void;
    onNavigateFavorites?: () => void;
    expandedFolders: Set<string>;
    toggleFolderExpand: (e: React.MouseEvent, folderId: string) => void;
    className?: string;
    isTrashView?: boolean;
    isStarredView?: boolean;
}

export function WorkspaceSidebar({
    isCollapsed,
    onToggleCollapse,
    allFolders,
    allDocuments,
    allProjects,
    credits,
    currentFolderId,
    onSelectFolder,
    onSelectDocument,
    onSelectProject,
    onNavigateHome,
    onNavigateTrash,
    onNavigateFavorites,
    expandedFolders,
    toggleFolderExpand,
    className,
    isTrashView,
    isStarredView
}: WorkspaceSidebarProps) {
    return (
        <div
            className={cn(
                "flex flex-col bg-zinc-900/50 border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
                isCollapsed ? "w-0 opacity-0 border-none" : "w-56 opacity-100",
                className
            )}
        >
            <div className="w-56 flex flex-col h-full bg-zinc-900/50">
                {/* Sidebar Header */}
                <div className="p-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            G
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white">GRAIN</span>
                        <div className="ml-auto flex items-center gap-1">
                            <button
                                onClick={onToggleCollapse}
                                className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white"
                                title="Toggle Sidebar"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Credits Display */}
                <div className="mx-3 mt-4 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Credits</div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
                        <span className="text-sm font-semibold text-white">{credits} tokens</span>
                    </div>
                </div>

                {/* Tree Structure */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Workspace Header */}
                    <div className="flex items-center justify-between mb-2 px-2 mt-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Workspace</span>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Home Button */}
                    <button
                        onClick={onNavigateHome}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors mb-2"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>

                    {/* Tree Contents */}
                    <div className="space-y-0.5">
                        {allFolders
                            .filter(f => !f.parentFolderId)
                            .sort(sortByName)
                            .map(folder => (
                                <FolderTreeItem
                                    key={folder.id}
                                    folder={folder}
                                    allFolders={allFolders}
                                    allDocuments={allDocuments}
                                    allProjects={allProjects}
                                    expandedFolders={expandedFolders}
                                    toggleFolderExpand={toggleFolderExpand}
                                    onSelectFolder={onSelectFolder}
                                    onSelectDocument={onSelectDocument}
                                    onSelectProject={onSelectProject}
                                    currentFolderId={currentFolderId}
                                />
                            ))}
                        {[
                            ...allProjects.filter(p => !p.folderId),
                            ...allDocuments.filter(d => !d.folderId)
                        ].sort(sortByName).map((file) => {
                            const isDoc = 'type' in file && (file.type === 'canvas' || file.type === 'note');
                            if (isDoc) {
                                const doc = file as DocumentType;
                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => onSelectDocument(doc)}
                                        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group pl-7"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/reactflow/note', JSON.stringify({
                                                noteId: doc.id,
                                                title: doc.name,
                                                content: doc.content
                                            }));
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                    >
                                        <FileText className="w-3.5 h-3.5 text-blue-400/80" />
                                        <span className="truncate flex-1 text-left">{doc.name}</span>
                                    </button>
                                );
                            } else {
                                const proj = file as ProjectType;
                                return (
                                    <button
                                        key={proj.id}
                                        onClick={() => onSelectProject(proj)}
                                        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group pl-7"
                                    >
                                        <Layout className="w-3.5 h-3.5 text-purple-400/80" />
                                        <span className="truncate flex-1 text-left">{proj.name}</span>
                                    </button>
                                );
                            }
                        })}
                    </div>
                </div>

                {/* Favorites & Trash */}
                <div className="p-2 border-t border-zinc-800">
                    <div className="space-y-0.5">
                        {onNavigateFavorites && (
                            <button
                                onClick={onNavigateFavorites}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors mb-1",
                                    isStarredView ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Star className="w-4 h-4" />
                                <span>Favorites</span>
                            </button>
                        )}
                        {onNavigateTrash && (
                            <button
                                onClick={onNavigateTrash}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors",
                                    isTrashView ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Trash</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
