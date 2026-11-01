import React, { useState, useMemo, useEffect, useContext, useRef, useCallback, startTransition } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FilterListIcon, CheckmarkIcon, AppsIcon, AddIcon } from '@/components/Icons';
import { Tabs, Dropdown } from '@/components/SegmentedControl';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ContentGroup, AppData, CollectionItem } from '@/types';
import AppCard from '@/components/AppCard';
import { AppCardSkeleton } from '@/components/AppCardSkeleton';
import { AppContext, CollectionsContext, usePersistentState } from '@/App';
import { ContextMenu, ContextMenuItem, ContextSubMenuTrigger } from '@/components/ContextMenu';
import { CreateCollectionModal } from '@/components/CreateCollectionModal';
import SearchBar from '@/components/SearchBar';
import FilterLayout from '@/components/FilterLayout';
import { priceOptions, tagOptions } from '@/constants';
import Seo from '@/components/Seo';

// --- Utility Hooks & Functions ---

const useMediaQuery = (query: string) => {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
	useEffect(() => {
		const media = window.matchMedia(query);
		const listener = () => setMatches(media.matches);
		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	}, [query]);
	return matches;
};

const useHashNavigation = (filterBarRef: React.RefObject<HTMLDivElement>, isLoading: boolean) => {
	const location = useLocation();
	useEffect(() => {
		if (isLoading) return;
		const hash = location.hash.substring(1);
		if (hash) {
			const timer = setTimeout(() => {
				document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 150);
			return () => clearTimeout(timer);
		}
	}, [location.hash, isLoading, filterBarRef]);
};

const slugify = (text: string): string => {
	if (!text) return '';
	return text.replace(/<[^>]+>/g, '').toLowerCase()
		.replace(/\s\(.+\)/, '')
		.replace(/&/g, 'and')
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

const MemoizedAppCard = React.memo(AppCard);

// --- Main Component ---

const AppsPage: React.FC = () => {
	const collectionPageSchema = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"name": "WinUI 3 Apps - Fluent Deck",
		"description": "Explore a curated showcase of beautiful WinUI apps that demonstrate the power of Fluent Design.",
		"url": "https://fluentdeck.vercel.app/apps",
		"about": {
			"@type": "SoftwareApplication",
			"name": "WinUI 3 Applications",
			"applicationCategory": "DesignApplication",
			"operatingSystem": "Windows"
		}
	};
	const softwareAppSchema = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Fluent Deck",
		"operatingSystem": "Web",
		"applicationCategory": "DeveloperApplication",
		"description": "An application to showcase Microsoft Fluent emojis and icons, and a curated list of WinUI 3 apps."
	};
	// State
	const [searchParams, setSearchParams] = useSearchParams();
	const searchTerm = searchParams.get('q') || '';

	const setSearchTerm = (value: string) => {
		const newParams = new URLSearchParams(searchParams);
		if (value) newParams.set('q', value);
		else newParams.delete('q');
		setSearchParams(newParams, { replace: true });
	};
	const [selectedPrice, setSelectedPrice] = usePersistentState<string>('apps-selectedPrice', 'All Pricing');
	const [selectedTag, setSelectedTag] = usePersistentState<string>('apps-selectedTag', 'All tags');
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: AppData } | null>(null);
	const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
	const [itemForNewCollection, setItemForNewCollection] = useState<AppData | null>(null);
	const [isClient, setIsClient] = useState(false);
	const [visibleGroupCount, setVisibleGroupCount] = useState(5);
	const [scrollToId, setScrollToId] = useState<string | null>(null);

	// Deferred State for Performance
	const [deferredSearchTerm, setDeferredSearchTerm] = useState(searchTerm);
	const [deferredPrice, setDeferredPrice] = useState(selectedPrice);
	const [deferredTag, setDeferredTag] = useState(selectedTag);

	// Refs
	const filterBarRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Contexts
	const appContext = useContext(AppContext);
	if (!appContext) throw new Error("AppContext not found.");
	const { allContent, categories, categoryMetadata, isLoadingApps, isSelectionMode, toggleSelection, startSelectionMode, isItemSelected, selectAll } = appContext;

	const collectionsContext = useContext(CollectionsContext);
	if (!collectionsContext) throw new Error("CollectionsContext not found");
	const { getCollectionNames, createCollection, addItemToCollection, removeItemFromCollection, isItemInCollection, getCollectionType } = collectionsContext;

	// Hooks
	const isMdOrLarger = useMediaQuery('(min-width: 768px)');
	const location = useLocation();
	const showSkeleton = isLoadingApps && allContent.length === 0;

	useHashNavigation(filterBarRef, showSkeleton);

	// Effects
	useEffect(() => { setIsClient(true); }, []);	

	useEffect(() => { startTransition(() => { setDeferredSearchTerm(searchTerm); }); }, [searchTerm]);
	useEffect(() => { startTransition(() => { setDeferredPrice(selectedPrice); }); }, [selectedPrice]);
	useEffect(() => { startTransition(() => { setDeferredTag(selectedTag); }); }, [selectedTag]);

	// Filtering Logic
	const filteredContent = useMemo((): ContentGroup[] => {
		if (!allContent.length) return [];

		const trimmedSearchTerm = deferredSearchTerm.trim();

		const checkAppMatch = (app: AppData): boolean => {
			if (!trimmedSearchTerm) return true;
			const lowercasedSearchTerm = trimmedSearchTerm.toLowerCase();
			const hasTrailingComma = lowercasedSearchTerm.endsWith(',');
			const searchTerms = lowercasedSearchTerm.split(',').map(t => t.trim()).filter(Boolean);

			if (searchTerms.length === 0) return true;
			if (!deferredSearchTerm.includes(',')) return app.name.toLowerCase().includes(lowercasedSearchTerm);

			return searchTerms.some((term, index) => {
				const isLastTerm = index === searchTerms.length - 1;
				if (isLastTerm && !hasTrailingComma) return app.name.toLowerCase().includes(term);
				else return app.name.toLowerCase() === term;
			});
		};

		return allContent.map(group => {
			const filteredSubgroups = group.subgroups.map(subgroup => {
				const filterApp = (app: AppData): boolean => {
					const searchMatch = checkAppMatch(app);
					const priceMatch = deferredPrice === 'All Pricing' || app.price === deferredPrice;
					const tagMatch = deferredTag === 'All tags' ||
						(app.tags ? app.tags.includes(deferredTag as any) : false) ||
						app.tag === deferredTag ||
						(typeof app.tag === 'string' && app.tag.includes(deferredTag));
					return searchMatch && priceMatch && tagMatch;
				};

				if (subgroup.sections && subgroup.sections.length > 0) {
					const filteredSections = subgroup.sections.map(section => {
						const filteredApps = section.apps.filter(filterApp);
						return { ...section, apps: filteredApps };
					}).filter(section => section.apps.length > 0);

					const allSectionApps = filteredSections.flatMap(s => s.apps);
					return {
						...subgroup,
						sections: filteredSections,
						apps: allSectionApps
					};
				}

				const filteredApps = subgroup.apps.filter(filterApp);
				return { ...subgroup, apps: filteredApps };
			}).filter(subgroup => (subgroup.sections ? subgroup.sections.length > 0 : subgroup.apps.length > 0));

			return { ...group, subgroups: filteredSubgroups };
		}).filter(group => group.subgroups.length > 0);
	}, [allContent, deferredSearchTerm, deferredPrice, deferredTag]);

	const visibleContent = useMemo(() => filteredContent.slice(0, visibleGroupCount), [filteredContent, visibleGroupCount]);

	useEffect(() => {
		startTransition(() => { setVisibleGroupCount(5); });
	}, [deferredSearchTerm, deferredPrice, deferredTag]);

	// Infinite Scroll Observer
	useEffect(() => {
		const observer = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && visibleGroupCount < filteredContent.length) {
				startTransition(() => { setVisibleGroupCount(prev => prev + 5); });
			}
		}, { threshold: 1.0 });

		if (loadMoreRef.current) observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [filteredContent.length, visibleGroupCount]);

	const allItemsForSelection = useMemo(() =>
		filteredContent.flatMap(group => group.subgroups.flatMap(sg => sg.apps.map(app => ({ ...app, itemType: 'app' } as CollectionItem)))),
		[filteredContent]);

	useEffect(() => {
		if (scrollToId) {
			const attemptScroll = () => {
				const element = document.getElementById(scrollToId);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
					setScrollToId(null);
				}
			};
			const timer = setTimeout(attemptScroll, 100);
			return () => clearTimeout(timer);
		}
	}, [visibleGroupCount, scrollToId]);

	// Handlers
	const handleCategorySelect = useCallback((id: string | null) => {
		setIsSidebarOpen(false);
		if (id === null) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

		window.history.pushState(null, '', `#${id}`);
		const element = document.getElementById(id);

		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			startTransition(() => { setVisibleGroupCount(filteredContent.length); });
			setScrollToId(id);
		}
	}, [filteredContent]);

	const handleContextMenu = useCallback((event: React.MouseEvent, app: AppData) => {
		event.preventDefault();
		setContextMenu({ x: event.clientX, y: event.clientY, item: app });
	}, []);

	const closeContextMenu = useCallback(() => setContextMenu(null), []);

	const handleOpenCreateCollectionModal = useCallback((item: AppData) => {
		setItemForNewCollection(item);
		closeContextMenu();
		setShowCreateCollectionModal(true);
	}, [closeContextMenu]);

	const handleCreateCollection = useCallback((newName: string) => {
		if (newName && newName.trim() && itemForNewCollection) {
			if (createCollection(newName.trim())) addItemToCollection(newName.trim(), itemForNewCollection, 'app');
			else alert(`Collection "${newName.trim()}" already exists.`);
		}
		setShowCreateCollectionModal(false);
		setItemForNewCollection(null);
	}, [itemForNewCollection, createCollection, addItemToCollection]);

	const handleSidebarToggle = useCallback(() => setIsSidebarOpen(prev => !prev), []);
	const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
			if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
				event.preventDefault();
				selectAll(allItemsForSelection);
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [selectAll, allItemsForSelection]);

	const filterBarContent = (
		<div className="flex flex-col md:flex-row gap-4 md:items-center">
			<div className="w-full md:flex-1">
				<SearchBar
					searchTerm={searchTerm}
					onSearchTermChange={setSearchTerm}
					placeholder={showSkeleton ? 'Loading apps...' : 'Search apps...'}
					isLoading={isLoadingApps}
				/>
			</div>
			<div className="w-full md:w-auto flex flex-row gap-4 items-center">
				<div className="flex-grow">
					{isMdOrLarger ? (
						<div className="flex gap-4">
							<Tabs options={priceOptions} value={selectedPrice} onChange={setSelectedPrice} />
							<Tabs options={tagOptions} value={selectedTag} onChange={setSelectedTag} />
						</div>
					) : (
						<div className="grid grid-cols-2 gap-4">
							<Dropdown label="Pricing" options={priceOptions} value={selectedPrice} onChange={setSelectedPrice} />
							<Dropdown label="Tags" options={tagOptions} value={selectedTag} onChange={setSelectedTag} />
						</div>
					)}
				</div>
				<button
					onClick={handleSidebarToggle}
					className="flex-shrink-0 h-10 w-10 text-text-secondary bg-bg-secondary border border-border-primary rounded-lg shadow-sm hover:bg-bg-active focus:outline-none flex items-center justify-center"
					aria-label="Open categories sidebar"
				>
					<span className="sr-only">Categories</span>
					<FilterListIcon className="h-5 w-5" />
				</button>
			</div>
		</div>
	);

	return (
		<>
			<Seo
				title="WinUI Apps Showcase"
				description="Explore a curated showcase of beautiful WinUI apps that demonstrate the power of Fluent Design. Discover apps with Mica, Acrylic, and the latest Windows 11 styling."
				keywords="WinUI, WinUI 3, Windows 11 Apps, Fluent Design, Microsoft Store, App Showcase"
				canonical="/apps"
				image="/assets/cover-apps.png"
				imageAlt="A showcase of WinUI 3 applications from Fluent Deck."
				schema={location.pathname === '/' ? [collectionPageSchema, softwareAppSchema] : collectionPageSchema}
			/>
			<div
				className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
				onClick={closeSidebar}
				aria-hidden="true"
				style={!isClient ? { display: 'none' } : {}}
			/>
			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-bg-secondary z-50 transform ${isSidebarOpen ? 'animate-slideInLeft translate-x-0 opacity-100' : 'animate-slideOutLeft -translate-x-full opacity-0'}`}
				style={!isClient ? { display: 'none' } : {}}
				aria-label="Categories navigation"
			>
				<div className="flex items-center justify-start p-4 sticky top-0 bg-bg-secondary/80 backdrop-blur-sm z-10">
					<h2 className="text-lg font-semibold text-text-primary">Categories</h2>
				</div>
				<CategorySidebar categories={categories} onSelectCategory={handleCategorySelect} />
			</aside>

			<FilterLayout
				titleIcon={<AppsIcon className="w-8 h-8 text-text-primary" />}
				title="WinUI Apps"
				description="Explore a curated showcase of beautiful WinUI apps that demonstrate the power of Fluent Design."
				filterBarContent={filterBarContent}
				isLoading={showSkeleton}
				skeleton={
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9 gap-4">
						{Array.from({ length: 18 }).map((_, i) => <AppCardSkeleton key={i} />)}
					</div>
				}
				loadMoreRef={loadMoreRef}
			>
				<div className="relative space-y-12 mt-4">
					{visibleContent.length > 0 ? visibleContent.map((group, groupIndex) => (
						<div key={group.heading}>
							<a
								href={`#${slugify(categoryMetadata[group.heading]?.name || group.heading)}`}
								onClick={(e) => { e.preventDefault(); handleCategorySelect(slugify(categoryMetadata[group.heading]?.name || group.heading)); }}
							>
								<div
									id={slugify(categoryMetadata[group.heading]?.name || group.heading)}
									className="text-2xl font-bold tracking-tight text-text-primary border-b border-border-primary pb-2 mb-6 scroll-mt-40 flex items-center gap-3 hover:text-accent"
								>
									{categoryMetadata[group.heading]?.icon && (
										<img src={`/assets/category/${categoryMetadata[group.heading].icon}`} alt="" className="w-7 h-7" />
									)}
									<span>{categoryMetadata[group.heading]?.name || group.heading}</span>
								</div>
							</a>
							<div className="space-y-8">
								{group.subgroups.map((subgroup, subIndex) => {
									const isFirstGroup = groupIndex === 0 && subIndex === 0;
									const subHeadingMeta = subgroup.subheading ? categoryMetadata[subgroup.subheading] : null;
									return (
										<div key={`${group.heading}-${subIndex}`}>
											{subgroup.subheading && (
												<a
													href={`#${slugify(subHeadingMeta?.name || subgroup.subheading)}`}
													onClick={(e) => { e.preventDefault(); handleCategorySelect(slugify(subHeadingMeta?.name || subgroup.subheading)); }}
												>
													<div
														id={slugify(subHeadingMeta?.name || subgroup.subheading)}
														className="text-xl font-semibold tracking-tight text-text-secondary mb-4 scroll-mt-40 flex items-center gap-2.5 hover:text-accent"
													>
														{(subgroup.icon_url || subHeadingMeta?.icon) && (
															<img src={subgroup.icon_url || `/assets/category/${subHeadingMeta.icon}`} alt="" className="w-6 h-6" />
														)}
														<span>{subHeadingMeta?.name || subgroup.subheading}</span>
													</div>
												</a>
											)}
											{subgroup.sections && subgroup.sections.length > 0 ? (
												<div className="space-y-6">
													{subgroup.sections.map((section, secIndex) => {
														const sectionMeta = categoryMetadata[section.heading];
														const sectionSlug = slugify(sectionMeta?.name || section.heading);
														return (
															<div key={`${section.heading}-${secIndex}`}>
																<a
																	href={`#${sectionSlug}`}
																	onClick={(e) => { e.preventDefault(); handleCategorySelect(sectionSlug); }}
																>
																	<div
																		id={sectionSlug}
																		className="text-lg font-medium tracking-tight text-text-secondary/80 mb-3 scroll-mt-40 flex items-center gap-2 hover:text-accent"
																	>
																		{(section.icon_url || sectionMeta?.icon) && (
																			<img src={section.icon_url || `/assets/category/${sectionMeta.icon}`} alt="" className="w-5 h-5" />
																		)}
																		<span>{sectionMeta?.name || section.heading}</span>
																	</div>
																</a>
																<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
																	{section.apps.map((app, appIndex) => {
																		const isLCPCard = isFirstGroup && secIndex === 0 && appIndex === 0;
																		return (
																			<MemoizedAppCard
																				key={app.link}
																				app={app}
																				index={appIndex}
																				isLCP={isLCPCard}
																				onContextMenu={handleContextMenu}
																				isSelectionMode={isSelectionMode}
																				isSelected={isItemSelected(app, 'app')}
																				onToggleSelection={toggleSelection}
																			/>
																		);
																	})}
																</div>
															</div>
														);
													})}
												</div>
											) : (
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
													{subgroup.apps.map((app, appIndex) => {
														const isLCPCard = isFirstGroup && appIndex === 0;
														return (
															<MemoizedAppCard
																key={app.link}
																app={app}
																index={appIndex}
																isLCP={isLCPCard}
																onContextMenu={handleContextMenu}
																isSelectionMode={isSelectionMode}
																isSelected={isItemSelected(app, 'app')}
																onToggleSelection={toggleSelection}
															/>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)) : (
						<div className="text-center py-10">
							<p className="text-text-secondary">No apps found matching your criteria.</p>
						</div>
					)}
				</div>
			</FilterLayout>

			{contextMenu && (
				<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu}>
					<ContextMenuItem onClick={() => {
						try { startSelectionMode(contextMenu.item, 'app', location.pathname); }
						catch (err) { console.error('Failed to start selection mode:', err); }
						finally { closeContextMenu(); }
					}}>
						<div className="flex items-center gap-2"><CheckmarkIcon className="w-4 h-4" /><span>Select</span></div>
					</ContextMenuItem>
					<ContextSubMenuTrigger subMenu={
						<>
							{getCollectionNames().map(name => {
								const collectionType = getCollectionType(name);
								const isDisabled = collectionType === 'media';
								const isInCollection = isItemInCollection(name, contextMenu.item, 'app');
								return (
									<ContextMenuItem
										key={name}
										onClick={() => {
											try {
												if (isInCollection) removeItemFromCollection(name, contextMenu.item, 'app');
												else addItemToCollection(name, contextMenu.item, 'app');
											} catch (err) { console.error('Failed to update collection:', err); }
										}}
										disabled={isDisabled}
									>
										<div className="flex items-center justify-between w-full">
											<span>{name}</span>
											{isInCollection && <CheckmarkIcon className="w-4 h-4 text-blue-500" />}
										</div>
									</ContextMenuItem>
								);
							})}
							<div className="h-px my-1 bg-border-primary" />
							<ContextMenuItem onClick={() => handleOpenCreateCollectionModal(contextMenu.item)}>
								<div className="flex items-center gap-2"><AddIcon className="w-4 h-4" /><span>New Collection...</span></div>
							</ContextMenuItem>
						</>
					}>
						<div className="flex items-center gap-2"><AddIcon className="w-4 h-4" /><span>Add to Collection</span></div>
					</ContextSubMenuTrigger>
				</ContextMenu>
			)}

			{showCreateCollectionModal && (
				<CreateCollectionModal
					isOpen={showCreateCollectionModal}
					onClose={() => setShowCreateCollectionModal(false)}
					onCreate={handleCreateCollection}
				/>
			)}
		</>
	);
};

export default AppsPage;