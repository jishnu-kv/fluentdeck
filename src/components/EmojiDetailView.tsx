import React, { useState, useContext, useMemo, useEffect } from 'react';
import { EmojiData, EmojiStyle, emojiStyles, EMOJI_ASSET_URL_BASE } from '@/constants';
import { LinkIcon, SymbolIcon, UnicodeIcon, CopyIcon as CopyIconFeather, ChevronDownIcon, ShareIcon } from '@/components/Icons';
import { CollectionsContext } from '@/App';
import { useToast } from '@/contexts/ToastContext';
import { Tabs } from '@/components/SegmentedControl';
import { getEmojiWebpUrl, getEmojiOriginalUrl, copyImageToClipboard } from '@/utils';
import { CollectionMenu } from '@/components/CollectionMenu';
import { DetailViewPanel } from '@/components/DetailViewPanel';
import { ActionRow } from '@/components/ActionRow';

interface EmojiDetailViewProps {
	emoji: EmojiData & { name: string };
	selectedStyle: keyof EmojiStyle;
	onClose: () => void;
	onStyleChange: (style: keyof EmojiStyle) => void;
	showCollectionControls?: boolean;
}

type ExportFormat = 'PNG' | 'SVG' | 'WebP';
type CopiedField = 'url' | 'symbol' | 'unicode' | 'image' | 'download' | null;

