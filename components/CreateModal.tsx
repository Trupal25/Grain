'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NotebookPen, StickyNote, FolderPlus } from 'lucide-react';

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
    type: 'folder' | 'document' | 'project';
    docType?: 'note' | 'canvas';
}

export function CreateModal({ isOpen, onClose, onCreate, type, docType }: CreateModalProps) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            let defaultName = 'Untitled';
            if (type === 'folder') defaultName = 'New Folder';
            else if (type === 'document') defaultName = docType === 'canvas' ? 'New Canvas' : 'New Note';
            else if (type === 'project') defaultName = 'New Project';
            setName(defaultName);
        }
    }, [isOpen, type, docType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name);
            onClose();
        }
    };

    const getIcon = () => {
        if (type === 'folder') return <FolderPlus className="w-5 h-5 text-zinc-500" />;
        if (type === 'document') {
            return docType === 'canvas' ?
                <StickyNote className="w-5 h-5 text-zinc-500" /> :
                <NotebookPen className="w-5 h-5 text-zinc-500" />;
        }
        return <StickyNote className="w-5 h-5 text-zinc-500" />;
    };

    const getTitle = () => {
        if (type === 'folder') return 'Create Folder';
        if (type === 'document') return docType === 'canvas' ? 'Create Canvas' : 'Create Note';
        return 'Create Project';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white rounded-sm">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-zinc-800 rounded-sm">
                            {getIcon()}
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">{getTitle()}</DialogTitle>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-1">
                            Name
                        </label>
                        <Input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name..."
                            className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-1 focus-visible:ring-zinc-500 h-12 rounded-sm"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-sm"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
