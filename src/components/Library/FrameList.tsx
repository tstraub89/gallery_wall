import React, { useState } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './FrameList.module.css';
import ConfirmDialog from '../Common/ConfirmDialog';
import FilterBar from './FilterBar';
import { Frame } from '../../types';

const EMPTY_ARRAY: Frame[] = []; // Explicitly type generic empty array if possible, or cast later

interface FrameListProps {
    onFrameSelect?: (frame: Frame) => void;
    selectionMode?: 'standard' | 'toggle';
    headerAction?: React.ReactNode;
    viewMode?: 'list' | 'grid';
    onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const FrameList: React.FC<FrameListProps> = ({ onFrameSelect, selectionMode = 'standard', headerAction, viewMode = 'list', onViewModeChange }) => {
    const {
        currentProject,
        setSelection,
        removeFromLibrary,
        frameState,
        updateFrameState,
        selectedFrameTemplateIds,
        setSelectedFrameTemplates
    } = useProject();
    const [frameToRemove, setFrameToRemove] = useState<string | null>(null); // templateId
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

    // Persistent Filter & Sort State
    const { searchTerm, activeFilters, sortBy } = frameState;

    const templates = currentProject?.library || EMPTY_ARRAY;
    const instances = currentProject?.frames || EMPTY_ARRAY;

    const calculateProcessedTemplates = () => {
        let result = [...templates];

        // 1. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            const normalizedSearch = lower.replace(/[^0-9a-z]/g, ''); // strip spaces, symbols

            result = result.filter(t => {
                const labelMatch = t.label && t.label.toLowerCase().includes(lower);

                // Allow fuzzy search for dimensions (e.g. "8 x 10" matches "8x10")
                const dimsString = `${t.width}x${t.height}`;
                const normalizedDims = dimsString.replace(/[^0-9a-z]/g, '');
                const dimMatch = normalizedDims.includes(normalizedSearch);

                return labelMatch || dimMatch;
            });
        }

        // 2. Filters
        if (activeFilters.unplaced) {
            result = result.filter(t => !instances.some(inst => inst.templateId === t.id));
        }
        if (activeFilters.placed) {
            result = result.filter(t => instances.some(inst => inst.templateId === t.id));
        }
        if (activeFilters.portrait) {
            result = result.filter(t => t.height > t.width);
        }
        if (activeFilters.landscape) {
            result = result.filter(t => t.width > t.height);
        }
        if (activeFilters.square) {
            result = result.filter(t => t.width === t.height);
        }
        if (activeFilters.round) {
            result = result.filter(t => t.shape === 'round');
        }

        // 3. Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'area':
                    return (b.width * b.height) - (a.width * a.height); // Large to Small
                case 'area_asc':
                    return (a.width * a.height) - (b.width * b.height); // Small to Large
                case 'width':
                    return b.width - a.width;
                case 'height':
                    return b.height - a.height;
                case 'oldest':
                    // Items without createdAt (legacy) sort as oldest (epoch 0)
                    return (a.createdAt || 0) - (b.createdAt || 0);
                case 'newest':
                default:
                    return (b.createdAt || 0) - (a.createdAt || 0);
            }
        });

        return result;
    };

    const processedTemplates = calculateProcessedTemplates();

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project to view frames.</div>;
    }

    const handleTemplateClick = (e: React.MouseEvent, templateId: string, index: number) => {
        // Mode 1: Selection Callback (e.g. Mobile Tap to Add)
        if (onFrameSelect && selectionMode !== 'toggle' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const template = templates.find(t => t.id === templateId);
            if (template) {
                onFrameSelect(template);
            }
            return;
        }

        // Mode 2: Standard Desktop / Batch Management

        // Force toggle if selectionMode is 'toggle' (Mobile Manage Mode)
        const isToggle = selectionMode === 'toggle' || e.ctrlKey || e.metaKey;

        if (isToggle) {
            // Toggle
            if (selectedFrameTemplateIds.includes(templateId)) {
                setSelectedFrameTemplates(selectedFrameTemplateIds.filter(id => id !== templateId));
            } else {
                setSelectedFrameTemplates([...selectedFrameTemplateIds, templateId]);
            }
            setAnchorIndex(index);
        } else if (e.shiftKey && anchorIndex !== null) {
            // Range
            const start = Math.min(anchorIndex, index);
            const end = Math.max(anchorIndex, index);
            const rangeIds = processedTemplates.slice(start, end + 1).map(t => t.id);
            setSelectedFrameTemplates(rangeIds);
        } else {
            // Single select
            setSelectedFrameTemplates([templateId]);
            setAnchorIndex(index);
        }

        // Also clear canvas selection
        setSelection([]);
    };

    const handleBatchDelete = () => {
        if (selectedFrameTemplateIds.length === 0) return;
        setFrameToRemove('BATCH_DELETE');
    };

    const confirmBatchDelete = () => {
        selectedFrameTemplateIds.forEach(id => {
            removeFromLibrary(currentProject.id, id);
        });
        setSelectedFrameTemplates([]); // Clear selection
        setFrameToRemove(null);
    };

    const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation();
        setFrameToRemove(templateId);
    };

    const handleFilterChange = (key: string, val: boolean) => {
        const newFilters = { ...activeFilters, [key]: val };

        // Mutually exclusive logic
        if (key === 'portrait' && val) {
            newFilters.landscape = false;
            newFilters.square = false;
        }
        if (key === 'landscape' && val) {
            newFilters.portrait = false;
            newFilters.square = false;
        }
        if (key === 'square' && val) {
            newFilters.portrait = false;
            newFilters.landscape = false;
        }

        if (key === 'unplaced' && val) newFilters.placed = false;
        if (key === 'placed' && val) newFilters.unplaced = false;


        updateFrameState({ activeFilters: newFilters });
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={(val) => updateFrameState({ searchTerm: val })}
                    showSearch={true}
                    placeholder="Search frames..."
                    sortOptions={[
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' },
                        { value: 'area', label: 'Size (Largest)' },
                        { value: 'area_asc', label: 'Size (Smallest)' },
                        { value: 'width', label: 'Width' },
                        { value: 'height', label: 'Height' },
                    ]}
                    currentSort={sortBy}
                    onSortChange={(val) => updateFrameState({ sortBy: val })}
                    filterOptions={[
                        { key: 'unplaced', label: 'Unplaced Only' },
                        { key: 'placed', label: 'Placed Only' },
                        { key: 'portrait', label: 'Portrait' },
                        { key: 'landscape', label: 'Landscape' },
                        { key: 'square', label: 'Square' },
                        { key: 'round', label: 'Round/Oval' },
                    ]}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClear={() => updateFrameState({ activeFilters: {} })}
                    viewOptions={[
                        {
                            id: 'list',
                            label: 'List View',
                            checked: viewMode === 'list',
                            type: 'item',
                            onClick: () => onViewModeChange?.('list')
                        },
                        {
                            id: 'grid',
                            label: 'Grid View',
                            checked: viewMode === 'grid',
                            type: 'item',
                            onClick: () => onViewModeChange?.('grid')
                        }
                    ]}
                />
            </div>

            {/* Injected Header Action (e.g. Mobile Add Button) */}
            {headerAction}

            {
                selectedFrameTemplateIds.length > 0 && (
                    <div className={styles.batchActions}>
                        <span className={styles.selectionCount}>{selectedFrameTemplateIds.length} selected</span>
                        <div className={styles.batchButtons}>
                            <button className={styles.clearParamsBtn} onClick={() => setSelectedFrameTemplates([])} title="Clear Selection">✕</button>
                            <button className={styles.batchDeleteBtn} onClick={handleBatchDelete} title="Delete Selected">🗑️</button>
                        </div>
                    </div>
                )
            }

            <div className={styles.scrollWrapper}>
                <div className={viewMode === 'list' ? styles.list : styles.gridList}>
                    {processedTemplates.map((template, index) => {
                        const instance = instances.find(f => f.templateId === template.id);
                        const isPlaced = !!instance; // Keep using only isPlaced for visual dimming
                        const isSelected = selectedFrameTemplateIds.includes(template.id);

                        const isGrid = viewMode === 'grid';

                        // Calculate dimensions for Grid View to ensure aspect ratio is preserved
                        // while fitting within the grid item bounds (approx 80% width, 60% height of cell)
                        let gridStyle = {};
                        if (isGrid) {
                            const MAX_W = 80; // percent
                            const MAX_H = 60; // percent
                            const ratio = template.width / template.height;

                            let w = MAX_W;
                            let h = w / ratio;

                            if (h > MAX_H) {
                                h = MAX_H;
                                w = h * ratio;
                            }
                            gridStyle = {
                                width: `${w}%`,
                                height: `${h}%`
                            };
                        }

                        return (
                            <div
                                key={template.id}
                                className={`${viewMode === 'list' ? styles.frameItem : styles.gridItem} ${isPlaced ? styles.placedItem : ''} ${isSelected ? styles.selectedItem : ''}`}
                                draggable={!isPlaced}
                                onClick={(e) => handleTemplateClick(e, template.id, index)}
                                onDragStart={(e) => {
                                    if (isPlaced) return;
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        type: 'FRAME_LIBRARY_ITEM',
                                        frame: template
                                    }));
                                }}
                            >
                                <div
                                    className={styles.framePreview}
                                    style={{
                                        aspectRatio: `${template.width}/${template.height}`,
                                        borderRadius: template.shape === 'round' ? '50%' : '0',
                                        borderColor: template.frameColor || '#111111',
                                        borderWidth: `${Math.max(1, (template.borderWidth ?? 0.1) * (40 / (template.width + (template.borderWidth ?? 0.1) * 2)))}px`,
                                        borderStyle: 'solid',
                                        backgroundColor: template.matted ? '#ffffff' : undefined,
                                        // Apply grid sizing if in grid mode, otherwise default (which is handled by CSS for list view? Check this.)
                                        // Actually list view uses fixed width 40px in CSS. We should only apply this in grid mode.
                                        ...(isGrid ? gridStyle : {})
                                    }}
                                >

                                    {template.matted && (
                                        <div
                                            className={styles.mattedInner}
                                            style={{
                                                width: `${(template.matted.width / template.width) * 100}%`,
                                                height: `${(template.matted.height / template.height) * 100}%`,
                                                borderRadius: template.shape === 'round' ? '50%' : '0'
                                            }}
                                        />
                                    )}
                                    {isPlaced && (
                                        <div className={styles.placedOverlay}>PLACED</div>
                                    )}
                                    {isSelected && !isPlaced && (
                                        <div className={styles.selectedOverlay}>✓</div>
                                    )}
                                    {!isPlaced && !isSelected && (
                                        <button className={styles.removeBtn} onClick={(e) => handleDeleteTemplate(e, template.id)} title="Remove from library">×</button>
                                    )}
                                </div>
                                <div className={styles.frameInfo}>
                                    {template.label ? (
                                        <>
                                            <div className={styles.label} title={template.label}>{template.label}</div>
                                            <div className={styles.dims}>{template.width}" x {template.height}"</div>
                                        </>
                                    ) : (
                                        <div className={styles.dims}>{template.width}" x {template.height}"</div>
                                    )}
                                    <div className={styles.subInfo}>
                                        {template.isDuplicate && '(Duplicated)'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {processedTemplates.length === 0 && (
                        <div className={styles.empty}>
                            {templates.length === 0 ? "No frames yet." : "No matching frames found."}
                        </div>
                    )}
                </div>
            </div>
            {
                frameToRemove && (
                    <ConfirmDialog
                        title={frameToRemove === 'BATCH_DELETE' ? "Delete Selected Frames" : "Remove Frame Template"}
                        message={frameToRemove === 'BATCH_DELETE'
                            ? `Are you sure you want to remove ${selectedFrameTemplateIds.length} templates?`
                            : "Are you sure you want to remove this frame template from your library?"}
                        confirmLabel="Remove"
                        onConfirm={() => {
                            if (frameToRemove === 'BATCH_DELETE') {
                                confirmBatchDelete();
                            } else {
                                removeFromLibrary(currentProject.id, frameToRemove);
                                setFrameToRemove(null);
                            }
                        }}
                        onCancel={() => setFrameToRemove(null)}
                        isDanger={true}
                    />
                )
            }
        </div >
    );
};

export default FrameList;
