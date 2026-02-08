'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, FileText, Layout, Link2 } from 'lucide-react';

type ItemType = 'folder' | 'note' | 'canvas' | 'link';

interface CreateItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ItemType;
    onSubmit: (name: string, url?: string) => Promise<void>;
}

const iconMap = {
    folder: Folder,
    note: FileText,
    canvas: Layout,
    link: Link2,
};

const titleMap = {
    folder: 'Create New Folder',
    note: 'Create New Note',
    canvas: 'Create New Canvas',
    link: 'Save Link',
};

const placeholderMap = {
    folder: 'My Folder',
    note: 'My Note',
    canvas: 'My Canvas',
    link: 'Link Title',
};

export function CreateItemModal({ open, onOpenChange, type, onSubmit }: CreateItemModalProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const Icon = iconMap[type];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (type === 'link' && !url.trim()) return;

        setIsLoading(true);
        try {
            await onSubmit(name.trim(), type === 'link' ? url.trim() : undefined);
            setName('');
            setUrl('');
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setUrl('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Icon className="w-5 h-5 text-zinc-400" />
                            {titleMap[type]}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            {type === 'link'
                                ? 'Save a link to your workspace for quick access.'
                                : `Give your ${type} a name to get started.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {type === 'link' && (
                            <div className="grid gap-2">
                                <Label htmlFor="url" className="text-zinc-300">
                                    URL
                                </Label>
                                <Input
                                    id="url"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                    autoFocus={type === 'link'}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-zinc-300">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder={placeholderMap[type]}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                autoFocus={type !== 'link'}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || (type === 'link' && !url.trim()) || isLoading}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
