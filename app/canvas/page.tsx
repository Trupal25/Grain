'use client';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useState, Suspense } from 'react';
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
import ToolsSidebar from './components/Sidebar';
import { Sidebar as AppSidebar } from '@/components/Sidebar';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { ImageIcon, Video, AlignLeft, Loader2, Cloud, CloudOff, Check, PanelLeft, MessageCircle } from 'lucide-react';
import type { ImageNodeData, VideoNodeData, TextNodeData } from './types';
import { useAutoSave, loadProject, createProject } from '@/lib/project';
import { Folder as FolderType, Document as DocumentType, Project as ProjectType } from '@/lib/db/schema';

const nodeTypes: NodeTypes = {
  image: ImageNode,
  video: VideoNode,
  text: TextNode,
  note: NoteNode,
  chat: ChatNode
};

let nodeId = 0;
const getNodeId = (type: string) => `${type}-${++nodeId}`;

const defaultData = {
  image: { label: 'Image', model: 'gemini-imagen', aspectRatio: '1:1' } as ImageNodeData,
  video: { label: 'Video', model: 'gemini-veo', duration: '4s' } as VideoNodeData,
  text: { label: 'Prompt', model: 'gemini-2.0-flash-lite', text: '' } as TextNodeData,
  note: { label: 'Note', noteId: '', title: '', content: '' } as any,
  chat: { label: 'Assistant', model: 'gemini-2.0-flash-lite', messages: [] } as any,
};

interface MenuState { x: number; y: number; sourceId: string }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function GrainCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, setViewport } = useReactFlow();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

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

  // Auto-save on node/edge changes
  useEffect(() => {
    if (!isLoading && projectId && nodes.length > 0) {
      scheduleSave();
    }
  }, [nodes, edges, isLoading, projectId, scheduleSave]);

  // Workflow Logic
  useEffect(() => {
    (window as any).runWorkflow = () => {
      const generators = nodes
        .filter(n => n.type === 'image' || n.type === 'video');

      if (generators.length === 0) return;

      setNodes(nds => nds.map(n => {
        if (n.type === 'image' || n.type === 'video') {
          return {
            ...n,
            data: {
              ...n.data as any,
              workflowStatus: n.id === generators[0].id ? 'queued' : 'idle'
            }
          };
        }
        return n;
      }));
    };
  }, [nodes, setNodes]);

  // Workflow Sequential Orchestrator
  useEffect(() => {
    const generatorNodes = nodes.filter(n => n.type === 'image' || n.type === 'video');
    const runningNode = generatorNodes.find(n => (n.data as any).workflowStatus === 'running');

    if (runningNode) return;

    const queuedNode = generatorNodes.find(n => (n.data as any).workflowStatus === 'queued');
    if (queuedNode) {
      // Move from queued to running
      setNodes(nds => nds.map(n => n.id === queuedNode.id ? {
        ...n,
        data: { ...n.data as any, workflowStatus: 'running' }
      } : n));
      return;
    }

    // Check if we need to queue the next one
    const lastCompletedIndex = generatorNodes.reduce((acc, n, i) =>
      (n.data as any).workflowStatus === 'completed' ? i : acc, -1);

    if (lastCompletedIndex !== -1 && lastCompletedIndex < generatorNodes.length - 1) {
      const nextNode = generatorNodes[lastCompletedIndex + 1];
      if ((nextNode.data as any).workflowStatus === 'idle') {
        setNodes(nds => nds.map(n => n.id === nextNode.id ? {
          ...n,
          data: { ...n.data as any, workflowStatus: 'queued' }
        } : n));
      }
    }
  }, [nodes, setNodes]);

  const isValidConnection = useCallback((conn: Edge | Connection) => conn.source !== conn.target, []);
  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const onConnectEnd: OnConnectEnd = useCallback((event, state) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane') && state.fromNode) {
      const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
      setTimeout(() => setMenu({ x: clientX, y: clientY, sourceId: state.fromNode!.id }), 0);
    }
  }, []);

  const createNode = useCallback((type: 'image' | 'video' | 'text' | 'chat') => {
    if (!menu) return;
    const id = getNodeId(type);
    const pos = screenToFlowPosition({ x: menu.x, y: menu.y });
    setNodes(nds => [...nds, { id, type, position: { x: pos.x - 120, y: pos.y - 80 }, data: defaultData[type] }]);
    setEdges(eds => [...eds, { id: `e-${menu.sourceId}-${id}`, source: menu.sourceId, target: id }]);
    setMenu(null);
  }, [menu, screenToFlowPosition, setNodes, setEdges]);

  const addNode = useCallback((type: 'image' | 'video' | 'text' | 'chat') => {
    const id = getNodeId(type);
    setNodes(nds => [...nds, { id, type, position: { x: 300 + nds.length * 50, y: 200 + nds.length * 40 }, data: defaultData[type] }]);
  }, [setNodes]);

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
            expandedFolders={expandedFolders}
            toggleFolderExpand={toggleFolderExpand}
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
            <div className="pointer-events-none">
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center text-[11px] font-black shadow-lg">G</div>
                <span className="opacity-90">Grain</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 ml-0 leading-none">
                <p className="text-[10px] text-zinc-600 font-mono tracking-tight">{projectName}</p>
                {/* Save Status Indicator */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 mr-1">
                      <Cloud className="w-2.5 h-2.5 text-yellow-500 animate-pulse" />
                      <span className="text-yellow-500/80 font-medium tracking-wide uppercase text-[9px]">Saving</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mr-1">
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-emerald-500/80 font-medium tracking-wide uppercase text-[9px]">Saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 mr-1">
                      <CloudOff className="w-2.5 h-2.5 text-rose-500" />
                      <span className="text-rose-500/80 font-medium tracking-wide uppercase text-[9px]">Error</span>
                    </div>
                  )}
                </div>
              </div>
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
            isValidConnection={isValidConnection}
            onPaneClick={() => setMenu(null)}
            fitView
            minZoom={0.3}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
            proOptions={{ hideAttribution: true }}
            selectionMode={SelectionMode.Partial}
            panOnScroll
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
              {(['text', 'image', 'video', 'chat'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => createNode(type)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg"
                >
                  {type === 'text' && <AlignLeft className="w-4 h-4 text-green-400" />}
                  {type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
                  {type === 'video' && <Video className="w-4 h-4 text-blue-400" />}
                  {type === 'chat' && <MessageCircle className="w-4 h-4 text-orange-400" />}
                  {type === 'text' ? 'Text Prompt' : type === 'image' ? 'Image Gen' : type === 'video' ? 'Video Scene' : 'AI Chat'}
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
      <ToolsSidebar onAddNode={addNode} />
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