'use client';

import '@xyflow/react/dist/style.css';
import React, { useCallback, useEffect, useState, Suspense, useRef, useMemo, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  type OnConnectEnd,
  SelectionMode,
} from '@xyflow/react';
import ImageNode from './components/nodes/ImageNode';
import VideoNode from './components/nodes/VideoNode';
import TextNode from './components/nodes/TextNode';
import NoteNode from './components/nodes/NoteNode';
import ChatNode from './components/nodes/ChatNode';
import YoutubeNode from './components/nodes/YoutubeNode';
import ToolsSidebar from './components/Sidebar';
// import { WorkflowBar } from './components/WorkflowBar'; // Removed in favor of Chain approach
import { Sidebar as AppSidebar } from '@/components/Sidebar';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { ImageIcon, Video, AlignLeft, Loader2, Cloud, CloudOff, Check, PanelLeft, MessageCircle, Youtube, ChevronRight, Folder, ChevronDown, MoreHorizontal } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from 'sonner';
import type { ImageNodeData, VideoNodeData, TextNodeData, YoutubeNodeData, WorkflowGroup } from './types';
import { useAutoSave, loadProject, createProject, updateProject } from '@/lib/project';
import { Folder as FolderType, Document as DocumentType, Project as ProjectType } from '@/lib/db/schema';
import { isValidConnection as checkValidConnection, getDownstreamNodes } from '@/lib/canvas-utils';

const nodeTypes: NodeTypes = {
  image: ImageNode,
  video: VideoNode,
  text: TextNode,
  note: NoteNode,
  chat: ChatNode,
  youtube: YoutubeNode
};

let nodeId = 0;
const getNodeId = (type: string) => `${type}-${++nodeId}-${Math.random().toString(36).substr(2, 4)}`;

const defaultData = {
  image: { label: 'Image', model: 'gemini-2.0-flash', aspectRatio: '1:1' } as ImageNodeData,
  video: { label: 'Video', model: 'veo-2', duration: '5s' } as VideoNodeData,
  text: { label: 'Prompt', model: 'gemini-2.0-flash-lite', text: '' } as TextNodeData,
  note: { label: 'Note', noteId: '', title: '', content: '' } as any,
  chat: { label: 'Assistant', model: 'gemini-2.0-flash-lite', messages: [] } as any,
  youtube: { label: 'YouTube', videoUrl: '' } as YoutubeNodeData,
};

