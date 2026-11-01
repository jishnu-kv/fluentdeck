import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { EmojiMap, EMOJI_METADATA_URL, APPS_LOCAL_URL, CATEGORY_METADATA_URL } from '@/constants';
import { CategoryNode, ContentGroup, CollectionItem } from '@/types';
import { fetchWithCache, getItemId } from '@/utils';

// --- App/Modal Context ---
interface AppContextType {
  allContent: ContentGroup[];
  categories: CategoryNode[];
  categoryMetadata: { [key: string]: { name: string; icon: string } };
  isLoadingApps: boolean;
  emojiMap: EmojiMap;
  isLoadingEmojis: boolean;
  isSelectionMode: boolean;
  selection: CollectionItem[];
  selectionContext: string | null;
  startSelectionMode: (item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType'], path: string) => void;
  stopSelectionMode: () => void;
  toggleSelection: (item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType']) => void;
  isItemSelected: (item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType']) => boolean;
  selectAll: (items: CollectionItem[]) => void;
  updateAppLogoInState: (appName: string, newLogoUrl: string) => void;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const buildCategories = (appItems: ContentGroup[], categoryMetadata: { [key: string]: { name: string; icon: string } }): CategoryNode[] => {
    const parsedCategories: CategoryNode[] = [];
    const slugify = (text: string): string => {
        if (!text) return '';
        return text.replace(/<[^>]+>/g, '').toLowerCase()
            .replace(/\s\(.+\)/, '')
            .replace(/&/g, 'and')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    for (const group of appItems) {
        const heading = group.heading.trim();
        const metadata = categoryMetadata[heading] || { name: heading.replace(/<[^>]+>/g, '').trim(), icon: '' };
        const categoryNode: CategoryNode = { 
            id: slugify(metadata.name),
            label: metadata.name,
            icon: metadata.icon ? `/assets/category/${metadata.icon}` : undefined,
            children: [] 
        };

        for (const subgroup of group.subgroups) {
            if (subgroup.subheading) {
                const subMetadata = categoryMetadata[subgroup.subheading] || { name: subgroup.subheading.replace(/<[^>]+>/g, '').trim(), icon: '' };
                const subNode: CategoryNode = {
                    id: slugify(subMetadata.name),
                    label: subMetadata.name,
                    icon: subgroup.icon_url || (subMetadata.icon ? `/assets/category/${subMetadata.icon}` : undefined),
                    children: [] 
                };

                if (subgroup.sections && subgroup.sections.length > 0) {
                    for (const section of subgroup.sections) {
                        subNode.children.push({
                            id: slugify(section.heading),
                            label: section.heading,
                            children: []
                        });
                    }
                }

                categoryNode.children.push(subNode);
            }
        }
        parsedCategories.push(categoryNode);
    }
    return parsedCategories;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allContent, setAllContent] = useState<ContentGroup[]>([]);
  const [categoryMetadata, setCategoryMetadata] = useState<{ [key: string]: { name: string; icon: string } }>({});
  const categories = useMemo(() => buildCategories(allContent, categoryMetadata), [allContent, categoryMetadata]); // memoized
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [emojiMap, setEmojiMap] = useState<EmojiMap>({});
  const [isLoadingEmojis, setIsLoadingEmojis] = useState(true);
  const location = useLocation();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selection, setSelection] = useState<CollectionItem[]>([]);
  const selectionIdsRef = useRef<Set<string>>(new Set()); // O(1) lookup
  const [selectionContext, setSelectionContext] = useState<string | null>(null);

  // keep a ref to isSelectionMode for global listeners to avoid reattaching
  const isSelectionModeRef = useRef(isSelectionMode);
  useEffect(() => { isSelectionModeRef.current = isSelectionMode; }, [isSelectionMode]);

  useEffect(() => {
    document.title = 'Fluent Deck - Showcase for Fluent Emojis & Icons';

    const fetchAppsAndLogos = async () => {
      setIsLoadingApps(true);
      try {
        const [appsData, metadata] = await Promise.all([
          fetchWithCache('apps-data-local', APPS_LOCAL_URL),
          fetchWithCache('category-metadata', CATEGORY_METADATA_URL)
        ]);
        if (appsData && Array.isArray(appsData) && appsData.length > 0) {
          setAllContent(appsData as ContentGroup[]);
        } else {
          setAllContent([]);
        }
        if (metadata) setCategoryMetadata(metadata.categories);
      } catch (error) {
        console.error('Failed to fetch apps local JSON:', error);
        setAllContent([]);
      } finally {
        setIsLoadingApps(false);
      }
    };

    const fetchEmojis = async () => {
      setIsLoadingEmojis(true);
      try {
        const emojiData = await fetchWithCache('emoji-metadata', EMOJI_METADATA_URL);
        if (!emojiData || !Array.isArray(emojiData.columns) || !Array.isArray(emojiData.emojis)) {
          setIsLoadingEmojis(false);
          return;
        }
        const { columns, emojis } = emojiData;
        const nameIndex = columns.indexOf('name');
        const nextEmojiMap: EmojiMap = {};
        emojis.forEach((emojiArray: any[]) => {
          const name = emojiArray[nameIndex]?.trim();
          if (!name) return;
          const emojiObject: any = {};
          columns.forEach((col, index) => {
            emojiObject[col] = emojiArray[index];
          });
          nextEmojiMap[name] = {
            glyph: emojiObject.glyph,
            group: emojiObject.group,
            keywords: emojiObject.keywords || [],
            unicode: emojiObject.unicode,
            styles: {
              '3D': emojiObject['3D'],
              'Animated': emojiObject['Animated'],
              'Color': emojiObject['Color'],
              'Flat': emojiObject['Flat'],
              'High Contrast': emojiObject['High Contrast'],
            },
          };
        });
        setEmojiMap(nextEmojiMap);
        setIsLoadingEmojis(false);
      } catch (error) {
        console.error('Failed to load emoji metadata:', error);
        setIsLoadingEmojis(false);
      }
    };

    let emojiTimeout: any = null;
    if (location.pathname.startsWith('/apps')) {
      fetchAppsAndLogos();
    }
    if (location.pathname.startsWith('/emoji')) {
      emojiTimeout = setTimeout(fetchEmojis, 300);
    }
    return () => {
      if (emojiTimeout) clearTimeout(emojiTimeout);
    };
  }, [location.pathname]);

  // Global keyboard handler: attach once, use refs for latest selection state / stopSelectionMode
  const stopSelectionModeRef = useRef<() => void>(() => {});
  useEffect(() => { stopSelectionModeRef.current = () => {
    setIsSelectionMode(false);
    setSelection([]);
    selectionIdsRef.current.clear();
    setSelectionContext(null);
  }; }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector<HTMLInputElement>('#global-search-bar');
            searchInput?.focus();
            return;
        }
        if (event.key === 'Escape' && isSelectionModeRef.current) {
            stopSelectionModeRef.current();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // attach once

  const startSelectionMode = useCallback((item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType'], path: string) => {
    const fullItem = { ...item, itemType } as CollectionItem;
    const id = getItemId(item, itemType);
    selectionIdsRef.current = new Set([id]);
    setSelection([fullItem]);
    setIsSelectionMode(true);
    setSelectionContext(path);
  }, []);

  const stopSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelection([]);
    selectionIdsRef.current.clear();
    setSelectionContext(null);
  }, []);

  // Effect to automatically stop selection mode when navigating away from the page where it was active.
  useEffect(() => {
    if (isSelectionMode && selectionContext && location.pathname !== selectionContext) {
      stopSelectionMode();
    }
  }, [location.pathname, isSelectionMode, selectionContext, stopSelectionMode]);

  const toggleSelection = useCallback((item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType']) => {
    setSelection(prev => {
        const itemId = getItemId(item, itemType);
        const isSelected = selectionIdsRef.current.has(itemId);
        if (isSelected) {
            selectionIdsRef.current.delete(itemId);
            const newSelection = prev.filter(i => getItemId(i, i.itemType) !== itemId);
            if (newSelection.length === 0) {
                setIsSelectionMode(false);
                setSelectionContext(null);
            }
            return newSelection;
        } else {
            selectionIdsRef.current.add(itemId);
            const fullItem = { ...item, itemType } as CollectionItem;
            // ensure selection mode is on
            if (!isSelectionMode) setIsSelectionMode(true);
            return [...prev, fullItem];
        }
    });
  }, [isSelectionMode]);

  const selectAll = useCallback((items: CollectionItem[]) => {
    if (items.length > 0) {
        setIsSelectionMode(true);
        setSelection(items);
        selectionIdsRef.current = new Set(items.map(i => getItemId(i, i.itemType)));
        if (!selectionContext) {
            setSelectionContext(location.pathname);
        }
    }
  }, [selectionContext, location.pathname]);

  const isItemSelected = useCallback((item: Omit<CollectionItem, 'itemType'>, itemType: CollectionItem['itemType']) => {
    const itemId = getItemId(item, itemType);
    return selectionIdsRef.current.has(itemId);
  }, []);

  const updateAppLogoInState = useCallback((appName: string, newLogoUrl: string) => {
    setAllContent(prevContent => 
        prevContent.map(group => ({
            ...group,
            subgroups: group.subgroups.map(subgroup => ({
                ...subgroup,
                apps: subgroup.apps.map(app => 
                    app.name === appName ? { ...app, logo_url: newLogoUrl } : app
                ),
                sections: subgroup.sections ? subgroup.sections.map(section => ({
                    ...section,
                    apps: section.apps.map(app =>
                        app.name === appName ? { ...app, logo_url: newLogoUrl } : app
                    )
                })) : undefined
            }))
        }))
    );
  }, []);

  // Memoize AppContext value to avoid re-creating object on each render (reduces consumer re-renders)
  const appContextValue = useMemo(() => ({
      allContent, categories, categoryMetadata, isLoadingApps,
      emojiMap, isLoadingEmojis,
      isSelectionMode, selection, selectionContext, startSelectionMode, stopSelectionMode,
      toggleSelection, isItemSelected, selectAll, updateAppLogoInState
  }), [
      allContent, categories, categoryMetadata, isLoadingApps,
      emojiMap, isLoadingEmojis,
      isSelectionMode, selection, selectionContext, startSelectionMode, stopSelectionMode,
      toggleSelection, isItemSelected, selectAll, updateAppLogoInState
  ]);

  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
};
