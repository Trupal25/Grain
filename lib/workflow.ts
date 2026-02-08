/**
 * Workflow Execution Engine
 * Executes connected nodes in topological order, piping outputs as inputs
 */

import type { Node, Edge } from '@xyflow/react';
import { generateImageWithModel, generateVideoWithModel, generateTextWithModel } from './providers';

export interface WorkflowResult {
    nodeId: string;
    type: string;
    output: unknown;
    error?: string;
    executionTime: number;
}

export interface WorkflowExecutionResult {
    success: boolean;
    results: WorkflowResult[];
    totalTime: number;
    error?: string;
}

/**
 * Build adjacency list from edges
 */
function buildGraph(nodes: Node[], edges: Edge[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize all nodes
    for (const node of nodes) {
        graph.set(node.id, []);
    }

    // Add edges (source -> target means target depends on source)
    for (const edge of edges) {
        const deps = graph.get(edge.target) || [];
        deps.push(edge.source);
        graph.set(edge.target, deps);
    }

    return graph;
}

/**
 * Topological sort using Kahn's algorithm
 * Returns nodes in execution order (dependencies first)
 */
function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    const graph = buildGraph(nodes, edges);
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, Node>();

    // Initialize in-degree
    for (const node of nodes) {
        nodeMap.set(node.id, node);
        inDegree.set(node.id, 0);
    }

    // Calculate in-degree
    for (const edge of edges) {
        const current = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, current + 1);
    }

    // Queue nodes with no dependencies
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    // Process nodes
    const sorted: Node[] = [];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const node = nodeMap.get(nodeId);
        if (node) {
            sorted.push(node);
        }

        // Find nodes that depend on this one
        for (const edge of edges) {
            if (edge.source === nodeId) {
                const degree = (inDegree.get(edge.target) || 0) - 1;
                inDegree.set(edge.target, degree);
                if (degree === 0) {
                    queue.push(edge.target);
                }
            }
        }
    }

    // Check for cycles
    if (sorted.length !== nodes.length) {
        throw new Error('Workflow contains circular dependencies');
    }

    return sorted;
}

/**
 * Get input data from connected source nodes
 */
function getInputFromSources(
    nodeId: string,
    edges: Edge[],
    results: Map<string, WorkflowResult>
): string {
    const inputs: string[] = [];

    for (const edge of edges) {
        if (edge.target === nodeId) {
            const result = results.get(edge.source);
            if (result && !result.error) {
                // Extract text/prompt from result
                if (typeof result.output === 'string') {
                    inputs.push(result.output);
                } else if (typeof result.output === 'object' && result.output !== null) {
                    const obj = result.output as Record<string, unknown>;
                    if ('text' in obj && typeof obj.text === 'string') {
                        inputs.push(obj.text);
                    } else if ('prompt' in obj && typeof obj.prompt === 'string') {
                        inputs.push(obj.prompt);
                    } else if ('url' in obj && typeof obj.url === 'string') {
                        inputs.push(`[Generated asset: ${obj.url}]`);
                    }
                }
            }
        }
    }

    return inputs.join('\n\n');
}

/**
 * Execute a single node
 */
async function executeNode(
    node: Node,
    inputFromSources: string,
    onProgress?: (nodeId: string, status: 'running' | 'complete' | 'error') => void
): Promise<WorkflowResult> {
    const startTime = Date.now();
    onProgress?.(node.id, 'running');

    try {
        let output: unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = node.data as any;

        switch (node.type) {
            case 'text': {
                // Text nodes just pass through their content
                const text = data.text || inputFromSources || '';
                output = { text };
                break;
            }

            case 'image': {
                // Use input as prompt if available, otherwise use node's prompt
                const prompt = inputFromSources || data.prompt || 'A creative image';
                const model = data.model || 'gemini-imagen';
                const aspectRatio = data.aspectRatio || '1:1';

                const result = await generateImageWithModel(model, { prompt, aspectRatio });
                output = { url: result.url, prompt };
                break;
            }

            case 'video': {
                const prompt = inputFromSources || data.prompt || 'A creative video';
                const model = data.model || 'gemini-veo';
                const duration = parseInt(data.duration?.replace('s', '') || '4', 10);

                const result = await generateVideoWithModel(model, { prompt, duration });
                output = { url: result.url, prompt, duration };
                break;
            }

            case 'audio': {
                // Placeholder for audio generation
                output = { error: 'Audio generation not yet implemented' };
                break;
            }

            default:
                output = { warning: `Unknown node type: ${node.type}` };
        }

        onProgress?.(node.id, 'complete');
        return {
            nodeId: node.id,
            type: node.type || 'unknown',
            output,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        onProgress?.(node.id, 'error');
        return {
            nodeId: node.id,
            type: node.type || 'unknown',
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Execute entire workflow
 */
export async function executeWorkflow(
    nodes: Node[],
    edges: Edge[],
    onProgress?: (nodeId: string, status: 'running' | 'complete' | 'error') => void
): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results = new Map<string, WorkflowResult>();

    try {
        // Sort nodes in execution order
        const sortedNodes = topologicalSort(nodes, edges);

        // Execute nodes sequentially
        for (const node of sortedNodes) {
            const inputFromSources = getInputFromSources(node.id, edges, results);
            const result = await executeNode(node, inputFromSources, onProgress);
            results.set(node.id, result);

            // If there's an error and the node has dependents, we might want to stop
            // For now, we continue and let dependent nodes handle missing inputs
        }

        return {
            success: true,
            results: Array.from(results.values()),
            totalTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            results: Array.from(results.values()),
            totalTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Workflow execution failed',
        };
    }
}

/**
 * Validate workflow before execution
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (nodes.length === 0) {
        errors.push('Workflow has no nodes');
        return { valid: false, errors };
    }

    // Check for cycles
    try {
        topologicalSort(nodes, edges);
    } catch (e) {
        errors.push('Workflow contains circular dependencies');
    }

    // Check for disconnected nodes (warning, not error)
    const connectedNodes = new Set<string>();
    for (const edge of edges) {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    }

    for (const node of nodes) {
        if (!connectedNodes.has(node.id) && nodes.length > 1) {
            // Only warn if there are multiple nodes
            errors.push(`Node "${node.id}" is not connected to any other node`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
