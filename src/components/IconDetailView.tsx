import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
	HtmlIcon, SvgIcon, ReactIcon,
	VueIcon, ShareIcon, XIcon
} from "@/components/Icons";
import { ColorCustomizationPanel } from "@/components/ColorCustomizationPanel";
import { ActionRow } from '@/components/ActionRow';
import { Tabs } from "@/components/SegmentedControl";
import { CollectionMenu } from '@/components/CollectionMenu';
import { DetailViewPanel } from '@/components/DetailViewPanel';
import { ThemeContext } from "@/App";
import { IconStyleType, IconType } from "@/types";
import { getIconUrl, sanitizeSvg } from "@/utils";
import { useToast } from "@/contexts/ToastContext";

// --- LAYOUT CONFIGURATION ---
const SECTION_WIDTHS = {
	preview: "340px",
	colorCustomization: "340px"
};

const GRADIENT_ID = "customGradientDetail";
const GRADIENT_REGEX = /^grad-([0-9a-fA-F]{6})-([0-9a-fA-F]{6})$/;

type Format = "svg" | "html" | "react" | "vue";

export const IconDetailView: React.FC<{
	icon: IconType;
	selectedStyle: IconStyleType;
	onClose: () => void;
	onStyleChange: (style: IconStyleType) => void;
	showCollectionControls?: boolean;
}> = ({ icon, selectedStyle, onClose, onStyleChange, showCollectionControls = true }) => {

	// ------------------------------------------------
	//     SHARE URL (ID LOOKUP) — SAME AS EMOJI VIEW
	// ------------------------------------------------
	const [iconIdMap, setIconIdMap] = useState<{ name: string; id: string }[]>([]);
	const { addToast } = useToast();

	useEffect(() => {
		fetch("/data/icon_url.json")
			.then(res => res.json())
			.then(data => setIconIdMap(data))
			.catch(() => console.error("Failed to load icon_url.json"));
	}, []);

	const getIconId = (name: string): string | null => {
		const entry = iconIdMap.find(e => e.name === name);
		return entry?.id ?? null;
	};

	const handleShareUrl = () => {
		const id = getIconId(icon.name);

		if (!id) {
			addToast("No sharable ID found for this icon.", "error");
			return;
		}

		const shareUrl = `${window.location.origin}/icons/${id}?style=${encodeURIComponent(selectedStyle)}`;
		navigator.clipboard.writeText(shareUrl);

		addToast("Icon link copied!", "success");
	};

	const [svgContent, setSvgContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [copiedFormat, setCopiedFormat] = useState<Format | null>(null);
	const [showColorCustomizer, setShowColorCustomizer] = useState(false);
	const [selectedSize, setSelectedSize] = useState<string>('24');
	const [color, setColor] = useState("currentColor");

	const themeContext = useContext(ThemeContext);
	if (!themeContext) throw new Error("Context missing");

	const { theme } = themeContext;
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const update = () => setIsDark(theme === "dark" || (theme === "system" && mq.matches));
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, [theme]);

	const customizerRef = useRef<HTMLDivElement>(null);
	const triggerButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!showColorCustomizer) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (
				customizerRef.current &&
				!customizerRef.current.contains(event.target as Node) &&
				triggerButtonRef.current &&
				!triggerButtonRef.current.contains(event.target as Node)
			) {
				setShowColorCustomizer(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showColorCustomizer]);

	const availableSizes = useMemo(() => {
		const styleKey = selectedStyle.toLowerCase() as 'filled' | 'regular' | 'color';
		const sizes = icon.styles[styleKey];
		return sizes ? Object.keys(sizes).sort((a, b) => Number(a) - Number(b)) : [];
	}, [icon, selectedStyle]);

	useEffect(() => {
		if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
			setSelectedSize(availableSizes.includes('24') ? '24' : availableSizes[0] || '');
		}
	}, [selectedStyle, availableSizes, selectedSize]);

	const iconFilenameBase = useMemo(() => {
		const styleKey = selectedStyle.toLowerCase() as 'filled' | 'regular' | 'color';
		const base = icon.styles[styleKey]?.[selectedSize] || icon.name.replace(/\s+/g, "_");
		return base.replace('.svg', '');
	}, [icon, selectedStyle, selectedSize]);

	useEffect(() => {
		if (!selectedSize) return;
		setIsLoading(true);
		const url = getIconUrl(icon, selectedStyle, selectedSize);

		fetch(url)
			.then((res) => (res.ok ? res.text() : Promise.reject(res.statusText)))
			.then((text) => setSvgContent(text.startsWith("<svg") ? sanitizeSvg(text) : null))
			.catch(() => setSvgContent(null))
			.finally(() => setIsLoading(false));
	}, [icon, selectedStyle, selectedSize]);

	const getGradientDefinition = (startColor: string, endColor: string, id: string): string => {
		return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="${startColor}"/>
					<stop offset="100%" stop-color="${endColor}"/>
				</linearGradient>`;
	};

	const applyColor = (svg: string | null, c: string): string => {
		if (!svg) return "";
		if (selectedStyle === 'Color') return svg;

		let processedSvg = svg;
		const gradientMatch = c.match(GRADIENT_REGEX);

		processedSvg = processedSvg.replace(/<defs>.*?<\/defs>/gs, "");

		if (gradientMatch) {
			const startColor = `#${gradientMatch[1]}`;
			const endColor = `#${gradientMatch[2]}`;

			const gradientDef = getGradientDefinition(startColor, endColor, GRADIENT_ID);
			processedSvg = processedSvg.replace(/<svg(.*?)>/, `<svg$1><defs>${gradientDef}</defs>`);

			const gradientUrl = `url(#${GRADIENT_ID})`;
			return processedSvg
				.replace(/fill="currentColor"/g, `fill="${gradientUrl}"`)
				.replace(/fill="#[0-9a-fA-F]+"/g, `fill="${gradientUrl}"`)
				.replace(/fill='#[0-9a-fA-F]+'/g, `fill='${gradientUrl}'`);
		} else {
			const final = c === "currentColor" ? (isDark ? "#fff" : "#000") : c;

			return processedSvg
				.replace(/fill="currentColor"/g, `fill="${final}"`)
				.replace(/fill="#[0-9a-fA-F]+"/g, `fill="${final}"`)
				.replace(/fill='#[0-9a-fA-F]+'/g, `fill='${final}'`);
		}
	};

	const getExportContent = (format: Format): string | null => {
		if (!svgContent) return null;
		const txt = applyColor(svgContent, color);

		switch (format) {
			case "svg": return txt;
			case "html": return `<img src="data:image/svg+xml;base64,${btoa(txt)}" alt="${iconFilenameBase}" />`;
			case "react": return `export function ${iconFilenameBase}Icon(props) { return (${txt.replace(/<svg (.*?)>/, `<svg $1 {...props}>`)}) }`;
			case "vue": return `<template>${txt}</template>`;
			default: return null;
		}
	};

	const handleCopy = async (format: Format) => {
		const content = getExportContent(format);
		if (!content) return;

		await navigator.clipboard.writeText(content);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 2000);
	};

	const handleDownload = (format: Format) => {
		const content = getExportContent(format);
		if (!content) return;

		const extension = format === 'react' ? 'jsx' : format === 'vue' ? 'vue' : 'svg';
		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.download = `${iconFilenameBase}.${extension}`;
		a.href = url;
		a.click();

		URL.revokeObjectURL(url);
	};

	const styleAvailability = Object.entries(icon.styles).map(([key, value]) => ({
		key,
		label: key.charAt(0).toUpperCase() + key.slice(1),
		enabled: value && Object.keys(value).length > 0,
	}));

	const enabledCount = styleAvailability.filter(s => s.enabled).length;


	// --------------------------------
	//           RENDER
	// --------------------------------
	return (
		<DetailViewPanel
			title={icon.name}
			onClose={onClose}
			headerActions={
				<div className="flex items-center gap-2">

					{/* SHARE BUTTON */}
					<button
						onClick={handleShareUrl}
						className="p-1 rounded-full text-text-secondary hover:bg-bg-active transition"
						title="Copy share URL"
					>
						<ShareIcon className="w-6 h-6" />
					</button>

					{showCollectionControls && (
						<CollectionMenu
							item={icon}
							selectedStyle={selectedStyle}
							itemType="icon"
							onCloseDetail={onClose}
						/>
					)}
				</div>
			}
		>
			<div className="flex flex-col gap-6 lg:min-h-[calc(100vh-230px)] overflow-visible">

				{/* 1. Preview Section */}
				<div className="w-full flex-grow flex flex-col">

					{/* Preview Container */}
					<div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-bg-primary border border-border-primary min-h-[256px] relative max-w-full">
						<div className="absolute inset-0 opacity-5 dark:opacity-100"
							style={{
								backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
								backgroundSize: "10px 10px",
								opacity: 0.02
							}}
						/>
						<div className="relative z-10 flex items-center justify-center text-text-primary">
							{isLoading && !svgContent ? (
								<div className="w-8 h-8 border-2 border-border-primary border-t-blue-500 rounded-full animate-spin" />
							) : (
								svgContent && (
									<div className="flex items-center justify-center">
										{/* Preview scale wrapper */}
										<div className="scale-[4]">
											<div
												dangerouslySetInnerHTML={{
													__html: sanitizeSvg(
														applyColor(svgContent, color).replace(
															/<svg([^>]*)>/,
															`<svg$1 width="${selectedSize}" height="${selectedSize}">`
														)
													)
												}}
											/>
										</div>
									</div>
								)
							)}
						</div>

						{/* Floating Paintbrush Color Trigger & Popover Overlay */}
						{selectedStyle !== "Color" && (
							<>
								<button
									ref={triggerButtonRef}
									onClick={() => setShowColorCustomizer(prev => !prev)}
									className="absolute bottom-3 right-3 z-20 p-2.5 rounded-full bg-bg-secondary border border-border-primary text-text-primary shadow-md hover:bg-bg-active focus:outline-none transition-colors"
									title="Customize Color"
								>
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
									</svg>
								</button>

								{showColorCustomizer && (
									<div ref={customizerRef} className="absolute top-48 right-14 z-30 w-72 p-4 bg-bg-secondary border border-border-primary rounded-xl shadow-xl animate-scaleIn">
										<ColorCustomizationPanel
											color={color}
											onColorChange={setColor}
											isDark={isDark}
										/>
									</div>
								)}
							</>
						)}
					</div>

					{/* Style Switcher */}
					<div className={`mt-4 ${enabledCount <= 1 ? 'opacity-50 pointer-events-none' : ''}`}>
						<Tabs
							options={styleAvailability
								.filter(s => s.enabled)
								.map(s => ({
									value: s.label,
									label: s.label,
								}))}
							value={selectedStyle}
							onChange={(v) => {
								const normalized = v.toLowerCase() as keyof IconType['styles'];
								if (icon.styles[normalized] && Object.keys(icon.styles[normalized]).length > 0) {
									onStyleChange(v as IconStyleType);
								}
							}}
						/>
					</div>
				</div>

				{/* 3. EXPORT OPTIONS */}
				<div className="w-full flex flex-col lg:justify-end lg:mt-auto">
					{/* Title */}
					<h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
						Export Options
					</h3>

					{/* Size Switcher */}
					{availableSizes.length > 1 && (
						<div className="mb-4">
							<Tabs
								options={availableSizes.map(s => ({ value: s, label: `${s}px` }))}
								value={selectedSize}
								onChange={(v) => setSelectedSize(v as string)}
							/>
						</div>
					)}

					{/* Export buttons */}
					<div className="flex flex-col space-y-2">
						<ActionRow
							title="SVG Code"
							description="Raw SVG markup"
							onCopy={() => handleCopy('svg')}
							onDownload={() => handleDownload('svg')}
							isCopied={copiedFormat === 'svg'}
							icon={<SvgIcon className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="HTML"
							description="Copy as <img> tag"
							onCopy={() => handleCopy('html')}
							isDownloadDisabled={true}
							isCopied={copiedFormat === 'html'}
							icon={<HtmlIcon className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="React Component"
							description="Copy as React JSX component"
							onCopy={() => handleCopy('react')}
							onDownload={() => handleDownload('react')}
							isCopied={copiedFormat === 'react'}
							icon={<ReactIcon className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="Vue Component"
							description="Copy as Vue template"
							onCopy={() => handleCopy('vue')}
							onDownload={() => handleDownload('vue')}
							isCopied={copiedFormat === 'vue'}
							icon={<VueIcon className="w-5 h-5 text-text-primary" />}
						/>
					</div>
				</div>
			</div>
		</DetailViewPanel>
	);
};
