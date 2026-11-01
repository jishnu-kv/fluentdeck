import React, { useState, useEffect } from 'react';
import { IconStyleType, IconType } from '@/types';

interface IconDisplayProps {
	icon: IconType;
	style: IconStyleType;
	className?: string;
	width?: number;
	height?: number;
	containerStyle?: React.CSSProperties;
	urlResolver: (icon: IconType, style: IconStyleType) => string;
}

const IconDisplay: React.FC<IconDisplayProps> = ({ icon, style, className, urlResolver, containerStyle, width, height }) => {
	const [svgContent, setSvgContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		setSvgContent(null);
		setIsLoading(true);
		const url = urlResolver(icon, style);

		if (!url) {
			console.error("No URL provided for icon:", icon, style);
			setIsLoading(false);
			return;
		}

		fetch(url)
			.then(res => res.ok ? res.text() : Promise.reject(res.statusText))
			.then(text => {
				if (isMounted) {
					if (text.startsWith('<svg')) {
						let processedSvg = text.trim()
							.replace(/width=".*?"/, `width="${width || '100%'}"`)
							.replace(/height=".*?"/, `height="${height || '100%'}"`);

						// Only replace fill for non-color styles
						if (style !== 'Color') {
							processedSvg = processedSvg.replace(/fill=".*?"/g, 'fill="currentColor"');
						}
						setSvgContent(processedSvg);
					} else {
						// Not an SVG, probably an error or unexpected content
						console.error("Fetched content is not SVG for icon:", icon.name, style);
						setSvgContent(null);
					}
				}
			})
			.catch(err => {
				if (isMounted) {
					console.error(`Failed to fetch icon: ${icon.name} from ${url}`, err);
					setSvgContent(null);
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});
		return () => { isMounted = false; };
	}, [icon, style, urlResolver, width, height]);

	if (isLoading) {
		return <div className={className} style={containerStyle} />;
	}

	if (!svgContent) {
		// Fallback or error indicator when content is not available
		return (
			<div className={`${className} flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm`} style={containerStyle}>
				?
			</div>
		);
	}

	return (
		<div
			className={`flex items-center justify-center [&>svg]:block [&>svg]:shrink-0 [backface-visibility:hidden] [transform:translateZ(0)] ${className || ''}`}
			style={containerStyle}
			dangerouslySetInnerHTML={{ __html: svgContent }}
		/>
	);
};

export default IconDisplay;