'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import '@blocknote/core/fonts/inter.css';

interface EditorProps {
    initialContent?: PartialBlock[];
    onChange?: (blocks: Block[]) => void;
    editable?: boolean;
}

export default function Editor({ initialContent, onChange, editable = true }: EditorProps) {
    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
    });

    return (
        <div className="blocknote-wrapper">
            <BlockNoteView
                editor={editor}
                editable={editable}
                onChange={() => {
                    onChange?.(editor.document);
                }}
                theme="dark"
            />
        </div>
    );
}
