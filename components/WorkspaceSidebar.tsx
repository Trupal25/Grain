'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Home, Grid3X3, Plus, PanelLeft, Trash2, Star, MoreVertical, Edit2, Folder, PlusSquare, FilePlus, FolderPlus, StickyNote, NotebookPen } from 'lucide-react';
import { Folder as FolderType, Document as DocumentType, Project as ProjectType } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameModal } from '@/components/RenameModal';
import { CreateModal } from '@/components/CreateModal';
import { toast } from 'sonner';
import { useState } from 'react';

const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export type ItemType = 'folder' | 'document' | 'project' | 'link' | 'file';

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
    onRename?: (id: string, type: ItemType, currentName: string) => void;
    onDelete?: (id: string, type: ItemType) => void;
    onToggleStar?: (id: string, type: ItemType, currentStatus: boolean) => void;
    onMove?: (id: string, type: ItemType, targetFolderId: string | null) => void;
    onCreateItem?: (type: 'folder' | 'document' | 'project', docType: 'note' | 'canvas' | undefined, parentId: string | null) => void;
    activeItemId?: string | null;
    activeItemType?: ItemType | null;
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
    currentFolderId,
    onRename,
    onDelete,
    onToggleStar,
    onMove,
    onCreateItem,
    activeItemId,
    activeItemType
}: FolderTreeItemProps) {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeItemId === folder.id && activeItemType === 'folder';
    const children = allFolders.filter(f => f.parentFolderId === folder.id).sort(sortByName);
    const folderDocs = allDocuments.filter(d => d.folderId === folder.id);
    const folderProjects = allProjects.filter(p => p.folderId === folder.id);
    const folderFiles = [...folderDocs, ...folderProjects].sort(sortByName);
    const hasChildren = children.length > 0 || folderFiles.length > 0;

    return (
        <div className="flex flex-col">
            <div
                onClick={() => onSelectFolder(folder)}
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('application/grain/move-item', JSON.stringify({
                        id: folder.id,
                        type: 'folder'
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('bg-zinc-800/50');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('bg-zinc-800/50');
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-zinc-800/50');
                    const data = e.dataTransfer.getData('application/grain/move-item');
                    if (data) {
                        const { id, type } = JSON.parse(data);
                        if (id !== folder.id) {
                            onMove?.(id, type, folder.id);
                        }
                    }
                }}
                className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group cursor-pointer",
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
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Folder className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </div>
                <span className="truncate flex-1 text-left font-medium">{folder.name}</span>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all text-zinc-500 hover:text-white">
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-400">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateItem?.('document', 'note', folder.id); }} className="focus:bg-zinc-800 focus:text-white">
                            <NotebookPen className="w-3.5 h-3.5 mr-2" /> New Note
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateItem?.('document', 'canvas', folder.id); }} className="focus:bg-zinc-800 focus:text-white">
                            <StickyNote className="w-3.5 h-3.5 mr-2" /> New Canvas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateItem?.('folder', undefined, folder.id); }} className="focus:bg-zinc-800 focus:text-white">
                            <FolderPlus className="w-3.5 h-3.5 mr-2" /> New Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(folder.id, 'folder', folder.name); }} className="focus:bg-zinc-800 focus:text-white">
                            <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar?.(folder.id, 'folder', folder.isStarred || false); }} className="focus:bg-zinc-800 focus:text-white">
                            <Star className={cn("w-3.5 h-3.5 mr-2", folder.isStarred && "fill-yellow-400 text-yellow-400")} />
                            {folder.isStarred ? 'Unfavorite' : 'Favorite'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(folder.id, 'folder'); }} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                            onRename={onRename}
                            onDelete={onDelete}
                            onToggleStar={onToggleStar}
                            onMove={onMove}
                            onCreateItem={onCreateItem}
                            activeItemId={activeItemId}
                            activeItemType={activeItemType}
                        />
                    ))}
                    {folderFiles.map(file => {
                        const isDoc = 'type' in file && (file.type === 'canvas' || file.type === 'note');
                        if (isDoc) {
                            const doc = file as DocumentType;
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => onSelectDocument(doc)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group cursor-pointer",
                                        activeItemId === doc.id && activeItemType === 'document'
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    )}
                                    draggable
                                    onDragStart={(e) => {
                                        // For canvas drop
                                        e.dataTransfer.setData('application/reactflow/note', JSON.stringify({
                                            noteId: doc.id,
                                            title: doc.name,
                                            content: doc.content
                                        }));
                                        // For tree move
                                        e.dataTransfer.setData('application/grain/move-item', JSON.stringify({
                                            id: doc.id,
                                            type: 'document'
                                        }));
                                        e.dataTransfer.effectAllowed = 'copyMove';
                                    }}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {doc.type === 'canvas' ? (
                                            <StickyNote className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                        ) : (
                                            <NotebookPen className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                        )}
                                    </div>
                                    <span className="truncate flex-1 text-left font-medium">{doc.name}</span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all text-zinc-500 hover:text-white">
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-400">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(doc.id, 'document', doc.name); }} className="focus:bg-zinc-800 focus:text-white">
                                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar?.(doc.id, 'document', doc.isStarred || false); }} className="focus:bg-zinc-800 focus:text-white">
                                                <Star className={cn("w-3.5 h-3.5 mr-2", doc.isStarred && "fill-yellow-400 text-yellow-400")} />
                                                {doc.isStarred ? 'Unfavorite' : 'Favorite'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(doc.id, 'document'); }} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            );
                        } else {
                            const proj = file as ProjectType;
                            return (
                                <div
                                    key={proj.id}
                                    onClick={() => onSelectProject(proj)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group cursor-pointer",
                                        activeItemId === proj.id && activeItemType === 'project'
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    )}
                                    draggable
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.setData('application/grain/move-item', JSON.stringify({
                                            id: proj.id,
                                            type: 'project'
                                        }));
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <StickyNote className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                    </div>
                                    <span className="truncate flex-1 text-left font-medium">{proj.name}</span>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all text-zinc-500 hover:text-white">
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-400">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(proj.id, 'project', proj.name); }} className="focus:bg-zinc-800 focus:text-white">
                                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar?.(proj.id, 'project', proj.isStarred || false); }} className="focus:bg-zinc-800 focus:text-white">
                                                <Star className={cn("w-3.5 h-3.5 mr-2", proj.isStarred && "fill-yellow-400 text-yellow-400")} />
                                                {proj.isStarred ? 'Unfavorite' : 'Favorite'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(proj.id, 'project'); }} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
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
    activeItemId?: string | null;
    activeItemType?: ItemType | null;
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
    isStarredView,
    activeItemId,
    activeItemType,
    onRefresh
}: WorkspaceSidebarProps & { onRefresh?: () => void }) {
    const handleMove = async (id: string, type: ItemType, targetFolderId: string | null) => {
        try {
            const endpoint = type === 'folder'
                ? `/api/folders/${id}`
                : type === 'document'
                    ? `/api/documents/${id}`
                    : `/api/projects/${id}`;

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(type === 'folder' ? { parentFolderId: targetFolderId } : { folderId: targetFolderId })
                })
            });

            if (res.ok) {
                toast.success('Moved successfully');
                onRefresh?.();
            } else {
                toast.error('Failed to move item');
            }
        } catch (err) {
            toast.error('Error moving item');
        }
    };
    const [renameState, setRenameState] = useState<{ isOpen: boolean; id: string; name: string; type: 'folder' | 'document' | 'project' }>({
        isOpen: false,
        id: '',
        name: '',
        type: 'folder'
    });

    const [createState, setCreateState] = useState<{
        isOpen: boolean;
        type: 'folder' | 'document' | 'project';
        docType?: 'note' | 'canvas';
        parentId: string | null;
    }>({
        isOpen: false,
        type: 'folder',
        parentId: null
    });

    const handleRenameClick = (id: string, type: ItemType, currentName: string) => {
        // We only support renaming folders, documents, and projects in this modal
        if (type === 'folder' || type === 'document' || type === 'project') {
            setRenameState({ isOpen: true, id, name: currentName, type });
        }
    };

    const handleRenameSubmit = async (newName: string) => {
        try {
            const endpoint = renameState.type === 'folder'
                ? `/api/folders/${renameState.id}`
                : renameState.type === 'document'
                    ? `/api/documents/${renameState.id}`
                    : `/api/projects/${renameState.id}`;

            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                toast.success('Renamed successfully');
                onRefresh?.();
            } else {
                toast.error('Failed to rename');
            }
        } catch (err) {
            toast.error('Error during rename');
        }
    };

    const handleDeleteClick = async (id: string, type: ItemType) => {
        if (!confirm('Move to trash?')) return;
        try {
            const res = await fetch('/api/item', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type,
                    updates: { trashedAt: new Date() }
                })
            });

            if (res.ok) {
                toast.success('Moved to trash');
                onRefresh?.();
            }
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const handleToggleStar = async (id: string, type: ItemType, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/item', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type,
                    updates: { isStarred: !currentStatus }
                })
            });

            if (res.ok) {
                toast.success(!currentStatus ? 'Added to favorites' : 'Removed from favorites');
                onRefresh?.();
            }
        } catch (err) {
            toast.error('Failed to update favorite status');
        }
    };

    const handleCreateClick = (type: 'folder' | 'document' | 'project', docType?: 'note' | 'canvas', parentId: string | null = currentFolderId) => {
        setCreateState({ isOpen: true, type, docType, parentId });
    };

    const handleCreateSubmit = async (name: string) => {
        try {
            let endpoint = '';
            let body: any = { name, parentFolderId: createState.parentId };

            if (createState.type === 'folder') {
                endpoint = '/api/folders';
            } else if (createState.type === 'document') {
                endpoint = '/api/documents';
                body = { name, type: createState.docType, folderId: createState.parentId, content: '{}' };
            } else if (createState.type === 'project') {
                endpoint = '/api/projects';
                body = { name, folderId: createState.parentId };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Created ${createState.type}`);
                if (createState.type === 'folder') {
                    onSelectFolder?.(data.folder);
                } else if (createState.type === 'document') {
                    onSelectDocument?.(data.document);
                } else if (createState.type === 'project') {
                    onSelectProject?.(data.project);
                }
                onRefresh?.();
            } else {
                toast.error(`Failed to create ${createState.type}`);
            }
        } catch (err) {
            toast.error(`Error creating ${createState.type}`);
        }
    };

    const folderIds = new Set(allFolders.map(f => f.id));
    const openFiles = [
        ...allProjects.filter(p => !p.folderId || !folderIds.has(p.folderId)),
        ...allDocuments.filter(d => !d.folderId || !folderIds.has(d.folderId))
    ].sort(sortByName);

    return (
        <div
            className={cn(
                "flex flex-col bg-zinc-900/50 border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 overflow-hidden relative",
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
                <div className="mx-3 mt-4 p-3 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Tokens</div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="text-sm font-medium text-zinc-300">{credits}</span>
                    </div>
                </div>

                {/* Tree Structure */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Workspace Header */}
                    <div
                        className="flex items-center justify-between mb-2 px-2 mt-4 group/ws rounded-sm transition-colors overflow-hidden"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-zinc-800/50');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-zinc-800/50');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-zinc-800/50');
                            const data = e.dataTransfer.getData('application/grain/move-item');
                            if (data) {
                                const { id, type } = JSON.parse(data);
                                handleMove(id, type, null);
                            }
                        }}
                    >
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Workspace</span>
                        <div className="flex gap-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-zinc-800 rounded-sm text-zinc-500 hover:text-white transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-zinc-400 rounded-sm shadow-2xl">
                                    <DropdownMenuItem onClick={() => handleCreateClick('document', 'note')} className="focus:bg-zinc-800 focus:text-white py-2">
                                        <NotebookPen className="w-4 h-4 mr-2 text-zinc-500" /> New Note
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCreateClick('document', 'canvas')} className="focus:bg-zinc-800 focus:text-white py-2">
                                        <StickyNote className="w-4 h-4 mr-2 text-zinc-500" /> New Canvas
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem onClick={() => handleCreateClick('folder')} className="focus:bg-zinc-800 focus:text-white py-2">
                                        <FolderPlus className="w-4 h-4 mr-2 text-zinc-500" /> New Folder
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Home Button (All Files) */}
                    <button
                        onClick={onNavigateHome}
                        className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors mb-2",
                            activeItemId === null && !isStarredView && !isTrashView
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        )}
                    >
                        <Grid3X3 className="w-4 h-4 opacity-70" />
                        <span className="font-medium">All Files</span>
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
                                    onRename={handleRenameClick}
                                    onDelete={handleDeleteClick}
                                    onToggleStar={handleToggleStar}
                                    onMove={handleMove}
                                    onCreateItem={(type, docType, pId) => handleCreateClick(type, docType, pId)}
                                    activeItemId={activeItemId}
                                    activeItemType={activeItemType}
                                />
                            ))}
                        {openFiles.map((file) => {
                            const isDoc = 'type' in file && (file.type === 'canvas' || file.type === 'note');
                            if (isDoc) {
                                const doc = file as DocumentType;
                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => onSelectDocument(doc)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group pl-7 cursor-pointer",
                                            activeItemId === doc.id && activeItemType === 'document'
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        )}
                                        draggable
                                        onDragStart={(e) => {
                                            // For canvas drop
                                            e.dataTransfer.setData('application/reactflow/note', JSON.stringify({
                                                noteId: doc.id,
                                                title: doc.name,
                                                content: doc.content
                                            }));
                                            // For tree move
                                            e.dataTransfer.setData('application/grain/move-item', JSON.stringify({
                                                id: doc.id,
                                                type: 'document'
                                            }));
                                            e.dataTransfer.effectAllowed = 'copyMove';
                                        }}
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            {doc.type === 'canvas' ? (
                                                <StickyNote className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                            ) : (
                                                <NotebookPen className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                            )}
                                        </div>
                                        <span className="truncate flex-1 text-left font-medium">{doc.name}</span>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all text-zinc-500 hover:text-white">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-400">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameClick(doc.id, 'document', doc.name); }} className="focus:bg-zinc-800 focus:text-white">
                                                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStar(doc.id, 'document', doc.isStarred || false); }} className="focus:bg-zinc-800 focus:text-white">
                                                    <Star className={cn("w-3.5 h-3.5 mr-2", doc.isStarred && "fill-yellow-400 text-yellow-400")} />
                                                    {doc.isStarred ? 'Unfavorite' : 'Favorite'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc.id, 'document'); }} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                );
                            } else {
                                const proj = file as ProjectType;
                                return (
                                    <div
                                        key={proj.id}
                                        onClick={() => onSelectProject(proj)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group pl-7 cursor-pointer",
                                            activeItemId === proj.id && activeItemType === 'project'
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        )}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/grain/move-item', JSON.stringify({
                                                id: proj.id,
                                                type: 'project'
                                            }));
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            <StickyNote className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                        </div>
                                        <span className="truncate flex-1 text-left font-medium">{proj.name}</span>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all text-zinc-500 hover:text-white">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-400">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameClick(proj.id, 'project', proj.name); }} className="focus:bg-zinc-800 focus:text-white">
                                                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStar(proj.id, 'project', proj.isStarred || false); }} className="focus:bg-zinc-800 focus:text-white">
                                                    <Star className={cn("w-3.5 h-3.5 mr-2", proj.isStarred && "fill-yellow-400 text-yellow-400")} />
                                                    {proj.isStarred ? 'Unfavorite' : 'Favorite'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(proj.id, 'project'); }} className="text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                );
                            }
                        })
                        }
                    </div>
                </div>

                {/* Favorites & Trash */}
                <div className="p-2 border-t border-zinc-800">
                    <div className="space-y-0.5">
                        {onNavigateFavorites && (
                            <button
                                onClick={onNavigateFavorites}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors mb-1",
                                    isStarredView ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Star className="w-4 h-4 opacity-70" />
                                <span className="font-medium">Favorites</span>
                            </button>
                        )}
                        {onNavigateTrash && (
                            <button
                                onClick={onNavigateTrash}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors",
                                    isTrashView ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Trash2 className="w-4 h-4 opacity-70" />
                                <span className="font-medium">Trash</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <RenameModal
                isOpen={renameState.isOpen}
                onClose={() => setRenameState({ ...renameState, isOpen: false })}
                onRename={handleRenameSubmit}
                initialName={renameState.name}
                type={renameState.type}
            />

            <CreateModal
                isOpen={createState.isOpen}
                onClose={() => setCreateState({ ...createState, isOpen: false })}
                onCreate={handleCreateSubmit}
                type={createState.type}
                docType={createState.docType}
            />
        </div>
    );
}
