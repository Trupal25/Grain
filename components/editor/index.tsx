'use client';

import dynamic from 'next/dynamic';
import { Block, PartialBlock } from '@blocknote/core';

// Dynamic import to disable SSR for BlockNote
export const BlockNoteEditor = dynamic(() => import('./Editor'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse text-zinc-500">Loading editor...</div>
        </div>
    ),
});

// Re-export types for convenience
export type { Block, PartialBlock };
