'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import {
    Folder,
    FileText,
    Layout,
    Plus,
    Search,
    MoreHorizontal,
    Trash2,
    Clock,
    Home,
    Loader2,
    ChevronRight,
    ChevronDown,
    Link2,
    Upload,
    MessageSquare,
    Image as ImageIcon,
    Grid3X3,
    Layers,
    ArrowLeft,
    FolderPlus,
    LayoutGrid,
    List,
    ExternalLink,
    RotateCcw,
    X,
    Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CreateItemModal } from '@/components/CreateItemModal';
import { toast } from 'sonner';
import { useRef } from 'react';
import type { Folder as FolderType, Project, Document, Link, File as FileType } from '@/lib/db/schema';

interface BreadcrumbData {
    id: string | null;
    name: string;
    type?: 'home' | 'trash' | 'favorites' | 'folder';
}

type ViewMode = 'grid' | 'list';
type CreateMode = 'note' | 'canvas' | 'link' | 'upload';

interface FolderTreeItemProps {
    folder: FolderType;
    allFolders: FolderType[];
    expandedFolders: Set<string>;
    toggleFolderExpand: (e: React.MouseEvent, folderId: string) => void;
    openFolder: (folder: FolderType) => void;
    currentFolderId: string | null;
}

function FolderTreeItem({ folder, allFolders, expandedFolders, toggleFolderExpand, openFolder, currentFolderId }: FolderTreeItemProps) {
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const children = allFolders.filter(f => f.parentFolderId === folder.id);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => openFolder(folder)}
                className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded-lg transition-colors group ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFolderExpand(e, folder.id);
                    }}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
                >
                    {children.length > 0 ? (
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
            {isExpanded && children.length > 0 && (
                <div className="ml-4 pl-2 border-l border-zinc-800 mt-0.5 space-y-0.5">
                    {children.map(child => (
                        <FolderTreeItem
                            key={child.id}
                            folder={child}
                            allFolders={allFolders}
                            expandedFolders={expandedFolders}
                            toggleFolderExpand={toggleFolderExpand}
                            openFolder={openFolder}
                            currentFolderId={currentFolderId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ItemActionsProps {
    id: string;
    type: 'folder' | 'project' | 'document' | 'link' | 'file';
    isStarred: boolean;
    isTrashView: boolean;
    onToggleStar: (id: string, type: 'folder' | 'project' | 'document' | 'link' | 'file', current: boolean) => void;
    onMoveToTrash: (id: string, type: string) => void;
    onRestore: (id: string, type: string) => void;
    onDeleteForever: (id: string, type: string) => void;
}

function ItemActions({ id, type, isStarred, isTrashView, onToggleStar, onMoveToTrash, onRestore, onDeleteForever }: ItemActionsProps) {
    if (isTrashView) {
        return (
            <div className="flex gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRestore(id, type); }}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white shadow-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteForever(id, type); }}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-red-400 hover:text-red-300 shadow-sm transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-1">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleStar(id, type, isStarred); }}
                className={`p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md shadow-sm transition-colors ${isStarred ? 'text-yellow-400' : 'text-zinc-400 hover:text-white'}`}
            >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onMoveToTrash(id, type); }}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white shadow-sm transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function DashboardPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [files, setFiles] = useState<FileType[]>([]);
    const [allFolders, setAllFolders] = useState<FolderType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbData[]>([{ id: null, name: 'Home', type: 'home' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const [isTrashView, setIsTrashView] = useState(false);
    const [isStarredView, setIsStarredView] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'documents' | 'projects' | 'links' | 'files'>('all');
    const [credits, setCredits] = useState<number>(0);

    // Modal states
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [canvasModalOpen, setCanvasModalOpen] = useState(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);

    const isSearchActive = searchQuery.length > 0;

    // Fetch folder contents
    const fetchFolderContents = useCallback(async (folderId: string | null) => {
        setIsLoading(true);
        try {
            let url = '/api/folders';
            const params = new URLSearchParams();

            if (isTrashView) {
                params.append('trash', 'true');
            } else if (isStarredView) {
                params.append('starred', 'true');
            } else if (folderId) {
                params.append('parentId', folderId);
            }

            if (isTrashView || isStarredView || folderId) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setFolders(data.folders || []);
                setProjects(data.projects || []);
                setDocuments(data.documents || []);
                setLinks(data.links || []);
                setFiles(data.files || []);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to fetch:', error);
        }
        setIsLoading(false);
    }, [isTrashView, isStarredView]); // Fixed dependency array

    const fetchTree = useCallback(async () => {
        try {
            const res = await fetch('/api/folders?all=true');
            if (res.ok) {
                const data = await res.json();
                setAllFolders(data.folders || []);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to fetch tree:', error);
        }
    }, []);

    const fetchCredits = useCallback(async () => {
        try {
            const res = await fetch('/api/credits');
            if (res.ok) {
                const data = await res.json();
                setCredits(data.credits || 0);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to fetch credits:', error);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && user) {
            fetchFolderContents(currentFolderId);
            fetchTree();
            fetchCredits();
        }
    }, [isLoaded, user, currentFolderId, isTrashView, isStarredView, fetchFolderContents, fetchTree, fetchCredits]);

    // Navigate into folder
    const openFolder = (folder: FolderType) => {
        if (isTrashView) return; // Prevent opening trashed folders

        if (isStarredView) {
            setIsStarredView(false);
        }

        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name, type: 'folder' }]);
    };

    // Navigate via breadcrumb
    const navigateToBreadcrumb = (index: number) => {
        const item = breadcrumbs[index];
        setCurrentFolderId(item.id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        setActiveFilter('all'); // Reset filter when navigating

        if (item.type === 'home') { setIsTrashView(false); setIsStarredView(false); }
        if (item.type === 'trash') { setIsTrashView(true); setIsStarredView(false); }
        if (item.type === 'favorites') { setIsStarredView(true); setIsTrashView(false); }
    };

    const toggleStar = async (id: string, type: 'folder' | 'project' | 'document' | 'link' | 'file', currentStatus: boolean) => {
        try {
            const res = await fetch('/api/item', {
                method: 'PATCH',
                body: JSON.stringify({ id, type, updates: { isStarred: !currentStatus } }),
            });
            if (res.ok) {
                fetchFolderContents(currentFolderId);
                toast.success(currentStatus ? 'Removed from favorites' : 'Added to favorites');
            }
        } catch (err) {
            console.error('Toggle Star Error', err);
            toast.error('Failed to update favorite status');
        }
    };

    // Toggle folder expansion in tree
    const toggleFolderExpand = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Open project/canvas
    const openProject = (projectId: string) => {
        router.push(`/canvas?project=${projectId}`);
    };

    // Open document/note
    const openDocument = (documentId: string) => {
        router.push(`/document/${documentId}`);
    };

    // Create new folder
    const createFolder = async (name: string) => {
        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    parentFolderId: currentFolderId,
                }),
            });
            if (res.ok) {
                fetchFolderContents(currentFolderId);
                fetchTree();
                toast.success(`Folder "${name}" created`);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to create folder:', error);
            toast.error('Failed to create folder');
        }
    };

    // Create new canvas (project)
    const createCanvas = async (name: string) => {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    folderId: currentFolderId,
                }),
            });
            if (res.ok) {
                const { project } = await res.json();
                toast.success(`Canvas "${name}" created`);
                router.push(`/canvas?project=${project.id}`);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to create canvas:', error);
            toast.error('Failed to create canvas');
        }
    };

    // Create new document
    const createDocument = async (name: string) => {
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    type: 'note',
                    folderId: currentFolderId,
                }),
            });
            if (res.ok) {
                const { document } = await res.json();
                toast.success(`Note "${name}" created`);
                router.push(`/document/${document.id}`);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to create document:', error);
            toast.error('Failed to create note');
        }
    };

    // Create new link
    const createLink = async (name: string, url?: string) => {
        if (!url) return;
        try {
            const res = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    title: name,
                    folderId: currentFolderId,
                }),
            });
            if (res.ok) {
                fetchFolderContents(currentFolderId);
                toast.success(`Link "${name}" saved`);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to create link:', error);
            toast.error('Failed to save link');
        }
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
            formData.append('folderId', currentFolderId);
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                fetchFolderContents(currentFolderId);
                toast.success(`File "${file.name}" uploaded`);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to upload file:', error);
            toast.error('Failed to upload file');
        }
    };

    const moveToTrash = async (id: string, type: string) => {
        try {
            await fetch('/api/item', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type,
                    updates: { trashedAt: new Date() }
                })
            });
            fetchFolderContents(currentFolderId);
            toast.success('Moved to trash');
        } catch (error) {
            console.error('Failed to move to trash:', error);
            toast.error('Failed to move to trash');
        }
    };

    const restoreItem = async (id: string, type: string) => {
        try {
            await fetch('/api/item', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    type,
                    updates: { trashedAt: null }
                })
            });
            fetchFolderContents(currentFolderId);
            toast.success('Item restored');
        } catch (error) {
            console.error('Failed to restore:', error);
            toast.error('Failed to restore item');
        }
    };

    const deleteForever = async (id: string, type: string) => {
        if (!confirm('Are you sure you want to permanently delete this item?')) return;
        try {
            await fetch(`/api/item?id=${id}&type=${type}`, {
                method: 'DELETE'
            });
            fetchFolderContents(currentFolderId);
            toast.success('Item permanently deleted');
        } catch (error) {
            console.error('Failed to delete forever:', error);
            toast.error('Failed to delete item');
        }
    };

    // Handle create mode button click
    const handleCreateClick = (mode: CreateMode) => {
        if (mode === 'note') {
            setNoteModalOpen(true);
        } else if (mode === 'canvas') {
            setCanvasModalOpen(true);
        } else if (mode === 'link') {
            setLinkModalOpen(true);
        } else if (mode === 'upload') {
            fileInputRef.current?.click();
        }
    };

    if (!isLoaded) {
        return (
            <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    const filteredFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredDocuments = documents.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredLinks = links.filter(l =>
        (l.title || l.url).toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasItems = filteredFolders.length > 0 || filteredProjects.length > 0 || filteredDocuments.length > 0 || filteredLinks.length > 0 || filteredFiles.length > 0;
    const currentFolder = breadcrumbs[breadcrumbs.length - 1];

    // Filter by type if activeFilter is not 'all'
    const displayFolders = activeFilter === 'all' ? filteredFolders : [];
    const displayProjects = (activeFilter === 'all' || activeFilter === 'projects') ? filteredProjects : [];
    const displayDocuments = (activeFilter === 'all' || activeFilter === 'documents') ? filteredDocuments : [];
    const displayLinks = (activeFilter === 'all' || activeFilter === 'links') ? filteredLinks : [];
    const displayFiles = (activeFilter === 'all' || activeFilter === 'files') ? filteredFiles : [];

    const hasDisplayItems = displayFolders.length > 0 || displayProjects.length > 0 || displayDocuments.length > 0 || displayLinks.length > 0 || displayFiles.length > 0;

    return (
        <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />
            {/* Left Icon Sidebar */}
            <div className="w-14 flex flex-col items-center py-4 bg-zinc-900 border-r border-zinc-800">
                {/* New Button */}
                <button
                    onClick={() => setNoteModalOpen(true)}
                    className="w-10 h-10 rounded-xl bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center mb-4 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>

                <div className="w-8 h-px bg-zinc-700 mb-4" />

                {/* Navigation Icons */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => {
                            const searchInput = document.querySelector('input[placeholder="Search anything..."]') as HTMLInputElement;
                            searchInput?.focus();
                        }}
                        className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setCurrentFolderId(null);
                            setBreadcrumbs([{ id: null, name: 'Home', type: 'home' }]);
                            setIsTrashView(false);
                            setIsStarredView(false);
                            setActiveFilter('all');
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${currentFolderId === null && !isTrashView && !isStarredView && activeFilter === 'all' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                        <Home className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setActiveFilter('documents')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'documents' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        title="Notes"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setActiveFilter('files')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'files' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        title="Media"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setActiveFilter('links')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'links' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        title="Links"
                    >
                        <Link2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setActiveFilter('projects')}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'projects' ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        title="Canvases"
                    >
                        <Layout className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1" />

                {/* Bottom Icons */}
                <div className="flex flex-col gap-2">
                    <button className="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setIsTrashView(true);
                            setIsStarredView(false);
                            setCurrentFolderId(null);
                            setBreadcrumbs([{ id: null, name: 'Trash' }]);
                            setSearchQuery('');
                            setActiveFilter('all');
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isTrashView ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        title="Trash"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-8 h-px bg-zinc-700 my-4" />

                {/* User */}
                <UserButton afterSignOutUrl="/" />
            </div>

            {/* Tree Sidebar */}
            <div className="w-56 flex flex-col bg-zinc-900/50 border-r border-zinc-800">
                {/* Sidebar Header */}
                <div className="p-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            G
                        </div>
                        <span className="font-bold text-sm tracking-tight">GRAIN</span>
                        <div className="ml-auto flex items-center gap-1">
                            <button className="p-1 hover:bg-zinc-800 rounded transition-colors" title="Grid View">
                                <Grid3X3 className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                            <button className="p-1 hover:bg-zinc-800 rounded transition-colors" title="Graph View">
                                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Credits Display */}
                <div className="mx-3 mt-4 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Credits</div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
                        <span className="text-sm font-semibold">{credits} tokens</span>
                    </div>
                </div>

                {/* Tree Structure */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Workspace */}
                    <button
                        onClick={() => { setCurrentFolderId(null); setBreadcrumbs([{ id: null, name: 'Home' }]); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors mb-2"
                    >
                        <Home className="w-4 h-4" />
                        <span>Workspace</span>
                    </button>

                    {/* Folders Tree */}
                    <div className="space-y-0.5">
                        {allFolders
                            .filter(f => !f.parentFolderId)
                            .map(folder => (
                                <FolderTreeItem
                                    key={folder.id}
                                    folder={folder}
                                    allFolders={allFolders}
                                    expandedFolders={expandedFolders}
                                    toggleFolderExpand={toggleFolderExpand}
                                    openFolder={openFolder}
                                    currentFolderId={currentFolderId}
                                />
                            ))}
                    </div>
                </div>

                {/* Favorites & Trash */}
                <div className="p-2 border-t border-zinc-800">
                    <button
                        onClick={() => {
                            setIsStarredView(true);
                            setIsTrashView(false);
                            setCurrentFolderId(null);
                            setBreadcrumbs([{ id: null, name: 'Favorites', type: 'favorites' }]);
                            setSearchQuery('');
                            setActiveFilter('all');
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors mb-1 ${isStarredView
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        <Star className="w-4 h-4" />
                        <span>Favorites</span>
                    </button>
                    <button
                        onClick={() => {
                            setIsTrashView(true);
                            setIsStarredView(false);
                            setCurrentFolderId(null);
                            setBreadcrumbs([{ id: null, name: 'Trash', type: 'trash' }]);
                            setSearchQuery('');
                            setActiveFilter('all');
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors ${isTrashView
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Trash</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
                {/* Header */}
                <header className="h-12 flex items-center gap-3 px-4 border-b border-zinc-800">
                    {/* Back button */}
                    {breadcrumbs.length > 1 && (
                        <button
                            onClick={() => navigateToBreadcrumb(breadcrumbs.length - 2)}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}

                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => (
                                <React.Fragment key={item.id || 'root'}>
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {index === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage className="flex items-center gap-1.5 text-white">
                                                {index === 0 && <Home className="w-4 h-4" />}
                                                {item.name}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink
                                                onClick={() => navigateToBreadcrumb(index)}
                                                className="flex items-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer"
                                            >
                                                {index === 0 && <Home className="w-4 h-4" />}
                                                {item.name}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto py-6 px-6">
                        {/* Search Bar */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm text-white flex items-center gap-2">
                                <Home className="w-4 h-4 text-zinc-400" />
                                {currentFolder.name}
                            </div>
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    placeholder="Search anything..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none text-lg placeholder:text-zinc-600 focus-visible:ring-0 h-10"
                                />
                            </div>
                        </div>

                        {/* Quick Create Buttons */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <button
                                onClick={() => setNoteModalOpen(true)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleCreateClick('note')}
                                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors border bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <FileText className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium">Note</span>
                            </button>
                            <button
                                onClick={() => handleCreateClick('canvas')}
                                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors border bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <Layout className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium">Canvas</span>
                            </button>
                            <button
                                onClick={() => handleCreateClick('link')}
                                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors border bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <Link2 className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium">Link</span>
                            </button>
                            <button
                                onClick={() => handleCreateClick('upload')}
                                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors border bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            >
                                <Upload className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm font-medium">Upload</span>
                            </button>
                        </div>

                        {/* Sort and View Controls */}
                        <div className="flex items-center justify-between mb-4">
                            <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                                <Clock className="w-4 h-4" />
                                <span>Date added</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <Button
                                    onClick={() => setFolderModalOpen(true)}
                                    size="sm"
                                    variant="ghost"
                                    className="bg-zinc-700 hover:bg-zinc-600 text-white ml-2"
                                >
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Folder
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                            </div>
                        ) : !hasDisplayItems ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <h3 className="text-xl font-semibold mb-2">
                                    {activeFilter === 'all' ? 'Your garden is empty' : `No ${activeFilter} found`}
                                </h3>
                                <p className="text-zinc-500 mb-6">
                                    {isSearchActive ? "Try a different search term" : "Start planting seeds in your digital garden."}
                                </p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <>
                                {/* Folders Row */}
                                {displayFolders.length > 0 && (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 mb-6">
                                        {displayFolders.map((folder) => (
                                            <div
                                                key={folder.id}
                                                onClick={() => openFolder(folder)}
                                                className="group relative flex flex-col items-center p-4 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
                                            >
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <ItemActions
                                                        id={folder.id}
                                                        type="folder"
                                                        isStarred={folder.isStarred || false}
                                                        isTrashView={isTrashView}
                                                        onToggleStar={toggleStar}
                                                        onMoveToTrash={moveToTrash}
                                                        onRestore={restoreItem}
                                                        onDeleteForever={deleteForever}
                                                    />
                                                </div>
                                                <div className="w-16 h-14 bg-zinc-800 rounded-lg mb-2 flex items-center justify-center text-2xl">
                                                    📁
                                                </div>
                                                <span className="text-sm text-center truncate w-full">{folder.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Items Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {/* Canvases */}
                                    {displayProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            onClick={() => openProject(project.id)}
                                            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <ItemActions
                                                    id={project.id}
                                                    type="project"
                                                    isStarred={project.isStarred || false}
                                                    isTrashView={isTrashView}
                                                    onToggleStar={toggleStar}
                                                    onMoveToTrash={moveToTrash}
                                                    onRestore={restoreItem}
                                                    onDeleteForever={deleteForever}
                                                />
                                            </div>
                                            {/* Canvas Preview - Dotted Pattern */}
                                            <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20"
                                                    style={{
                                                        backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
                                                        backgroundSize: '12px 12px'
                                                    }}
                                                />
                                            </div>
                                            <div className="p-3 flex items-center gap-2">
                                                <Layout className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm truncate">{project.name}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Documents */}
                                    {displayDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => openDocument(doc.id)}
                                            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <ItemActions
                                                    id={doc.id}
                                                    type="document"
                                                    isStarred={doc.isStarred || false}
                                                    isTrashView={isTrashView}
                                                    onToggleStar={toggleStar}
                                                    onMoveToTrash={moveToTrash}
                                                    onRestore={restoreItem}
                                                    onDeleteForever={deleteForever}
                                                />
                                            </div>
                                            {/* Note Preview */}
                                            <div className="aspect-[4/3] bg-zinc-900 p-4">
                                                <p className="text-lg font-medium mb-2">{doc.name}</p>
                                                <p className="text-sm text-zinc-500 line-clamp-3">
                                                    Click to edit this note...
                                                </p>
                                            </div>
                                            <div className="p-3 flex items-center gap-2 border-t border-zinc-800">
                                                <FileText className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm truncate">{doc.name}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Links */}
                                    {displayLinks.map((link) => (
                                        <div
                                            key={link.id}
                                            onClick={() => window.open(link.url, '_blank')}
                                            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <ItemActions
                                                    id={link.id}
                                                    type="link"
                                                    isStarred={link.isStarred || false}
                                                    isTrashView={isTrashView}
                                                    onToggleStar={toggleStar}
                                                    onMoveToTrash={moveToTrash}
                                                    onRestore={restoreItem}
                                                    onDeleteForever={deleteForever}
                                                />
                                            </div>
                                            {/* Link Preview */}
                                            <div className="aspect-[4/3] bg-zinc-900 p-4 flex flex-col justify-center items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <Link2 className="w-6 h-6 text-green-400" />
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-2 text-center break-all px-4">
                                                    {link.url}
                                                </p>
                                            </div>
                                            <div className="p-3 flex items-center gap-2 border-t border-zinc-800">
                                                <Link2 className="w-4 h-4 text-green-400" />
                                                <span className="text-sm truncate">{link.title || link.url}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Files */}
                                    {displayFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => window.open(file.url, '_blank')}
                                            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <ItemActions
                                                    id={file.id}
                                                    type="file"
                                                    isStarred={file.isStarred || false}
                                                    isTrashView={isTrashView}
                                                    onToggleStar={toggleStar}
                                                    onMoveToTrash={moveToTrash}
                                                    onRestore={restoreItem}
                                                    onDeleteForever={deleteForever}
                                                />
                                            </div>
                                            <div className="aspect-[4/3] bg-zinc-900 p-4 flex flex-col justify-center items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-orange-400" />
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-2 text-center break-all px-4">
                                                    {file.name}
                                                </p>
                                            </div>
                                            <div className="p-3 flex items-center gap-2 border-t border-zinc-800">
                                                <FileText className="w-4 h-4 text-orange-400" />
                                                <span className="text-sm truncate">{file.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* List View */
                            <div className="space-y-1">
                                {/* Folders */}
                                {displayFolders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        role="button"
                                        onClick={() => openFolder(folder)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 rounded-xl transition-colors group text-left cursor-pointer"
                                    >
                                        <span className="text-2xl">{folder.icon || '📁'}</span>
                                        <span className="flex-1 truncate">{folder.name}</span>
                                        <span className="text-sm text-zinc-600">Folder</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <ItemActions
                                                id={folder.id}
                                                type="folder"
                                                isStarred={folder.isStarred || false}
                                                isTrashView={isTrashView}
                                                onToggleStar={toggleStar}
                                                onMoveToTrash={moveToTrash}
                                                onRestore={restoreItem}
                                                onDeleteForever={deleteForever}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Projects */}
                                {displayProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        role="button"
                                        onClick={() => openProject(project.id)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 rounded-xl transition-colors group text-left cursor-pointer"
                                    >
                                        <Layout className="w-5 h-5 text-purple-400" />
                                        <span className="flex-1 truncate">{project.name}</span>
                                        <span className="text-sm text-zinc-600">Canvas</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <ItemActions
                                                id={project.id}
                                                type="project"
                                                isStarred={project.isStarred || false}
                                                isTrashView={isTrashView}
                                                onToggleStar={toggleStar}
                                                onMoveToTrash={moveToTrash}
                                                onRestore={restoreItem}
                                                onDeleteForever={deleteForever}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Documents */}
                                {displayDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        role="button"
                                        onClick={() => openDocument(doc.id)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 rounded-xl transition-colors group text-left cursor-pointer"
                                    >
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        <span className="flex-1 truncate">{doc.name}</span>
                                        <span className="text-sm text-zinc-600">Note</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <ItemActions
                                                id={doc.id}
                                                type="document"
                                                isStarred={doc.isStarred || false}
                                                isTrashView={isTrashView}
                                                onToggleStar={toggleStar}
                                                onMoveToTrash={moveToTrash}
                                                onRestore={restoreItem}
                                                onDeleteForever={deleteForever}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Links */}
                                {displayLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        role="button"
                                        onClick={() => window.open(link.url, '_blank')}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 rounded-xl transition-colors group text-left cursor-pointer"
                                    >
                                        <Link2 className="w-5 h-5 text-green-400" />
                                        <span className="flex-1 truncate">{link.title || link.url}</span>
                                        <span className="text-sm text-zinc-600">Link</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <ItemActions
                                                id={link.id}
                                                type="link"
                                                isStarred={link.isStarred || false}
                                                isTrashView={isTrashView}
                                                onToggleStar={toggleStar}
                                                onMoveToTrash={moveToTrash}
                                                onRestore={restoreItem}
                                                onDeleteForever={deleteForever}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Files */}
                                {displayFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        role="button"
                                        onClick={() => window.open(file.url, '_blank')}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-900 rounded-xl transition-colors group text-left cursor-pointer"
                                    >
                                        <FileText className="w-5 h-5 text-orange-400" />
                                        <span className="flex-1 truncate">{file.name}</span>
                                        <span className="text-sm text-zinc-600">File</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <ItemActions
                                                id={file.id}
                                                type="file"
                                                isStarred={file.isStarred || false}
                                                isTrashView={isTrashView}
                                                onToggleStar={toggleStar}
                                                onMoveToTrash={moveToTrash}
                                                onRestore={restoreItem}
                                                onDeleteForever={deleteForever}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Item Modals */}
            <CreateItemModal
                open={folderModalOpen}
                onOpenChange={setFolderModalOpen}
                type="folder"
                onSubmit={createFolder}
            />
            <CreateItemModal
                open={noteModalOpen}
                onOpenChange={setNoteModalOpen}
                type="note"
                onSubmit={createDocument}
            />
            <CreateItemModal
                open={canvasModalOpen}
                onOpenChange={setCanvasModalOpen}
                type="canvas"
                onSubmit={createCanvas}
            />
            <CreateItemModal
                open={linkModalOpen}
                onOpenChange={setLinkModalOpen}
                type="link"
                onSubmit={createLink}
            />
        </div >
    );
}
