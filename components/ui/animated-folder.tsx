'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-react';

interface AnimatedFolderProps {
    id: string;
    name: string;
    type?: string;
    icon?: string;
    isStarred?: boolean;
    onClick?: () => void;
    actionSlot?: React.ReactNode;
    itemCount?: number;
    className?: string;
}

export function AnimatedFolder({
    id,
    name,
    icon,
    isStarred,
    onClick,
    actionSlot,
    itemCount = 0,
    className
}: AnimatedFolderProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Variants for animation
    const folderVariants = {
        closed: { rotateX: 0, y: 0 },
        open: { rotateX: -5, y: -2 }
    };

    const paperVariants = {
        closed: { y: 0, opacity: 0, scale: 0.9 },
        open: (i: number) => ({
            y: -8 - (i * 3),
            opacity: 1,
            scale: 1 - (i * 0.05),
            transition: { delay: i * 0.05, duration: 0.2 }
        })
    };

    return (
        <motion.div
            className={cn(
                "group relative w-full aspect-[4/3] cursor-pointer",
                className
            )}
            onClick={onClick}
            onHoverStart={() => setIsOpen(true)}
            onHoverEnd={() => setIsOpen(false)}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
        >
            {/* Folder Back */}
            <div className="absolute inset-0 bg-zinc-800 rounded-lg transform-gpu transition-all duration-300 border border-zinc-700/50 shadow-sm" style={{ clipPath: 'polygon(0% 0%, 40% 0%, 45% 15%, 100% 15%, 100% 100%, 0% 100%)' }} />

            {/* Papers inside */}
            <div className="absolute inset-x-4 bottom-4 h-3/5 flex justify-center items-end">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        custom={i}
                        variants={paperVariants}
                        className="absolute w-full h-full bg-zinc-100 rounded-sm shadow-sm border border-zinc-200"
                        style={{
                            maxWidth: `${90 - (i * 5)}%`,
                            zIndex: 10 - i,
                            backgroundColor: i === 1 ? '#f4f4f5' : i === 2 ? '#e4e4e7' : '#d4d4d8'
                        }}
                    />
                ))}
            </div>

            {/* Folder Front */}
            <motion.div
                className="absolute inset-0 bg-zinc-700 rounded-lg transform-gpu origin-bottom border-t border-zinc-600 shadow-md flex flex-col justify-end p-4 bg-gradient-to-br from-zinc-700 to-zinc-800"
                style={{ clipPath: 'polygon(0% 15%, 40% 15%, 45% 30%, 100% 30%, 100% 100%, 0% 100%)', zIndex: 20 }}
                variants={{
                    closed: { rotateX: 0, scaleY: 1 },
                    open: { rotateX: -10, scaleY: 0.95 }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="mt-auto flex items-center gap-2 text-zinc-100">
                    {icon && <span className="text-xl">{icon}</span>}
                    <span className="font-medium truncate text-sm">{name}</span>
                </div>
            </motion.div>

            {/* Actions (visible on hover) */}
            <div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {actionSlot}
            </div>
        </motion.div>
    );
}
