import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

interface AutoSaveOptions {
    projectId: string | null;
    debounceMs?: number;
    onSaveStart?: () => void;
    onSaveComplete?: () => void;
    onSaveError?: (error: Error) => void;
}

export function useAutoSave({
    projectId,
    debounceMs = 2000,
    onSaveStart,
    onSaveComplete,
    onSaveError,
}: AutoSaveOptions) {
    const { getNodes, getEdges, getViewport } = useReactFlow();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<string>('');

    const save = useCallback(async () => {
        if (!projectId) return;

        const nodes = getNodes();
        const edges = getEdges();
        const viewport = getViewport();

        // Create a hash to check if anything changed
        const stateHash = JSON.stringify({ nodes, edges, viewport });
        if (stateHash === lastSavedRef.current) return;

        onSaveStart?.();

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                    viewport: JSON.stringify(viewport),
                }),
            });

            if (res.ok) {
                lastSavedRef.current = stateHash;
                console.log('[AutoSave] Saved successfully');
                onSaveComplete?.();
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save');
            }
        } catch (error) {
            console.error('[AutoSave] Failed:', error);
            onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
        }
    }, [projectId, getNodes, getEdges, getViewport, onSaveStart, onSaveComplete, onSaveError]);

    const scheduleSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(save, debounceMs);
    }, [save, debounceMs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { save, scheduleSave };
}

// Load project data (auth handled via cookies)
export async function loadProject(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to load project');
    }

    const { project } = await res.json();

    return {
        project,
        nodes: project.canvasState?.nodes ? JSON.parse(project.canvasState.nodes) : [],
        edges: project.canvasState?.edges ? JSON.parse(project.canvasState.edges) : [],
        viewport: project.canvasState?.viewport ? JSON.parse(project.canvasState.viewport) : { x: 0, y: 0, zoom: 1 },
    };
}

// Create new project (auth handled via cookies)
export async function createProject(name?: string, folderId?: string) {
    const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, folderId }),
    });

    if (!res.ok) {
        const error = await res.json();
        const message = error.details ? `${error.error}: ${error.details}` : error.error;
        throw new Error(message || 'Failed to create project');
    }

    const { project } = await res.json();
    return project;
}

// List user's projects (auth handled via cookies)
export async function listProjects() {
    const res = await fetch('/api/projects');
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to list projects');
    }

    const { projects } = await res.json();
    return projects;
}

// Delete project
export async function deleteProject(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete project');
    }

    return true;
}

// Update project metadata
export async function updateProject(projectId: string, data: {
    name?: string;
    description?: string;
    folderId?: string | null;
    thumbnail?: string;
}) {
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update project');
    }

    return true;
}

