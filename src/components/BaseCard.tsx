import React, { useCallback, memo, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { CheckmarkIcon, CopyIcon } from '@/components/Icons';

interface BaseCardProps {
    name: string;
    isSelected: boolean;
    isSelectionMode: boolean;
    isActive?: boolean;
    isPriority?: boolean;
    onCardClick: () => void;
    onToggleSelection: () => void;
    onContextMenu: (event: React.MouseEvent) => void;
    children: React.ReactNode;
    onCopy?: () => Promise<void>;
}

export interface BaseCardHandle {
    triggerFlash: () => void;
}

const BaseCard = forwardRef<BaseCardHandle, BaseCardProps & React.HTMLAttributes<HTMLDivElement>>((
    {
        name,
        isSelected,
        isSelectionMode,
        isActive = false,
        onCardClick,
        onToggleSelection,
        onContextMenu,
        children,
        onCopy,
        ...rest
    },
    ref
) => {

    const cardRef = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    useImperativeHandle(ref, () => ({
        triggerFlash() {
           // Flash removed as requested
        }
    }));

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (isSelectionMode) {
                e.preventDefault();
                onToggleSelection();
            } else {
                onCardClick();
            }
        },
        [isSelectionMode, onToggleSelection, onCardClick]
    );

    const handleContextMenu = useCallback(
        (event: React.MouseEvent) => {
            onContextMenu(event);
        },
        [onContextMenu]
    );

    const handleCopyClick = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onCopy) {
                await onCopy();
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        },
        [onCopy]
    );

    // Logic for the translation/movement effect (kept separate from color)
    const getTransformClasses = () => {
        if (isSelectionMode) return '';
        const base = "duration-300 transition-transform";
        if (isActive) return `${base} -translate-y-1`;
        return `${base} hover:-translate-y-1`;
    };

    // Logic for the highlight (tint) layer
    const getTintClasses = () => {
        if (isSelectionMode) return 'bg-transparent';
        
        // Simulating brightness changes using opacity overlays
        // Light mode: Black at 5% opacity (darkens background)
        // Dark mode: White at 10% opacity (lightens background)
        const activeTint = "bg-black/5 dark:bg-white/5"; 
        
        if (isActive) return activeTint;
        return `group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-300`;
    };

    return (
        <div
            ref={cardRef}
            {...rest}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={`group relative cursor-pointer bg-card-primary border rounded-xl p-4 flex flex-col items-center aspect-square render-fast-square ${
                isSelected ? 'border-blue-500 shadow-md' : 'border-border-primary'
            } ${getTransformClasses()}`}
            role="button"
            aria-label={`Select item: ${name}`}
            aria-pressed={isSelected}
            title={name}
        >
            {/* ⭐ TINT LAYER: Handles the visual highlight without affecting the image inside */}
            <div className={`absolute inset-0 rounded-xl pointer-events-none ${getTintClasses()}`} />

            {isSelectionMode && (
                <div
                    className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                        isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white/50 dark:bg-bg-active border-border-tertiary'
                    }`}
                >
                    {isSelected && <CheckmarkIcon className="w-3 h-3 text-white" />}
                </div>
            )}

            {!isSelectionMode && onCopy && (
                <button
                    onClick={handleCopyClick}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-card-primary/90 border border-border-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-bg-active focus:outline-none focus-visible:opacity-100"
                    title="Copy to clipboard"
                >
                    {isCopied ? (
                        <CheckmarkIcon className="w-4 h-4 text-green-500" />
                    ) : (
                        <CopyIcon className="w-4 h-4 text-text-secondary" />
                    )}
                </button>
            )}

            {/* Content Container - Ensure it sits above the tint layer */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                {children}
            </div>

            <p className="text-xs text-center text-text-secondary group-hover:text-text-primary truncate w-full flex-shrink-0 relative z-10">
                {name}
            </p>
        </div>
    );
});

export default memo(BaseCard);