interface MenuState { x: number; y: number; sourceId: string }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function GrainCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, setViewport, deleteElements } = useReactFlow();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const connectingRef = useRef(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectFolderId, setProjectFolderId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer');

  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  // Sidebar State
  const [allFolders, setAllFolders] = useState<FolderType[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentType[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectType[]>([]);
  const [credits, setCredits] = useState(0);
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());


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

  // Fetch tree on mount
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchTree();
    }
  }, [isUserLoaded, user, fetchTree]);

  // Auto-save hook with status callbacks
  const { scheduleSave } = useAutoSave({
    projectId,
    debounceMs: 2000,
    onSaveStart: () => setSaveStatus('saving'),
    onSaveComplete: () => {
      setSaveStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onSaveError: () => setSaveStatus('error'),
  });

  const breadcrumbs = useMemo(() => {
    if (!allFolders.length) return [];

    const path = [];
    let currentId = projectFolderId;

    while (currentId) {
      const folder = allFolders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentFolderId;
      } else {
        break;
      }
    }
    return path;
  }, [projectFolderId, allFolders]);

  const handleRename = async (newName: string) => {
    if (!projectId || !newName.trim() || newName === projectName) {
      setIsRenaming(false);
      return;
    }

    try {
      await updateProject(projectId, { name: newName });
      setProjectName(newName);
      toast.success('Project renamed');
    } catch (err) {
      console.error('Rename failed:', err);
      toast.error('Failed to rename project');
    } finally {
      setIsRenaming(false);
    }
  };

  useEffect(() => setMounted(true), []);

  // Load or create project on mount
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const initProject = async () => {
      setIsLoading(true);
      try {
        if (projectId) {
          // Load existing project
          const data = await loadProject(projectId);
          setNodes(data.nodes);
          setEdges(data.edges);
          if (data.viewport) {
            setViewport(data.viewport);
          }
          setProjectName(data.project.name);
          setProjectFolderId(data.project.folderId);
          // Update nodeId counter to avoid conflicts
          const maxId = Math.max(0, ...data.nodes.map((n: Node) => {
            const match = n.id.match(/-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          }));
          nodeId = maxId;
        } else {
          // Create new project and redirect
          const project = await createProject();
          router.replace(`/canvas?project=${project.id}`);
          return;
        }
      } catch (error) {
        console.error('[Project Init Error]', error);
        // If project not found, create new one
        const project = await createProject();
        router.replace(`/canvas?project=${project.id}`);
        return;
      }
      setIsLoading(false);
    };

    initProject();
  }, [isUserLoaded, user, projectId, router, setNodes, setEdges, setViewport]);

  // Handle keyboard shortcuts for tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'v' || e.key === 'Escape') setActiveTool('pointer');
      if (e.key.toLowerCase() === 'h' || e.key === ' ') setActiveTool('hand');

      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          deleteElements({ nodes: selectedNodes, edges: selectedEdges });
          toast.success('Selected elements removed');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, deleteElements]);

  // Handle URL Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;

      // Don't trigger if user is typing in an input/textarea (except for our specific nodrag/nowheel areas if needed, but usually we don't want to spawn nodes while typing in another node's input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isYoutube = text.includes('youtube.com') || text.includes('youtu.be');
      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(text.split('?')[0]);
      const isVideo = /\.(mp4|webm|ogg)$/i.test(text.split('?')[0]);

      if (isYoutube) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const pos = screenToFlowPosition({ x, y });
        const id = getNodeId('youtube');
        setNodes(nds => [...nds, {
          id,
          type: 'youtube',
          position: { x: pos.x - 200, y: pos.y - 120 },
          data: { ...defaultData.youtube, videoUrl: text }
        }]);
        toast.success('YouTube video embedded');
        return;
      }

      if (isImage) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const pos = screenToFlowPosition({ x, y });
        const id = getNodeId('image');
        setNodes(nds => [...nds, {
          id,
          type: 'image',
          position: { x: pos.x - 200, y: pos.y - 200 },
          data: { ...defaultData.image, imageUrl: text }
        }]);
        toast.success('Image embedded');
        return;
      }

      if (isVideo) {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const pos = screenToFlowPosition({ x, y });
        const id = getNodeId('video');
        setNodes(nds => [...nds, {
          id,
          type: 'video',
          position: { x: pos.x - 200, y: pos.y - 120 },
          data: { ...defaultData.video, videoUrl: text }
        }]);
        toast.success('Video embedded');
        return;
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [screenToFlowPosition, setNodes]);

  // Auto-save on node/edge changes
  useEffect(() => {
    if (!isLoading && projectId && nodes.length > 0) {
      scheduleSave();
    }
  }, [nodes, edges, isLoading, projectId, scheduleSave]);

  // Chain-Based Workflow System
  const triggerChainWorkflow = useCallback((startNodeId: string) => {
    const downstreamIds = getDownstreamNodes(startNodeId, nodes, edges);

    setNodes(nds => nds.map(n => {
      const isStartNode = n.id === startNodeId;
      const isDownstream = downstreamIds.includes(n.id);

      if (isStartNode || isDownstream) {
        if (n.type === 'image' || n.type === 'video') {
          return {
            ...n,
            data: {
              ...n.data as any,
              workflowStatus: isStartNode ? 'queued' : 'idle',
              isInActiveChain: true // Flag to tell orchestrator to propagate here
            }
          };
        }
      }
      return n;
    }));
  }, [nodes, edges, setNodes]);

  useEffect(() => {
    (window as any).triggerWorkflow = triggerChainWorkflow;
  }, [triggerChainWorkflow]);

  // Orchestrator: Chains
  useEffect(() => {
    // 1. Find ANY node that is currently running. If so, wait.
    const isAnyRunning = nodes.some(n => (n.data as any).workflowStatus === 'running');
    if (isAnyRunning) return;

    // 2. Find nodes that are 'queued'
    const queuedNode = nodes.find(n => (n.data as any).workflowStatus === 'queued');

    if (queuedNode) {
      // Start this node
      setNodes(nds => nds.map(n => n.id === queuedNode.id ? {
        ...n,
        data: { ...n.data as any, workflowStatus: 'running' }
      } : n));
      return;
    }

    // 3. Check for recently completed nodes to propagate to their children
    const completedNodes = nodes.filter(n => (n.data as any).workflowStatus === 'completed');

    for (const node of completedNodes) {
      // Find immediate children that are marked as being in an active chain and are currently idle
      const childrenIds = edges.filter(e => e.source === node.id).map(e => e.target);
      const readyChild = nodes.find(n =>
        childrenIds.includes(n.id) &&
        (n.data as any).isInActiveChain &&
        (n.data as any).workflowStatus === 'idle'
      );

      if (readyChild) {
        // Move child to queued
        setNodes(nds => nds.map(n => n.id === readyChild.id ? {
          ...n,
          data: { ...n.data as any, workflowStatus: 'queued', isInActiveChain: false } // Reset flag as it's now moving
        } : n));
        break; // Only start one child at a time to maintain sequence
      }
    }
  }, [nodes, edges, setNodes]);

  const onConnect = useCallback((params: Connection) => {
    connectingRef.current = true;
    setEdges(eds => addEdge(params, eds));
  }, [setEdges]);

  const isValidConnection = useCallback((conn: Edge | Connection) => {
    return checkValidConnection(conn, nodes);
  }, [nodes]);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    toast.success('Connection removed');
  }, [setEdges]);
  const onConnectEnd: OnConnectEnd = useCallback((event, state) => {
    if (connectingRef.current) {
      connectingRef.current = false;
      return;
    }

    const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
    setTimeout(() => setMenu({ x: clientX, y: clientY, sourceId: state.fromNode!.id }), 0);
  }, []);

  const createNode = useCallback((type: 'image' | 'video' | 'text' | 'chat' | 'youtube') => {
    if (!menu) return;
    const id = getNodeId(type);
    const pos = screenToFlowPosition({ x: menu.x, y: menu.y });

    const width = type === 'image' ? 380 : type === 'video' ? 400 : type === 'text' ? 280 : type === 'chat' ? 450 : type === 'youtube' ? 400 : 200;
    const height = type === 'image' ? 380 : type === 'video' ? 225 : type === 'text' ? 200 : type === 'chat' ? 650 : type === 'youtube' ? 225 : 100;

    setNodes(nds => [...nds, {
      id,
      type,
      position: { x: pos.x - 120, y: pos.y - 80 },
      data: defaultData[type],
      width,
      height,
      style: { width, height },
    }]);
    setEdges(eds => [...eds, { id: `e-${menu.sourceId}-${id}`, source: menu.sourceId, target: id }]);
    setMenu(null);
  }, [menu, screenToFlowPosition, setNodes, setEdges]);

  const addNode = useCallback((type: 'image' | 'video' | 'text' | 'chat' | 'youtube') => {
    const id = getNodeId(type);
    // Spawn in the center of the viewport
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const pos = screenToFlowPosition({ x, y });

    setNodes(nds => [...nds, {
      id,
      type,
      position: { x: pos.x - 200, y: pos.y - 200 },
      data: defaultData[type],
      width: type === 'image' ? 380 : type === 'video' ? 400 : type === 'text' ? 280 : type === 'chat' ? 450 : type === 'youtube' ? 400 : 200,
      height: type === 'image' ? 380 : type === 'video' ? 225 : type === 'text' ? 200 : type === 'chat' ? 650 : type === 'youtube' ? 225 : 100,
      style: {
        width: type === 'image' ? 380 : type === 'video' ? 400 : type === 'text' ? 280 : type === 'chat' ? 450 : type === 'youtube' ? 400 : undefined,
        height: type === 'image' ? 380 : type === 'video' ? 225 : type === 'text' ? 200 : type === 'chat' ? 650 : type === 'youtube' ? 225 : undefined,
      }
    }]);
  }, [setNodes, screenToFlowPosition]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataString = event.dataTransfer.getData('application/reactflow/note');
      if (!dataString) return;

      try {
        const noteData = JSON.parse(dataString);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: getNodeId('note'),
          type: 'note',
          position,
          data: {
            noteId: noteData.noteId,
            title: noteData.title,
            content: noteData.content,
            label: 'Note'
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (e) {
        console.error('Failed to drop note', e);
      }
    },
    [screenToFlowPosition, setNodes],
  );

  const onDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    toast.success('Selected elements removed');
  }, [nodes, edges, deleteElements]);

  const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected);

  // Loading state
  if (!isUserLoaded || isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-sm text-zinc-500">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative">
      <div className="flex w-full h-full">
        <div className="flex h-full shrink-0 z-50">
          <AppSidebar
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
            currentFolderId={null}
            onSelectFolder={(folder) => router.push(`/dashboard?folderId=${folder.id}`)}
            onSelectDocument={(doc) => router.push(`/document/${doc.id}`)}
            onSelectProject={(proj) => router.push(`/canvas?project=${proj.id}`)}
            onNavigateHome={() => router.push('/dashboard')}
            onNavigateFavorites={() => router.push('/dashboard?view=favorites')}
            onNavigateTrash={() => router.push('/dashboard?view=trash')}
            isStarredView={false}
            activeItemId={projectId}
            activeItemType="project"
            expandedFolders={expandedFolders}
            toggleFolderExpand={toggleFolderExpand}
            onRefresh={fetchTree}
          />
        </div>
        <div className="flex-1 relative h-full">
          {/* Header */}
          <div className="absolute top-6 left-8 z-50 select-none flex items-center gap-4">
            {isTreeCollapsed && (
              <button
                onClick={() => setIsTreeCollapsed(false)}
                className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all pointer-events-auto shadow-2xl backdrop-blur-md"
                title="Show Workspace"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex flex-col gap-0.5 pointer-events-auto">
              <Breadcrumb>
                <BreadcrumbList className="text-[13px] font-medium text-zinc-500 gap-2 sm:gap-2.5 flex-nowrap whitespace-nowrap">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => router.push('/dashboard')}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Workspace
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />

                  {breadcrumbs.length > 2 ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbEllipsis className="size-4" />
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink className="hover:text-white transition-colors flex items-center gap-1.5 cursor-default grayscale opacity-70">
                          <Folder className="w-3.5 h-3.5" />
                          {breadcrumbs[breadcrumbs.length - 1].name}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    breadcrumbs.map((folder) => (
                      <Fragment key={folder.id}>
                        <BreadcrumbItem>
                          <BreadcrumbLink className="hover:text-white transition-colors flex items-center gap-1.5 cursor-default grayscale opacity-70">
                            <Folder className="w-3.5 h-3.5" />
                            {folder.name}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                      </Fragment>
                    ))
                  )}

                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white">
                      {isRenaming ? (
                        <input
                          autoFocus
                          defaultValue={projectName}
                          onBlur={(e) => handleRename(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(e.currentTarget.value);
                            if (e.key === 'Escape') setIsRenaming(false);
                          }}
                          className="bg-zinc-900 border border-zinc-700 text-[13px] font-bold text-white px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-white/20 min-w-[150px]"
                        />
                      ) : (
                        <div
                          onClick={() => setIsRenaming(true)}
                          className="text-[13px] font-bold tracking-tight text-white hover:bg-white/5 px-2 py-0.5 -ml-2 rounded cursor-pointer transition-all flex items-center gap-1.5 group"
                        >
                          <AlignLeft className="w-3.5 h-3.5 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          {projectName}
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </BreadcrumbPage>
                  </BreadcrumbItem>

                  {/* Status Indicator integrated into breadcrumb row */}
                  {saveStatus !== 'idle' && (
                    <div className="flex items-center gap-2 ml-2">
                      {saveStatus === 'saving' ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                          <span className="text-yellow-500/60 text-[10px] uppercase tracking-widest font-bold">Saving</span>
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500/60" />
                          <span className="text-emerald-500/60 text-[10px] uppercase tracking-widest font-bold">Synced</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>




          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            onEdgeContextMenu={onEdgeContextMenu}
            isValidConnection={isValidConnection}
            onPaneClick={() => setMenu(null)}
            fitView
            style={{
              cursor: activeTool === 'hand' ? 'grab' : 'default',
              backgroundColor: '#050505'
            }}
            minZoom={0.3}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
            proOptions={{ hideAttribution: true }}
            panOnDrag={activeTool === 'hand'}
            panOnScroll
            selectionOnDrag={activeTool === 'pointer'}
            selectionMode={SelectionMode.Partial}
            nodesDraggable={activeTool === 'pointer'}
            nodesConnectable={activeTool === 'pointer'}
            elementsSelectable={activeTool === 'pointer'}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <Background color="#333" gap={24} size={1} variant={BackgroundVariant.Dots} />
          </ReactFlow>

          {/* Connection Menu */}
          {mounted && menu && createPortal(
            <div
              style={{ position: 'fixed', left: menu.x, top: menu.y, transform: 'translate(-50%, 8px)', zIndex: 99999 }}
              className="p-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl min-w-[180px]"
            >
              <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider px-2 py-1 mb-1">Add Node</p>
              {(['text', 'image', 'video', 'chat', 'youtube'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => createNode(type)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg"
                >
                  {type === 'text' && <AlignLeft className="w-4 h-4 text-green-400" />}
                  {type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                  {type === 'video' && <Video className="w-4 h-4 text-blue-400" />}
                  {type === 'chat' && <MessageCircle className="w-4 h-4 text-orange-400" />}
                  {type === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                  {type === 'text' ? 'Text Prompt' : type === 'image' ? 'Image Gen' : type === 'video' ? 'Video Scene' : type === 'chat' ? 'AI Chat' : 'YouTube Embed'}
                </button>
              ))}
            </div>,
            document.body
          )}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-zinc-700 uppercase tracking-widest">Click + to add a node</p>
            </div>
          )}
        </div>
      </div>
      <ToolsSidebar
        onAddNode={addNode}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDeleteSelected={onDeleteSelected}
        hasSelection={hasSelection}
      />
    </div>
  );
}

function CanvasWithProvider() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }>
        <GrainCanvas />
      </Suspense>
    </ReactFlowProvider>
  );
}

export default function App() {
  return <CanvasWithProvider />;
}