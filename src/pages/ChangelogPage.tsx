import React, { useState, useEffect, JSX } from 'react';
import { fetchWithCache } from '@/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HistoryIcon } from '@/components/Icons';
import Seo from '@/components/Seo';

interface ChangelogEntry {
    version: string;
    date: string;
    content: string;
}

const parseChangelog = (text: string): ChangelogEntry[] => {
    const entries: ChangelogEntry[] = [];
    const lines = text.split('\n');

    let currentEntry: ChangelogEntry | null = null;
    let contentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match version headers: ## Version 2.4.0 (29-05-2026)
        const versionMatch = line.match(/^##\s+Version\s+([\d.]+)\s+\((\d{2}-\d{2}-\d{4})\)/);

        if (versionMatch) {
            if (currentEntry) {
                currentEntry.content = contentLines.join('\n').trim();
                entries.push(currentEntry);
            }

            currentEntry = {
                version: `v${versionMatch[1]}`,
                date: versionMatch[2],
                content: ''
            };
            contentLines = [];
        } else if (currentEntry && line.trim() !== '' && !line.startsWith('# Changelog')) {
            contentLines.push(line);
        }
    }

    if (currentEntry) {
        currentEntry.content = contentLines.join('\n').trim();
        entries.push(currentEntry);
    }

    return entries;
};

const renderInlineMarkdown = (text: string) => {
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.flatMap((codePart, codeIdx) => {
        if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
                <code
                    key={`code-${codeIdx}`}
                    className="px-1.5 py-0.5 rounded bg-bg-active text-xs font-mono text-text-primary"
                >
                    {codePart.slice(1, -1)}
                </code>
            );
        }

        const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((boldPart, boldIdx) => {
            if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                return (
                    <strong key={`bold-${codeIdx}-${boldIdx}`} className="font-semibold text-text-primary">
                        {boldPart.slice(2, -2)}
                    </strong>
                );
            }
            return boldPart;
        });
    });
};

const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={elements.length} className="my-3 space-y-2 list-none">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                            <span className="text-text-secondary mr-3 mt-0.5 flex-shrink-0">•</span>
                            <span className="text-text-secondary leading-relaxed">
                                {renderInlineMarkdown(item)}
                            </span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const headers = tableRows[0];
            const dataRows = tableRows.slice(2);

            elements.push(
                <div key={elements.length} className="my-4 overflow-x-auto rounded-lg border border-border-primary">
                    <table className="min-w-full divide-y divide-border-primary text-sm">
                        <thead className="bg-bg-active">
                            <tr>
                                {headers.map((header, idx) => (
                                    <th
                                        key={idx}
                                        className="px-4 py-3 text-left font-semibold text-text-primary"
                                    >
                                        {renderInlineMarkdown(header.trim())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-bg-secondary divide-y divide-border-primary">
                            {dataRows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-bg-active transition-colors">
                                    {row.map((cell, cellIdx) => (
                                        <td
                                            key={cellIdx}
                                            className={`px-4 py-3 ${cellIdx === 0 ? 'font-medium text-text-primary' : 'text-text-secondary'}`}
                                        >
                                            {renderInlineMarkdown(cell.trim())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
            inTable = false;
        }
    };

    lines.forEach((line) => {
        if (line.startsWith('### ')) {
            flushList();
            flushTable();
            elements.push(
                <h3 key={elements.length} className="text-base font-bold text-text-primary mt-6 mb-2">
                    {line.replace('### ', '')}
                </h3>
            );
        } else if (line.includes('|')) {
            flushList();
            inTable = true;
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
            tableRows.push(cells);
        } else if (line.startsWith('- ')) {
            if (inTable) flushTable();
            listItems.push(line.substring(2));
        } else if (line.trim() === '---') {
            flushList();
            flushTable();
            elements.push(
                <hr key={elements.length} className="my-5 border-border-primary" />
            );
        } else if (line.trim() && !line.startsWith('|')) {
            if (inTable) flushTable();
            flushList();
            elements.push(
                <p key={elements.length} className="text-sm text-text-secondary mt-2 leading-relaxed">
                    {renderInlineMarkdown(line)}
                </p>
            );
        }
    });

    flushList();
    flushTable();

    return elements;
};

const ChangelogPage: React.FC = () => {
    const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChangelog = async () => {
            setIsLoading(true);
            try {
                const markdown = await fetchWithCache('changelog-md', '/CHANGELOG.md', 'text');
                const parsed = parseChangelog(markdown);
                setChangelog(parsed);
            } catch (error) {
                console.error("Failed to fetch changelog:", error);
                setChangelog([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChangelog();
    }, []);

    return (
        <>
            <Seo
                title="Changelog"
                description="Track the latest updates, improvements, and new features for Fluent Deck. See what's new in our app, icon, and emoji collections."
                keywords="Changelog, Updates, New Features, Version History, Release Notes"
                canonical="/changelog"
                image="/assets/cover-changelog.png"
                imageAlt="A summary of recent updates and changes to Fluent Deck."
                type="article"
            />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center space-x-3">
                        <HistoryIcon className="w-8 h-8 text-text-primary" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
                            Changelog
                        </h1>
                    </div>

                    <p className="mt-2 text-base text-text-secondary">
                        Track the latest updates, improvements, and new features added to Fluent Deck.
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner text="Loading changelog..." />
                        </div>
                    ) : (
                        <div className="mt-8 space-y-6">
                            {changelog.map((entry, index) => (
                                <div
                                    key={index}
                                    className="bg-bg-secondary border border-border-primary rounded-xl p-5 sm:p-6"
                                >
                                    {/* Version and Date */}
                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-3 border-b border-border-primary">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                                                {entry.version}
                                            </h2>

                                            {index === 0 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-bg-active text-text-primary border border-border-primary">
                                                    Latest
                                                </span>
                                            )}
                                        </div>

                                        {entry.date && (
                                            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                                {entry.date}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div>
                                        {renderMarkdown(entry.content)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChangelogPage;
