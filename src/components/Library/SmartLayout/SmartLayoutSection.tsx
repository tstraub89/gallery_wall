
import React, { useState } from 'react';
import styles from './SmartLayout.module.css';
import { useProject } from '../../../hooks/useProject';
import { useSmartLayout } from './SmartLayoutContext';
import { RecommenderFrame, LayoutSolution } from '../../../recommender/types';
import { Frame } from '../../../types';
import { PPI } from '../../../constants';
import ValidatedNumberInput from '../../Common/ValidatedNumberInput';
import RangeSlider from '../../Common/RangeSlider';

interface SmartLayoutSectionProps {
    maxSolutions?: number;
    onComplete?: () => void;
    isMobile?: boolean;
}

const SmartLayoutSection: React.FC<SmartLayoutSectionProps> = ({ maxSolutions = 4, onComplete, isMobile = false }) => {
    const { currentProject, updateProject } = useProject();
    const {
        config, setConfig,
        generateLayouts, isGenerating, solutions,
        hasAttempted, setHasAttempted,
        lastPlacedFrameIds, setLastPlacedFrameIds
    } = useSmartLayout();

    // Smart Loading State
    const [minLoading, setMinLoading] = useState(false);
    const [showDrafting, setShowDrafting] = useState(false);
    const loadingStartTime = React.useRef(0);
    const draftingTimer = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        if (isGenerating) {
            // Start Loading
            loadingStartTime.current = Date.now();
            setMinLoading(true);

            // Schedule "Drafting..." text to appear only after 100ms
            draftingTimer.current = setTimeout(() => {
                setShowDrafting(true);
            }, 100);
        } else {
            // Finished Loading
            const elapsed = Date.now() - loadingStartTime.current;

            // Cancel the "Drafting" timer if we finished fast
            if (draftingTimer.current) clearTimeout(draftingTimer.current);

            // Threshold: 100ms
            if (elapsed < 100) {
                // Fast path: Reset immediately
                setMinLoading(false);
                setShowDrafting(false);
            } else {
                // Slow path: Ensure we show the feedback for at least 600ms total
                const remaining = 600 - elapsed;
                setTimeout(() => {
                    setMinLoading(false);
                    setShowDrafting(false);
                }, Math.max(0, remaining));
            }
        }

        return () => {
            if (draftingTimer.current) clearTimeout(draftingTimer.current);
        };
    }, [isGenerating]);

    // Sync cursor with drafting state
    React.useEffect(() => {
        if (showDrafting) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = '';
        }
        return () => {
            document.body.style.cursor = '';
        };
    }, [showDrafting]);

    const handleGenerate = () => {
        if (!currentProject) return;
        setHasAttempted(true);

        // Reset the tracker when starting a new generation cycle
        setLastPlacedFrameIds([]);

        // Convert LibraryItems to RecommenderFrames
        const inventory: RecommenderFrame[] = [];

        currentProject.library.forEach(item => {
            // Count how many of this item are already on the wall
            const usedCount = currentProject.frames.filter(f => f.templateId === item.id).length;
            const availableCount = item.count - usedCount;

            if (availableCount > 0) {
                // INFLATE: Add border width to dimensions so the algorithm sees the full size
                // We add borderWidth * 2 because it's on both sides
                // CRITICAL FIX: Use 0.1 default to match standard app default, not 1.0
                const bWidth = item.borderWidth ?? 0.1;

                inventory.push({
                    id: item.id,
                    width: item.width + (bWidth * 2),
                    height: item.height + (bWidth * 2),
                    count: availableCount,
                    borderWidth: bWidth,
                    priority: 1
                });
            }
        });

        // Convert existing placed frames to Obstacles (Convert Pixels -> Inches)
        const obstacles = currentProject.frames.map((f) => {
            const bWidth = typeof f.borderWidth === 'number' ? f.borderWidth : 0.1;
            return {
                // INFLATE OBSTACLES: Move X/Y back by border width, increase W/H by 2*border
                // Logic: Accessing 'Outer' box from 'Inner' box
                x: (f.x / PPI) - bWidth,
                y: (f.y / PPI) - bWidth,
                width: f.width + (bWidth * 2),
                height: f.height + (bWidth * 2)
            };
        });

        generateLayouts({
            wall: currentProject.wallConfig,
            inventory,
            obstacles,
            config
        });
    };

    const applySolution = (solution: LayoutSolution) => {
        if (!currentProject) return;

        // 1. Convert PlacedFrames back to real Frames
        const newFrames: Frame[] = solution.frames.map(pf => {
            const libraryItem = currentProject.library.find(l => l.id === pf.libraryId);
            const safeX = isNaN(pf.x) ? 0 : pf.x;
            const safeY = isNaN(pf.y) ? 0 : pf.y;

            const bWidth = libraryItem?.borderWidth ?? 0.1;

            // DEFLATE: The solution gives us the 'Outer' box (including border).
            // We need to convert back to 'Inner' box for the Frame data structure.
            // Inner Width = Outer Width - (Border * 2)
            // Inner X     = Outer X + Border

            const outerW = pf.width;
            const outerH = pf.height;
            const outerX = safeX;
            const outerY = safeY;

            return {
                id: crypto.randomUUID(),
                width: Math.round((outerW - (bWidth * 2)) * 100) / 100,
                height: Math.round((outerH - (bWidth * 2)) * 100) / 100,
                x: Math.round((outerX + bWidth) * PPI * 10) / 10, // Round pixels to 1 decimal
                y: Math.round((outerY + bWidth) * PPI * 10) / 10, // Round pixels to 1 decimal
                rotation: pf.rotation,
                zIndex: 1, // simplified
                imageId: null, // No image yet
                templateId: pf.libraryId,
                borderWidth: bWidth,
                frameColor: libraryItem?.frameColor || '#000000',
                matted: libraryItem?.matted,
                shape: libraryItem?.shape || 'rect'
            };
        });

        // 2. Remove frames placed by the PREVIOUS 'applySolution' in this session
        const idsToRemove = lastPlacedFrameIds;
        const keptFrames = currentProject.frames.filter(f => !idsToRemove.includes(f.id));

        // 3. Track these new frames for next time
        setLastPlacedFrameIds(newFrames.map(f => f.id));

        // 4. Update Project
        updateProject(currentProject.id, {
            frames: [...keptFrames, ...newFrames]
        });

        // 5. Dismiss sheet
        if (onComplete) {
            onComplete();
        }
    };

    return (
        <div className={styles.container}>
            {/* --- VIBE --- */}
            {isMobile ? (
                <div className={styles.mobileConfigRow}>
                    <label className={styles.mobileLabel}>Vibe</label>
                    <div style={{ flex: 1 }}>
                        <select
                            value={config.algorithm}
                            onChange={e => setConfig({ ...config, algorithm: e.target.value as any })}
                            className={styles.mobileSelect}
                            style={{ width: '100%' }}
                        >
                            <option value="masonry">Masonry</option>
                            <option value="spiral">Center Out</option>
                            <option value="skyline">Skyline</option>
                            <option value="grid">Grid</option>
                            <option value="monte_carlo">Organic</option>
                        </select>
                    </div>
                </div>
            ) : (
                <div className={styles.configRow}>
                    <label>Vibe</label>
                    <div className={styles.row}>
                        <select
                            value={config.algorithm}
                            onChange={e => setConfig({ ...config, algorithm: e.target.value as any })}
                            className={styles.fluidInput}
                            style={{ width: '100%' }}
                        >
                            <option value="masonry">Masonry (Tetris)</option>
                            <option value="spiral">Center Out (Spiral)</option>
                            <option value="skyline">Skyline (Shelves)</option>
                            <option value="grid">Structured (Grid)</option>
                            <option value="monte_carlo">Organic (Scatter)</option>
                        </select>
                    </div>
                </div>
            )}

            {/* --- SHELVES (Conditional) --- */}
            {config.algorithm === 'skyline' && (
                isMobile ? (
                    <div className={styles.mobileConfigRow}>
                        <label className={styles.mobileLabel}>Shelves</label>
                        <div className={styles.mobileSliderContainer}>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={config.shelfCount || 1}
                                onChange={e => setConfig({ ...config, shelfCount: Math.max(1, Number(e.target.value)) })}
                                className={styles.mobileSlider}
                            />
                        </div>
                        <span className={styles.mobileValueDisplay}>{config.shelfCount || 1}</span>
                    </div>
                ) : (
                    <div className={styles.configRow}>
                        <label>Shelves</label>
                        <div className={styles.row}>
                            <RangeSlider
                                min={1}
                                max={5}
                                step={1}
                                value={config.shelfCount || 1}
                                onChange={val => setConfig({ ...config, shelfCount: Math.max(1, val) })}
                            />
                            <ValidatedNumberInput
                                value={config.shelfCount || 1}
                                onChange={val => setConfig({ ...config, shelfCount: Math.max(1, val) })}
                                min={1}
                                max={5}
                                step={1}
                                allowNegative={false}
                                className={styles.numberInput}
                            />
                        </div>
                    </div>
                )
            )}

            {/* --- SPACING --- */}
            {isMobile ? (
                <div className={styles.mobileConfigRow}>
                    <label className={styles.mobileLabel}>Spacing</label>
                    <div className={styles.mobileSliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={config.spacing}
                            onChange={e => setConfig({ ...config, spacing: Number(e.target.value) })}
                            className={styles.mobileSlider}
                        />
                    </div>
                    <span className={styles.mobileValueDisplay}>{config.spacing}"</span>
                </div>
            ) : (
                <div className={styles.configRow}>
                    <label>Spacing (in)</label>
                    <div className={styles.row}>
                        <RangeSlider
                            min={0}
                            max={10}
                            step={0.5}
                            value={config.spacing}
                            onChange={val => setConfig({ ...config, spacing: val })}
                        />
                        <ValidatedNumberInput
                            value={config.spacing}
                            onChange={val => setConfig({ ...config, spacing: val })}
                            min={0}
                            max={10}
                            step={0.5}
                            allowNegative={false}
                            className={styles.numberInput}
                        />
                    </div>
                </div>
            )}

            {/* --- MARGIN --- */}
            {isMobile ? (
                <div className={styles.mobileConfigRow}>
                    <label className={styles.mobileLabel}>Margin</label>
                    <div className={styles.mobileSliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={config.margin}
                            onChange={e => setConfig({ ...config, margin: Number(e.target.value) })}
                            className={styles.mobileSlider}
                        />
                    </div>
                    <span className={styles.mobileValueDisplay}>{config.margin}"</span>
                </div>
            ) : (
                <div className={styles.configRow}>
                    <label>Margin (in)</label>
                    <div className={styles.row}>
                        <RangeSlider
                            min={0}
                            max={10}
                            step={0.5}
                            value={config.margin}
                            onChange={val => setConfig({ ...config, margin: val })}
                        />
                        <ValidatedNumberInput
                            value={config.margin}
                            onChange={val => setConfig({ ...config, margin: val })}
                            min={0}
                            max={10}
                            step={0.5}
                            allowNegative={false}
                            className={styles.numberInput}
                        />
                    </div>
                </div>
            )}

            {isMobile ? (
                <div className={styles.mobileConfigRow}>
                    <label className={styles.mobileLabel}>Place all frames</label>
                    <input
                        type="checkbox"
                        checked={config.forceAll}
                        onChange={e => setConfig({ ...config, forceAll: e.target.checked })}
                        className={styles.toggleSwitch}
                    />
                </div>
            ) : (
                <div className={styles.checkboxRow}>
                    <input
                        type="checkbox"
                        checked={config.forceAll}
                        onChange={e => setConfig({ ...config, forceAll: e.target.checked })}
                        id="forceAllCb"
                    />
                    <label htmlFor="forceAllCb">Place all frames</label>
                </div>
            )}

            {/* Error / No Solution Feedback */}
            {!isGenerating && !minLoading && hasAttempted && solutions.length === 0 && (
                <div className={styles.errorMsg} style={{ color: '#d32f2f', marginTop: '10px', fontSize: '0.9rem' }}>
                    {config.forceAll
                        ? "Could not fit all frames on the wall. Try unchecking 'Place all frames' or reducing margin/spacing."
                        : "No valid layouts found. Try adjusting settings."}
                </div>
            )}

            <button
                className={`${styles.generateBtn} ${showDrafting ? styles.loading : ''}`}
                onClick={handleGenerate}
                disabled={isGenerating || minLoading}
            >
                {showDrafting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg className={styles.spinner} viewBox="0 0 50 50" style={{ width: '16px', height: '16px' }}>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" />
                        </svg>
                        Drafting...
                    </span>
                ) : 'Auto-Arrange'}
            </button>

            {/* Placeholder Empty State */}
            {!isGenerating && !minLoading && !hasAttempted && solutions.length === 0 && (
                <div className={styles.placeholderState}>
                    <div className={styles.placeholderIcon}>✨</div>
                    <p>Select settings and tap <b>Auto-Arrange</b> to see layout options here.</p>
                </div>
            )}

            {solutions.length > 0 && (
                <div className={styles.resultsGrid}>
                    {solutions.slice(0, maxSolutions).map((sol, idx) => (
                        <div key={sol.id} className={styles.resultCard} onClick={() => applySolution(sol)}>
                            <div className={styles.preview}>
                                {/* Mini Canvas Preview */}
                                {(() => {
                                    const wallW = currentProject!.wallConfig.width;
                                    const wallH = currentProject!.wallConfig.height;
                                    const wallRatio = wallW / wallH;

                                    return (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '10px'
                                        }}>
                                            <div style={{
                                                aspectRatio: `${wallRatio}`,
                                                width: wallRatio >= 2 ? '100%' : 'auto', // If very wide, fill width
                                                height: wallRatio < 2 ? '100%' : 'auto', // If taller or not too wide, fill height
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                position: 'relative',
                                                background: '#fff',
                                                boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                                            }}>
                                                {sol.frames.map((f, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${(f.x / wallW) * 100}%`,
                                                            top: `${(f.y / wallH) * 100}%`,
                                                            width: `${(f.width / wallW) * 100}%`,
                                                            height: `${(f.height / wallH) * 100}%`,
                                                            backgroundColor: '#eee',
                                                            border: '1px solid #999',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <span>Option {idx + 1} ({sol.frames.length} frames)</span>
                        </div>
                    ))}
                </div>
            )}
        </div >
    );
};

export default SmartLayoutSection;
