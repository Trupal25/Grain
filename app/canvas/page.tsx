'use client';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
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
import Sidebar from './components/Sidebar';
import { ImageIcon, Video, AlignLeft, Loader2, Cloud, CloudOff, Check } from 'lucide-react';
import type { ImageNodeData, VideoNodeData, TextNodeData } from './types';
import { useAutoSave, loadProject, createProject } from '@/lib/project';

const nodeTypes: NodeTypes = { image: ImageNode, video: VideoNode, text: TextNode };

let nodeId = 0;
const getNodeId = (type: string) => `${type}-${++nodeId}`;

const defaultData = {
  image: { label: 'Image', model: 'gemini-imagen', aspectRatio: '1:1' } as ImageNodeData,
  video: { label: 'Video', model: 'gemini-veo', duration: '4s' } as VideoNodeData,
  text: { label: 'Prompt', model: 'gpt-4o', text: '' } as TextNodeData,
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

  const isValidConnection = useCallback((conn: Edge | Connection) => conn.source !== conn.target, []);
  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const onConnectEnd: OnConnectEnd = useCallback((event, state) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane') && state.fromNode) {
      const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
      setTimeout(() => setMenu({ x: clientX, y: clientY, sourceId: state.fromNode!.id }), 0);
    }
  }, []);

  const createNode = useCallback((type: 'image' | 'video' | 'text') => {
    if (!menu) return;
    const id = getNodeId(type);
    const pos = screenToFlowPosition({ x: menu.x, y: menu.y });
    setNodes(nds => [...nds, { id, type, position: { x: pos.x - 120, y: pos.y - 80 }, data: defaultData[type] }]);
    setEdges(eds => [...eds, { id: `e-${menu.sourceId}-${id}`, source: menu.sourceId, target: id }]);
    setMenu(null);
  }, [menu, screenToFlowPosition, setNodes, setEdges]);

  const addNode = useCallback((type: 'image' | 'video' | 'text') => {
    const id = getNodeId(type);
    setNodes(nds => [...nds, { id, type, position: { x: 300 + nds.length * 50, y: 200 + nds.length * 40 }, data: defaultData[type] }]);
  }, [setNodes]);

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
      {/* Header */}
      <div className="absolute top-6 left-24 z-50 pointer-events-none select-none">
        <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-white text-black flex items-center justify-center text-[10px] font-black">G</div>
          Grain
        </h1>
        <div className="flex items-center gap-2 mt-0.5 ml-6">
          <p className="text-[10px] text-zinc-600 font-mono">{projectName}</p>
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1 text-[10px]">
            {saveStatus === 'saving' && (
              <>
                <Cloud className="w-3 h-3 text-yellow-500 animate-pulse" />
                <span className="text-yellow-500">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudOff className="w-3 h-3 text-red-500" />
                <span className="text-red-500">Error</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Sidebar onAddNode={addNode} />

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
          {(['text', 'image', 'video'] as const).map(type => (
            <button
              key={type}
              onClick={() => createNode(type)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg"
            >
              {type === 'text' && <AlignLeft className="w-4 h-4 text-green-400" />}
              {type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
              {type === 'video' && <Video className="w-4 h-4 text-blue-400" />}
              {type === 'text' ? 'Text Prompt' : type === 'image' ? 'Image Gen' : 'Video Scene'}
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