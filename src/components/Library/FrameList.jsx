import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './FrameList.module.css';
import ConfirmDialog from '../Common/ConfirmDialog';
import FilterBar from './FilterBar';

const EMPTY_ARRAY = [];

const FrameList = () => {
    const { currentProject, setSelection, removeFromLibrary } = useProject();
    const [frameToRemove, setFrameToRemove] = useState(null); // templateId

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({}); // { unplaced: true, portrait: false, etc }
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'area', 'width'

    const templates = currentProject?.library || EMPTY_ARRAY;
    const instances = currentProject?.frames || EMPTY_ARRAY;

    // --- Filtering & Sorting Logic ---
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
                    // Assuming library order is oldest first
                    return 0;
                case 'newest':
                default:
                    return 0;
            }
        });

        if (sortBy === 'newest') {
            result.reverse();
        }

        return result;
    };

    const processedTemplates = calculateProcessedTemplates();

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project to view frames.</div>;
    }

    const handleFrameClick = (id, isInstance = false) => {
        if (isInstance) {
            setSelection([id]);
        } else {
            // It's a template that's not on the wall yet
            setSelection([]);
        }
    };

    const handleDeleteTemplate = (e, templateId) => {
        e.stopPropagation();
        setFrameToRemove(templateId);
    };

    const handleFilterChange = (key, val) => {
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


        setActiveFilters(newFilters);
    };

    return (
        <>
            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search... (e.g. '8x10', 'Hallway')"
                sortOptions={[
                    { value: 'newest', label: 'Newest' },
                    { value: 'oldest', label: 'Oldest' },
                    { value: 'area', label: 'Size (Largest)' },
                    { value: 'area_asc', label: 'Size (Smallest)' },
                    { value: 'width', label: 'Width' },
                    { value: 'height', label: 'Height' },
                ]}
                currentSort={sortBy}
                onSortChange={setSortBy}
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
            />

            <div className={styles.list}>
                {processedTemplates.map((template) => {
                    const instance = instances.find(f => f.templateId === template.id);
                    const isPlaced = !!instance;

                    return (
                        <div
                            key={template.id}
                            className={`${styles.frameItem} ${isPlaced ? styles.placedItem : ''}`}
                            draggable={!isPlaced}
                            onClick={() => handleFrameClick(instance?.id || template.id, isPlaced)}
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
                                    borderColor: template.frameColor || '#111111'
                                }}
                            >
                                {template.matted && (
                                    <div
                                        className={styles.mattedInner}
                                        style={{ borderRadius: template.shape === 'round' ? '50%' : '0' }}
                                    />
                                )}
                                {isPlaced && (
                                    <div className={styles.placedOverlay}>PLACED</div>
                                )}
                                {!isPlaced && (
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
            {frameToRemove && (
                <ConfirmDialog
                    title="Remove Frame Template"
                    message="Are you sure you want to remove this frame template from your library?"
                    confirmLabel="Remove"
                    onConfirm={() => {
                        removeFromLibrary(currentProject.id, frameToRemove);
                        setFrameToRemove(null);
                    }}
                    onCancel={() => setFrameToRemove(null)}
                    isDanger={true}
                />
            )}
        </>
    );
};

export default FrameList;
