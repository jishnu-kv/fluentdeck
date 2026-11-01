import React, { useState, useRef } from 'react';
import { CheckmarkIcon, EyedropperIcon, ResetIcon } from '@/components/Icons';
import { Tabs } from '@/components/SegmentedControl';

const presetColors = [
    "#000000", "#333333", "#666666", "#999999", "#CCCCCC",
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4",
    "#3B82F6", "#8B5CF6", "#EC4899", "#F43F5E"
];

const gradientPalettes = [
    { start: "#0094F0", end: "#2764E7" }, // Blue to Dark Blue
    { start: "#16BBDA", end: "#2052CB" }, // Cyan to Blue/Indigo
    { start: "#0CA4F0", end: "#C015C8" }, // Sky Blue to Deep Fuchsia
    { start: "#36D1DC", end: "#5B86E5" }, // Turquoise to Royal Blue
    { start: "#B3E0FF", end: "#8CD0FF" }, // Light Sky Blue to Soft Blue
    { start: "#9C6CFE", end: "#5B2AB5" }, // Soft Violet to Deep Purple
    { start: "#5A667F", end: "#313D55" }, // Steel Slate to Midnight Navy
    { start: "#DCF8FF", end: "#FF6CE8" }, // Ice Blue to Neon Pink
    { start: "#52D17C", end: "#22918B" }, // Green to Teal/Emerald
    { start: "#43E97B", end: "#38F9D7" }, // Bright Lime to Mint Green
    { start: "#E656EB", end: "#D7257D" }, // Pink to Magenta
    { start: "#DD3CE2", end: "#5B2AB5" }, // Purple to Dark Violet
    { start: "#FF921F", end: "#EB4824" }, // Orange to Red (Paw/Fire)
    { start: "#FF6F47", end: "#FFCD0F" }, // Coral/Salmon to Yellow
    { start: "#F83F54", end: "#CA2134" }, // Yellow/Gold to Red
];

const GRADIENT_REGEX = /^grad-([0-9a-fA-F]{6})-([0-9a-fA-F]{6})$/;

interface ColorCustomizationPanelProps {
    color: string;
    onColorChange: (color: string) => void;
    isDark: boolean;
}

export const ColorCustomizationPanel: React.FC<ColorCustomizationPanelProps> = ({ color, onColorChange, isDark }) => {
    const [colorPaletteMode, setColorPaletteMode] = useState<'solid' | 'gradient'>(
        color.match(GRADIENT_REGEX) ? 'gradient' : 'solid'
    );
    const [customColor, setCustomColor] = useState("#FFFFFF");
    const colorPickerRef = useRef<HTMLInputElement>(null);

    return (
        <>
            {/* Color Palette */}
            <div className="p-3 rounded-lg border border-border-primary bg-bg-primary h-[calc(100%-2rem)]">
                {colorPaletteMode === 'solid' ? (
                    <div className="h-full flex flex-col justify-center">
                        <div className="grid grid-cols-4 gap-x-8 gap-y-10 justify-items-center justify-center">
                            {presetColors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => onColorChange(c)}
                                    className="w-full aspect-square max-w-[2.5rem] mx-auto rounded-full border border-border-primary flex items-center justify-center hover:scale-105"
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && (
                                        <CheckmarkIcon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                                    )}
                                </button>
                            ))}
                            <button
                                onClick={() => colorPickerRef.current?.click()}
                                className="w-full aspect-square max-w-[2.5rem] mx-auto rounded-full border border-border-primary flex items-center justify-center hover:scale-105 relative"
                                style={{ backgroundColor: customColor }}
                            >
                                <EyedropperIcon className="w-4 h-4 text-text-secondary" />
                                <input
                                    ref={colorPickerRef}
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => {
                                        setCustomColor(e.target.value);
                                        onColorChange(e.target.value);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </button>
                            <button
                                onClick={() => onColorChange("currentColor")}
                                className="w-full aspect-square max-w-[2.5rem] mx-auto rounded-full border border-border-primary flex items-center justify-center hover:scale-105"
                            >
                                <ResetIcon className="w-4 h-4 text-text-secondary" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col justify-center">
                        <div className="grid grid-cols-4 gap-x-8 gap-y-10 justify-items-center justify-center">
                            {gradientPalettes.map((g) => {
                                const gradStr = `grad-${g.start.substring(1)}-${g.end.substring(1)}`;
                                return (
                                    <button
                                        key={gradStr}
                                        onClick={() => onColorChange(gradStr)}
                                        className="w-full aspect-square max-w-[2.5rem] mx-auto rounded-full border border-border-primary flex items-center justify-center hover:scale-105"
                                        style={{ backgroundImage: `linear-gradient(45deg, ${g.start}, ${g.end})` }}
                                    >
                                        {color === gradStr && (
                                            <CheckmarkIcon className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => onColorChange("currentColor")}
                                className="w-full aspect-square max-w-[2.5rem] mx-auto rounded-full border border-border-primary flex items-center justify-center hover:scale-105"
                            >
                                <ResetIcon className="w-4 h-4 text-text-secondary" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SOLID / GRADIENT TABS */}
            <div className="mt-4">
                <Tabs
                    options={[
                        { value: 'solid', label: 'Solid' },
                        { value: 'gradient', label: 'Gradient' }
                    ]}
                    value={colorPaletteMode}
                    onChange={(mode) => {
                        const m = mode as 'solid' | 'gradient';
                        if (m === 'solid' && color.match(GRADIENT_REGEX)) {
                            onColorChange("currentColor");
                        }
                        setColorPaletteMode(m);
                    }}
                />
            </div>
        </>
    );
};
