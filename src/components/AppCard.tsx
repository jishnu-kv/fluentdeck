import React, { useState, memo, useCallback, useMemo } from 'react';
import { AppData, CollectionItem } from '@/types';
import { getColorForString } from '@/utils';
import { CheckmarkIcon } from '@/components/Icons';

interface AppCardProps {
	app: AppData;
	index: number;
	onContextMenu?: (event: React.MouseEvent, app: AppData) => void;
	isSelectionMode?: boolean;
	isSelected?: boolean;
	onToggleSelection?: (item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType']) => void;
	isLCP?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
	app,
	index,
	onContextMenu,
	isSelectionMode,
	isSelected,
	onToggleSelection,
	isLCP = false
}) => {
	// Choose image source (local .webp first, then remote URL)
	const imageSrc = useMemo(() => {
		if (!app.logo_url) return null;
		// Prefer local optimized webp paths
		if (app.logo_url.startsWith('/assets/apps/')) return app.logo_url;
		// Ensure https for remote
		return app.logo_url.replace(/^http:/, 'https:');
	}, [app.logo_url]);

	const [logoStatus, setLogoStatus] = useState<'loading' | 'loaded' | 'error'>(imageSrc ? 'loading' : 'error');
	const firstLetter = app.name.charAt(0).toUpperCase();
	const colorClasses = getColorForString(app.name);

	const handleLogoLoad = () => setLogoStatus('loaded');
	const handleLogoError = () => setLogoStatus('error');

	const priceStyles = {
		Free: 'bg-bg-active text-text-secondary',
		FOSS: 'bg-green-900/20 text-green-300',
		Paid: 'bg-orange-900/20 text-orange-300'
	}[app.price];

	const handleCardClick = (e: React.MouseEvent) => {
		// If in selection mode, prevent navigation and toggle selection
		if (isSelectionMode && onToggleSelection) {
			e.preventDefault();
			onToggleSelection(app, 'app');
		}
	};

	const handleContextMenu = useCallback((event: React.MouseEvent) => {
		if (!isSelectionMode && onContextMenu) {
			event.preventDefault();
			onContextMenu(event, app);
		}
	}, [onContextMenu, app, isSelectionMode]);

	return (
		<a
			href={isSelectionMode ? undefined : app.link}
			target={isSelectionMode ? undefined : "_blank"}
			rel="noopener noreferrer"
			onContextMenu={handleContextMenu}
			onClick={handleCardClick}
			className={`bg-card-primary border rounded-xl flex flex-col group h-full overflow-hidden opacity-0 animate-fadeIn relative block no-underline cursor-pointer ${isSelected ? 'border-blue-500 shadow-md' : 'border-border-primary'} ${!isSelectionMode ? 'hover:brightness-95 duration-300 transition-transform hover:-translate-y-1' : ''
				}`}
			style={{ animationDelay: `${index * 25}ms` }}
			role={isSelectionMode ? 'button' : 'link'}
			aria-pressed={isSelectionMode ? isSelected : undefined}
		>
			{isSelectionMode && (
				<div
					className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${isSelected
							? 'bg-blue-500 border-blue-500'
							: 'bg-bg-active border-border-tertiary'
						}`}
				>
					{isSelected && <CheckmarkIcon className="w-3 h-3 text-white" />}
				</div>
			)}

			{/* Image Container */}
			<div
				className="block flex items-center justify-center bg-bg-active p-4 h-32 relative overflow-hidden"
			>
				{/* Hover Background Effect */}
				{imageSrc && (
					<div
						aria-hidden="true"
						style={{ backgroundImage: `url(${imageSrc})` }}
						className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-0 group-hover:opacity-10"
					/>
				)}
				{/* Hover Background for Fallback */}
				{!imageSrc && (
					<div
						aria-hidden="true"
						className={`absolute inset-0 blur-3xl scale-110 opacity-0 group-hover:opacity-40 ${colorClasses}`}
					/>
				)}
				{/* Gradient Overlay on hover */}
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100"
				/>

				{/* Fallback: First Letter Block */}
				{(logoStatus === 'loading' || logoStatus === 'error' || !imageSrc) && (
					<div
						className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${colorClasses}`}
					>
						{firstLetter}
					</div>
				)}

				{/* Main Logo */}
				{imageSrc && logoStatus !== 'error' && (
					<img
						src={imageSrc}
						alt={`${app.name} logo`}
						loading={isLCP ? "eager" : "lazy"}
						fetchPriority={isLCP ? "high" : "low"}
						decoding="async"
						width={64}
						height={64}
						className={`w-12 h-12 rounded-lg object-contain absolute ${logoStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
							}`}
						onLoad={handleLogoLoad}
						onError={handleLogoError}
						referrerPolicy="no-referrer"
					/>
				)}
			</div>

			{/* Card Footer */}
			<div className="p-4 border-t border-border-secondary flex flex-col flex-grow text-left">
				{/* Title */}
				<div className="block">
					<p className="text-sm font-semibold text-text-primary group-hover:text-accent">
						{app.name}
					</p>
				</div>

				<div className="mt-auto pt-2 flex items-center justify-between text-xs font-medium">
					<span className="text-text-secondary">{app.tag}</span>
					<span className={`px-2 py-0.5 rounded-full ${priceStyles}`}>{app.price}</span>
				</div>
			</div>
		</a>
	);
};

export default memo(AppCard);