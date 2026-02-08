'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { BlockNoteEditor, Block, PartialBlock } from '@/components/editor';
import {
    ArrowLeft,
    Loader2,
    Cloud,
    CloudOff,
    Check,
    Sparkles,
    MoreHorizontal,
    Star,
    Trash2,
    Share2,
    PanelLeft,
} from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Doc {
    id: string;
    name: string;
    content: string;
    type: 'canvas' | 'note';
    isStarred?: boolean;
}

import { Sidebar } from '@/components/Sidebar';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { Folder as FolderType, Document as DocumentType, Project as ProjectType } from '@/lib/db/schema';

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();
    const { isLoaded } = useUser();
    const documentId = params.id as string;

    const [doc, setDoc] = useState<Doc | null>(null);
    const [docName, setDocName] = useState('Untitled');
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isGenerating, setIsGenerating] = useState(false);
    const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>(undefined);
    const [showDropdown, setShowDropdown] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sidebar State
    const [allFolders, setAllFolders] = useState<FolderType[]>([]);
    const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);
    const [allProjects, setAllProjects] = useState<ProjectType[]>([]);
    const [credits, setCredits] = useState(0);
    const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Fetch Sidebar data
    const fetchTree = useCallback(async () => {
        try {
            const [foldersRes, docsRes, projectsRes] = await Promise.all([
                fetch('/api/folders?all=true'),
                fetch('/api/documents?all=true'),
                fetch('/api/projects')
            ]);

            if (foldersRes.ok) {
                const data = await foldersRes.json();
                setAllFolders(data.folders || []);
            }

            if (docsRes.ok) {
                const data = await docsRes.json();
                setAllDocuments(data.documents || []);
            }

            if (projectsRes.ok) {
                const data = await projectsRes.json();
                setAllProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch tree:', error);
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
            console.error('Failed to fetch credits:', error);
        }
    }, []);

    const toggleFolderExpand = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    useEffect(() => {
        if (isLoaded && documentId) {
            fetchTree();
            fetchCredits();
        }
    }, [isLoaded, documentId, fetchTree, fetchCredits]);

    // Load document
    useEffect(() => {
        if (!isLoaded || !documentId) return;

        const fetchDoc = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/documents/${documentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDoc(data.document);
                    setDocName(data.document.name);

                    // Parse content for BlockNote
                    if (data.document.content) {
                        try {
                            const content = JSON.parse(data.document.content);
                            // BlockNote expects an array of blocks
                            if (Array.isArray(content)) {
                                setInitialContent(content);
                            } else if (content.content && Array.isArray(content.content)) {
                                // Convert from TipTap format if needed
                                setInitialContent(undefined);
                            } else {
                                setInitialContent(undefined);
                            }
                        } catch {
                            setInitialContent(undefined);
                        }
                    }
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('[Document] Failed to load:', error);
                router.push('/dashboard');
            }
            setIsLoading(false);
        };

        fetchDoc();
    }, [isLoaded, documentId, router]);

    // Debounced save function
    const saveContent = useCallback(
        (blocks: Block[]) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                setSaveStatus('saving');
                try {
                    const res = await fetch(`/api/documents/${documentId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: JSON.stringify(blocks),
                        }),
                    });
                    if (res.ok) {
                        setSaveStatus('saved');
                        setTimeout(() => setSaveStatus('idle'), 2000);
                    } else {
                        setSaveStatus('error');
                    }
                } catch {
                    setSaveStatus('error');
                }
            }, 1500);
        },
        [documentId]
    );

    // Update document name
    const updateName = async (newName: string) => {
        setDocName(newName);
        try {
            await fetch(`/api/documents/${documentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
        } catch (error) {
            console.error('[Document] Failed to update name:', error);
        }
    };

    // Toggle star
    const toggleStar = async () => {
        if (!doc) return;
        try {
            const res = await fetch('/api/item', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: doc.id,
                    itemType: 'document',
                    isStarred: !doc.isStarred,
                }),
            });
            if (res.ok) {
                setDoc({ ...doc, isStarred: !doc.isStarred });
            }
        } catch (error) {
            console.error('[Document] Failed to toggle star:', error);
        }
        setShowDropdown(false);
    };

    // Delete document
    const deleteDocument = async () => {
        if (!confirm('Move this document to trash?')) return;
        try {
            await fetch('/api/item', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: documentId,
                    itemType: 'document',
                }),
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('[Document] Failed to delete:', error);
        }
    };

    // AI Writing assist - expand selected text
    const aiExpand = async () => {
        // This would need to be implemented with BlockNote's API
        // For now, show a placeholder
        setIsGenerating(true);
        try {
            alert('AI expansion feature - select text in the editor and this will expand/rewrite it using AI');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
            <Sidebar
                onToggleTree={() => setIsTreeCollapsed(!isTreeCollapsed)}
                isTreeVisible={!isTreeCollapsed}
            />
            <WorkspaceSidebar
                isCollapsed={isTreeCollapsed}
                onToggleCollapse={() => setIsTreeCollapsed(!isTreeCollapsed)}
                allFolders={allFolders}
                allDocuments={allDocuments}
                allProjects={allProjects}
                credits={credits}
                currentFolderId={null} // TODO: Could pass parentFolderId if available
                onSelectFolder={(folder) => router.push(`/dashboard?folderId=${folder.id}`)}
                onSelectDocument={(doc) => router.push(`/document/${doc.id}`)}
                onSelectProject={(proj) => router.push(`/canvas?project=${proj.id}`)}
                onNavigateHome={() => router.push('/dashboard')}
                onNavigateFavorites={() => router.push('/dashboard?view=favorites')}
                onNavigateTrash={() => router.push('/dashboard?view=trash')}
                expandedFolders={expandedFolders}
                toggleFolderExpand={toggleFolderExpand}
            />
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                {/* Header */}
                <header className="h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 shrink-0 flex items-center justify-between px-4 z-50">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                                className={`p-2 rounded-lg transition-colors ${!isTreeCollapsed ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px bg-zinc-800 mx-1" />
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <input
                                type="text"
                                value={docName}
                                onChange={(e) => updateName(e.target.value)}
                                className="bg-transparent text-lg font-semibold focus:outline-none border-b border-transparent hover:border-zinc-600 focus:border-purple-500 px-1 py-1 transition-colors max-w-[300px]"
                            />

                            {/* Save Status */}
                            <div className="flex items-center gap-1 text-sm">
                                {saveStatus === 'saving' && (
                                    <>
                                        <Cloud className="w-4 h-4 text-yellow-500 animate-pulse" />
                                        <span className="text-yellow-500">Saving...</span>
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-green-500">Saved</span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <CloudOff className="w-4 h-4 text-red-500" />
                                        <span className="text-red-500">Error</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* More Options */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>

                                {showDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowDropdown(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                                            <button
                                                onClick={toggleStar}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${doc?.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`}
                                                />
                                                {doc?.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Share functionality
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                            <div className="border-t border-zinc-700 my-1" />
                                            <button
                                                onClick={deleteDocument}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-900/30 transition-colors text-left text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Move to trash
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Editor */}
                    <main className="max-w-4xl mx-auto py-8 px-4 min-h-full">
                        <BlockNoteEditor
                            initialContent={initialContent}
                            onChange={saveContent}
                            editable={true}
                        />
                    </main>
                </div>

                {/* BlockNote custom styles */}
                <style jsx global>{`
                .blocknote-wrapper {
                    min-height: calc(100vh - 200px);
                }

                /* Dark theme overrides for BlockNote */
                .bn-container {
                    --bn-colors-editor-background: #09090b !important;
                    --bn-colors-editor-text: #fafafa !important;
                    --bn-colors-menu-background: #18181b !important;
                    --bn-colors-menu-text: #fafafa !important;
                    --bn-colors-tooltip-background: #27272a !important;
                    --bn-colors-tooltip-text: #fafafa !important;
                    --bn-colors-hovered-background: #27272a !important;
                    --bn-colors-selected-background: #3f3f46 !important;
                    --bn-colors-disabled-background: #18181b !important;
                    --bn-colors-disabled-text: #71717a !important;
                    --bn-colors-shadow: rgba(0, 0, 0, 0.3) !important;
                    --bn-colors-border: #3f3f46 !important;
                    --bn-colors-side-menu: #71717a !important;
                    --bn-colors-highlights-gray-background: #27272a !important;
                    --bn-colors-highlights-gray-text: #a1a1aa !important;
                    --bn-colors-highlights-purple-background: #581c87 !important;
                    --bn-colors-highlights-purple-text: #e9d5ff !important;
                    --bn-colors-highlights-blue-background: #1e3a8a !important;
                    --bn-colors-highlights-blue-text: #bfdbfe !important;
                }

                .bn-editor {
                    font-family: 'Inter', system-ui, sans-serif !important;
                    padding: 0 !important;
                }

                /* Make placeholder text visible */
                .bn-block-content[data-placeholder]::before {
                    color: #71717a !important;
                }

                /* Style headings */
                .bn-block-content[data-content-type="heading"] {
                    font-weight: 700 !important;
                }

                .bn-block-content[data-content-type="heading"][data-level="1"] {
                    font-size: 2.25rem !important;
                    margin-top: 2rem !important;
                    margin-bottom: 1rem !important;
                }

                .bn-block-content[data-content-type="heading"][data-level="2"] {
                    font-size: 1.75rem !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 0.75rem !important;
                }

                .bn-block-content[data-content-type="heading"][data-level="3"] {
                    font-size: 1.25rem !important;
                    margin-top: 1.25rem !important;
                    margin-bottom: 0.5rem !important;
                }

                /* Style paragraphs */
                .bn-block-content[data-content-type="paragraph"] {
                    line-height: 1.75 !important;
                }

                /* Style code blocks */
                .bn-block-content[data-content-type="codeBlock"] {
                    background-color: #18181b !important;
                    border-radius: 0.5rem !important;
                    padding: 1rem !important;
                    font-family: ui-monospace, SFMono-Regular, monospace !important;
                }

                /* Style inline code */
                .bn-inline-content code {
                    background-color: #27272a !important;
                    padding: 0.125rem 0.375rem !important;
                    border-radius: 0.25rem !important;
                    font-family: ui-monospace, SFMono-Regular, monospace !important;
                    font-size: 0.875em !important;
                }

                /* Style blockquotes */
                .bn-block-content[data-content-type="bulletListItem"],
                .bn-block-content[data-content-type="numberedListItem"] {
                    margin-bottom: 0.25rem !important;
                }

                /* Slash menu styling */
                .bn-slash-menu {
                    background-color: #18181b !important;
                    border: 1px solid #3f3f46 !important;
                    border-radius: 0.5rem !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
                }

                .bn-slash-menu-item:hover {
                    background-color: #27272a !important;
                }

                /* Formatting toolbar */
                .bn-formatting-toolbar {
                    background-color: #18181b !important;
                    border: 1px solid #3f3f46 !important;
                    border-radius: 0.5rem !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
                }

                .bn-formatting-toolbar button:hover {
                    background-color: #27272a !important;
                }

                /* Side menu */
                .bn-side-menu {
                    opacity: 0.7 !important;
                }

                .bn-side-menu:hover {
                    opacity: 1 !important;
                }
            `}</style>
                {/* Floating AI Assist Button */}
                <button
                    onClick={aiExpand}
                    disabled={isGenerating}
                    className="fixed bottom-8 right-8 z-[60] flex items-center gap-2.5 px-5 py-3 bg-gradient-to-tr from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.3)] backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    <div className="relative flex items-center justify-center">
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform" />
                        )}
                    </div>
                    <span className="relative font-bold text-sm tracking-wide text-white drop-shadow-sm uppercase">AI Assist</span>
                </button>
            </div>
        </div>
    );
}
