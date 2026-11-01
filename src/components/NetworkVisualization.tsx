import React from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Contributor {
	id: number;
	login: string;
	avatar_url: string;
	html_url: string;
}

interface NetworkVisualizationProps {
	onNavigate: () => void;
	contributors: Contributor[];
	loading: boolean;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ onNavigate, contributors = [], loading }) => {
	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<LoadingSpinner text="Loading community contributors..." />
			</div>
		);
	}

	if (contributors.length === 0) {
		return (
			<div className="relative w-full max-w-4xl mx-auto text-center py-12">
				<p className="text-text-secondary">No contributors to display.</p>
			</div>
		);
	}

	// Split contributors into two balanced rows
	const half = Math.ceil(contributors.length / 2);
	const row1 = contributors.slice(0, half);
	const row2 = contributors.slice(half);

	return (
		<div className="relative w-full max-w-5xl mx-auto select-none">
			{/* Container matching standard Fluent Card aesthetics */}
			<div className="relative rounded-2xl border border-border-primary bg-bg-secondary p-4 sm:p-6 overflow-hidden shadow-sm">
				{/* Header info */}
				<div className="flex items-center justify-between px-1 pb-4 mb-3 border-b border-border-primary text-xs">
					<div className="flex items-center gap-2 text-text-secondary font-medium">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						<span>Active Open Source Community</span>
					</div>
					<div className="flex items-center gap-1.5 text-text-secondary">
						<span className="font-semibold text-text-primary">{contributors.length}</span>
						<span>members</span>
					</div>
				</div>

				{/* Continuous Marquee Track */}
				<div className="relative overflow-hidden space-y-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
					{/* Row 1 */}
					<div className="flex gap-3 animate-marquee-scroll min-w-full shrink-0">
						{[...row1, ...row1].map((contributor, idx) => (
							<a
								key={`r1-${contributor.id}-${idx}`}
								href={contributor.html_url}
								target="_blank"
								rel="noopener noreferrer"
								className="group/card flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card-primary border border-border-primary hover:border-border-tertiary hover:bg-bg-active shadow-sm transition-colors duration-150 shrink-0"
							>
								<img
									src={contributor.avatar_url}
									alt={contributor.login}
									loading="lazy"
									decoding="async"
									width="32"
									height="32"
									className="w-8 h-8 rounded-full object-cover ring-1 ring-border-primary"
								/>
								<div className="flex flex-col text-left">
									<span className="text-xs font-medium text-text-primary group-hover/card:text-accent transition-colors max-w-[110px] truncate">
										{contributor.login}
									</span>
									<span className="text-[10px] text-text-secondary leading-tight">
										Contributor
									</span>
								</div>
							</a>
						))}
					</div>

					{/* Row 2 - Reverse Direction */}
					<div className="flex gap-3 animate-marquee-scroll min-w-full shrink-0 [animation-direction:reverse]">
						{[...row2, ...row2].map((contributor, idx) => (
							<a
								key={`r2-${contributor.id}-${idx}`}
								href={contributor.html_url}
								target="_blank"
								rel="noopener noreferrer"
								className="group/card flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card-primary border border-border-primary hover:border-border-tertiary hover:bg-bg-active shadow-sm transition-colors duration-150 shrink-0"
							>
								<img
									src={contributor.avatar_url}
									alt={contributor.login}
									loading="lazy"
									decoding="async"
									width="32"
									height="32"
									className="w-8 h-8 rounded-full object-cover ring-1 ring-border-primary"
								/>
								<div className="flex flex-col text-left">
									<span className="text-xs font-medium text-text-primary group-hover/card:text-accent transition-colors max-w-[110px] truncate">
										{contributor.login}
									</span>
									<span className="text-[10px] text-text-secondary leading-tight">
										Contributor
									</span>
								</div>
							</a>
						))}
					</div>
				</div>

				{/* Footer bar */}
				<div className="mt-4 pt-3 flex items-center justify-between border-t border-border-primary text-xs text-text-secondary px-1">
					<span className="hidden sm:inline">Windows Fluent Design open source project</span>
					<button
						onClick={onNavigate}
						className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1 ml-auto"
					>
						Become a contributor <span aria-hidden="true">&rarr;</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default NetworkVisualization;