export const EmojiDetailView: React.FC<EmojiDetailViewProps> = ({
	emoji,
	selectedStyle,
	onClose,
	onStyleChange,
	showCollectionControls = true
}) => {

	// ------------------------------
	// State
	// ------------------------------
	const [copiedField, setCopiedField] = useState<CopiedField>(null);
	const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG');
	const [emojiIdMap, setEmojiIdMap] = useState<{ name: string; id: string }[]>([]);

	const { addToast } = useToast();
	const collectionsContext = useContext(CollectionsContext);
	if (!collectionsContext) throw new Error("CollectionsContext not found");

	// ------------------------------
	// Dynamic format options based on style
	// ------------------------------
	const isSvgStyle = ['Color', 'Flat', 'High Contrast'].includes(selectedStyle);

	useEffect(() => {
		if (isSvgStyle) {
			if (exportFormat === 'PNG') {
				setExportFormat('SVG');
			}
		} else {
			if (exportFormat === 'SVG') {
				setExportFormat('PNG');
			}
		}
	}, [selectedStyle, isSvgStyle, exportFormat]);

	const formatOptions = useMemo(() => {
		if (isSvgStyle) {
			return [
				{ value: 'SVG', label: 'SVG' },
				{ value: 'WebP', label: 'WebP' }
			];
		} else {
			return [
				{ value: 'PNG', label: 'PNG' },
				{ value: 'WebP', label: 'WebP' }
			];
		}
	}, [isSvgStyle]);

	// ------------------------------
	// Load ID mapping
	// ------------------------------
	useEffect(() => {
		fetch("/data/emoji_url.json")
			.then(res => res.json())
			.then(data => setEmojiIdMap(data))
			.catch(() => console.error("Failed to load emoji_url.json"));
	}, []);

	const getEmojiId = (name: string): string | null => {
		const entry = emojiIdMap.find(e => e.name === name);
		return entry?.id ?? null;
	};

	// ------------------------------
	// Core URLs
	// ------------------------------
	const imageUrl = getEmojiWebpUrl(emoji, selectedStyle) || '';
	const exportFileType = isSvgStyle ? 'SVG' : 'PNG';
	const isMono = selectedStyle === 'High Contrast';

	const originalImageUrl = useMemo(() => {
		const relative = getEmojiOriginalUrl(emoji, selectedStyle);
		return relative ? `${EMOJI_ASSET_URL_BASE}${relative.substring(1)}` : '';
	}, [emoji, selectedStyle]);

	const exportImageUrl = useMemo(() => {
		if (exportFormat === 'WebP') {
			const relative = getEmojiWebpUrl(emoji, selectedStyle);
			return relative ? `${EMOJI_ASSET_URL_BASE}${relative.substring(1)}` : '';
		}
		return originalImageUrl;
	}, [originalImageUrl, emoji, selectedStyle, exportFormat]);

	// ------------------------------
	// Copy functions
	// ------------------------------
	const markCopied = (field: CopiedField) => {
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleCopy = (text: string, field: CopiedField) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		markCopied(field);
	};

	const handleCopyImage = async () => {
		try {
			const is3DOrAnimated = selectedStyle === '3D' || selectedStyle === 'Animated';
			const relative = is3DOrAnimated
				? getEmojiOriginalUrl(emoji, selectedStyle)
				: getEmojiWebpUrl(emoji, selectedStyle);

			if (!relative) return;

			const fullUrl = relative.startsWith('/')
				? `${EMOJI_ASSET_URL_BASE}${relative.substring(1)}`
				: relative;

			await copyImageToClipboard(fullUrl);

			markCopied('image');
		} catch {
			addToast('Failed to copy image.', 'error');
		}
	};

	const handleDownload = async () => {
		try {
			const response = await fetch(originalImageUrl);
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;

			const ext = originalImageUrl.split('.').pop() || 'png';
			a.download = `${emoji.name.replace(/\s+/g, '_')}_${selectedStyle}.${ext}`;

			a.click();
			URL.revokeObjectURL(url);
		} catch {
			addToast('Download failed.', 'error');
		}
	};

	// ------------------------------
	// SHARE BUTTON
	// ------------------------------
	const handleShareUrl = () => {
		const id = getEmojiId(emoji.name);

		if (!id) {
			addToast("No sharable ID found for this emoji.", "error");
			return;
		}

		const shareUrl = `${window.location.origin}/emoji/${id}?style=${encodeURIComponent(selectedStyle)}`;
		navigator.clipboard.writeText(shareUrl);

		markCopied("url");
		addToast("Emoji link copied!", "success");
	};

	// ------------------------------
	// Render
	// ------------------------------
	const styleOptions = emojiStyles.map(s => ({
		value: s.value,
		label: s.label,
		tooltip: s.tooltip
	}));

	return (
		<DetailViewPanel
			title={emoji.name}
			onClose={onClose}
			headerActions={
				<div className="flex items-center gap-2">
					<button
						onClick={handleShareUrl}
						className="p-1 rounded-full text-text-secondary hover:bg-bg-active transition"
						title="Copy share URL"
					>
						<ShareIcon className="w-5 h-5" />
					</button>

					{showCollectionControls && (
						<CollectionMenu
							item={emoji}
							selectedStyle={selectedStyle}
							itemType="emoji"
							onCloseDetail={onClose}
						/>
					)}
				</div>
			}
		>
			<div className="flex flex-col gap-6 lg:min-h-[calc(100vh-230px)]">
				{/* IMAGE PANEL */}
				<div className="w-full flex-grow flex flex-col space-y-4">
					<div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl text-text-primary bg-bg-primary border border-border-primary min-h-[256px] relative max-w-full">
						<div
							className="absolute inset-0 opacity-5 dark:opacity-100"
							style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "10px 10px", opacity: 0.02 }}
						/>
						<div className="w-1/2 h-1/2 relative z-10 flex items-center justify-center">
							<img
								src={imageUrl}
								alt={emoji.name}
								className={`w-full h-full object-contain ${isMono ? "dark:filter dark:invert" : ""}`}
							/>
						</div>
					</div>

					<Tabs
						options={styleOptions}
						value={selectedStyle}
						onChange={(v) => onStyleChange(v as keyof EmojiStyle)}
					/>
				</div>

				{/* ACTION PANEL */}
				<div className="flex-1 min-w-0 flex flex-col space-y-4 lg:justify-end lg:mt-auto">
					<div className="flex justify-between items-center">
						<h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
							Export Options
						</h3>

						<div className="w-auto">
							<Tabs
								options={formatOptions}
								value={exportFormat}
								onChange={(val) => setExportFormat(val as ExportFormat)}
								className="!h-[32px] !p-0.5 min-w-[150px]"
								tabButtonClassName="!text-xs !py-0 !px-2.5"
							/>
						</div>
					</div>

					<div className="flex flex-col space-y-3">
						<ActionRow
							title={`Copy Image / Download ${exportFileType}`}
							description={`Copy as ${exportFormat} or download as ${exportFileType}`}
							onCopy={handleCopyImage}
							onDownload={handleDownload}
							isCopied={copiedField === 'image'}
							icon={<CopyIconFeather className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="Copy URL"
							description={exportImageUrl}
							onCopy={() => handleCopy(exportImageUrl, 'url')}
							isCopied={copiedField === 'url'}
							icon={<LinkIcon className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="Copy Symbol"
							description={emoji.glyph}
							onCopy={() => handleCopy(emoji.glyph, 'symbol')}
							isCopied={copiedField === 'symbol'}
							icon={<SymbolIcon className="w-5 h-5 text-text-primary" />}
						/>

						<ActionRow
							title="Copy Unicode"
							description={emoji.unicode}
							onCopy={() => handleCopy(emoji.unicode, 'unicode')}
							isCopied={copiedField === 'unicode'}
							icon={<UnicodeIcon className="w-5 h-5 text-text-primary" />}
						/>
					</div>
				</div>
			</div>
		</DetailViewPanel>
	);
};