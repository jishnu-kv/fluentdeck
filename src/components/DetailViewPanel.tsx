import React, { useState, useEffect, useCallback } from 'react';
import { XIcon } from '@/components/Icons';

interface DetailViewPanelProps {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	headerActions?: React.ReactNode;
}

export const DetailViewPanel: React.FC<DetailViewPanelProps> = ({ title, onClose, children, headerActions }) => {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		// Wait for animation to complete before calling onClose
		setTimeout(() => {
			onClose();
		}, 350); // Match the animation duration
	}, [onClose]);

	// Prevent closing during animation
	const handleAnimationEnd = useCallback(() => {
		if (isClosing) {
			onClose();
		}
	}, [isClosing, onClose]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleClose]);

	useEffect(() => {
		if (isClosing) {
			document.documentElement.classList.remove('detail-view-open');
		} else {
			document.documentElement.classList.add('detail-view-open');
		}
		return () => {
			document.documentElement.classList.remove('detail-view-open');
		};
	}, [isClosing]);

	return (
		<div 
			className={`fixed bottom-0 left-0 right-0 lg:top-16 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[460px] lg:h-[calc(100vh-64px)] z-40 flex flex-col max-h-[90vh] lg:max-h-none bg-bg-secondary border-t lg:border-t-0 lg:border-l border-border-primary shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] lg:shadow-[-4px_0_12px_rgba(0,0,0,0.05)] lg:dark:shadow-[-4px_0_12px_rgba(0,0,0,0.2)] mt-16 md:mt-0 lg:mt-0 ${isClosing ? 'animate-slideDown lg:animate-slideOutRight' : 'animate-slideUp lg:animate-slideInRight'}`}
			onAnimationEnd={handleAnimationEnd}
		>
			{/* Header */}
			<div className="p-4 border-b border-border-primary flex justify-between items-center flex-shrink-0">
				<h2 className="font-semibold text-lg text-text-primary truncate">{title}</h2>
				<div className="flex items-center gap-2">
					{headerActions}
					<button 
						onClick={handleClose} 
						className="p-1 rounded-full text-text-secondary hover:bg-bg-active focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label="Close detail view"
					>
						<XIcon className="w-5 h-5" aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-4 lg:p-6 xl:p-6 overflow-y-auto">
				{children}
			</div>
		</div>
	);
};