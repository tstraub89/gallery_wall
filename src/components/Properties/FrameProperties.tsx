import React, { useMemo } from 'react';
import styles from './PropertiesPanel.module.css';
import { PPI } from '../../constants';
import ImageProperties from './ImageProperties';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import RangeSlider from '../Common/RangeSlider';
import {
    AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    Trash2, RefreshCw, Lock, Unlock
} from 'lucide-react';
import { Project, Frame, MatDimensions } from '../../types';
import { ProjectContextType } from '../../context/ProjectContextCore';

interface FramePropertiesProps {
    currentProject: Project;
    selectedFrameIds: string[];
    updateProject: ProjectContextType['updateProject'];
}

const FrameProperties: React.FC<FramePropertiesProps> = ({ currentProject, selectedFrameIds, updateProject }) => {
    // Memoize selected frames to ensure stability
    const selectedFrames = useMemo(() =>
        currentProject.frames.filter(f => selectedFrameIds.includes(f.id)),
        [currentProject.frames, selectedFrameIds]);

    const [activeTab, setActiveTab] = React.useState<'frame' | 'photo'>(() => {
        if (selectedFrames.length === 1 && selectedFrames[0].imageId) {
            return 'photo';
        }
        return 'frame';
    });

    // Switch to frame tab if no frames have photos and we're on photo tab
    React.useEffect(() => {
        const hasAnyPhotos = selectedFrames.some(f => f.imageId);
        if (activeTab === 'photo' && !hasAnyPhotos) {
            setActiveTab('frame');
        }
    }, [selectedFrames, activeTab]);

    // CRITICAL SAFETY: If we have IDs but no matching frames found (e.g. just deleted)
    if (selectedFrames.length === 0) {
        return <div className={styles.empty}>No frames selected</div>;
    }

    const getValue = <K extends keyof Frame>(key: K): Frame[K] | '' => {
        if (selectedFrames.length === 0) return '';
        const first = selectedFrames[0][key];
        const allSame = selectedFrames.every(f => {
            if (typeof first === 'number') {
                const val = f[key] as number | undefined;
                return typeof val === 'number' && Math.abs(val - (first as number)) < 0.01;
            }
            return f[key] === first;
        });
        const val = allSame ? first : '';
        if (typeof val === 'number') {
            return Math.round(val * 100) / 100 as any;
        }
        return val as any;
    };

    const updateAll = <K extends keyof Frame>(key: K, value: Frame[K]) => {
        const affectedTemplateIds = new Set<string>();
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                if (f.templateId) affectedTemplateIds.add(f.templateId);
                return { ...f, [key]: value };
            }
            return f;
        });

        // Sync back to library templates
        const updatedLibrary = currentProject.library.map(t => {
            if (affectedTemplateIds.has(t.id)) {
                return { ...t, [key]: value };
            }
            return t;
        });

        updateProject(currentProject.id, {
            frames: updatedFrames,
            library: updatedLibrary
        });
    };

    // Lock Logic
    const isLocked = !!getValue('locked');
    const toggleLock = () => {
        updateAll('locked', !isLocked);
    };

    // Visual Bounds Helper
    // We align based on the VISUAL edge (Frame + Border)
    const getVisualBounds = (f: Frame) => {
        const bWidth = typeof f.borderWidth === 'number' ? f.borderWidth : 0.1;
        return {
            left: f.x - (bWidth * PPI),
            top: f.y - (bWidth * PPI),
            right: f.x + (f.width * PPI) + (bWidth * PPI),
            bottom: f.y + (f.height * PPI) + (bWidth * PPI),
            width: (f.width * PPI) + (bWidth * 2 * PPI),
            height: (f.height * PPI) + (bWidth * 2 * PPI),
            bWidthPx: bWidth * PPI
        };
    };

    // Calculate selection bounds based on VISUAL edges
    const selectionBounds = useMemo(() => {
        if (selectedFrames.length === 0) return null;
        const first = getVisualBounds(selectedFrames[0]);
        let minL = first.left;
        let minT = first.top;
        let maxR = first.right;
        let maxB = first.bottom;

        selectedFrames.forEach(f => {
            const b = getVisualBounds(f);
            if (b.left < minL) minL = b.left;
            if (b.top < minT) minT = b.top;
            if (b.right > maxR) maxR = b.right;
            if (b.bottom > maxB) maxB = b.bottom;
        });

        return { minL, minT, maxR, maxB, width: maxR - minL, height: maxB - minT };
    }, [selectedFrames]);


    const minX = Math.min(...selectedFrames.map(f => f.x));
    const minY = Math.min(...selectedFrames.map(f => f.y));

    const updateRelative = (key: 'x' | 'y', newValue: number) => {
        const currentMin = key === 'x' ? minX : minY;
        const delta = newValue - currentMin;

        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, [key]: f[key] + delta };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const align = (type: 'left' | 'right' | 'top' | 'bottom' | 'middle' | 'center') => {
        const updatedFrames = currentProject.frames.map(f => {
            // IGNORE LOCKED FRAMES in alignment
            if (!selectedFrameIds.includes(f.id) || f.locked || !selectionBounds) return f;

            const vb = getVisualBounds(f);
            let newVisualLeft = vb.left;
            let newVisualTop = vb.top;

            switch (type) {
                case 'left':
                    newVisualLeft = selectionBounds.minL;
                    break;
                case 'right':
                    newVisualLeft = selectionBounds.maxR - vb.width;
                    break;
                case 'top':
                    newVisualTop = selectionBounds.minT;
                    break;
                case 'bottom':
                    newVisualTop = selectionBounds.maxB - vb.height;
                    break;
                case 'middle': {
                    const mid = selectionBounds.minT + (selectionBounds.height / 2);
                    newVisualTop = mid - (vb.height / 2);
                    break;
                }
                case 'center': {
                    const mid = selectionBounds.minL + (selectionBounds.width / 2);
                    newVisualLeft = mid - (vb.width / 2);
                    break;
                }
            }

            // Convert VISUAL back to INTERNAL (Inner Box)
            // InnerX = VisualLeft + BorderPx
            const bWidthPx = (typeof f.borderWidth === 'number' ? f.borderWidth : 0.1) * PPI;

            return {
                ...f,
                x: newVisualLeft + bWidthPx,
                y: newVisualTop + bWidthPx
            };
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Helper for complex matting updates
    const isMatted = !!getValue('matted');
    const matDims = getValue('matted') as MatDimensions | null;

    const handleToggleMatted = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (checked) {
            // Default 1-inch mat
            const first = selectedFrames[0];
            updateAll('matted', {
                width: Math.max(0.5, first.width - 2),
                height: Math.max(0.5, first.height - 2)
            });
        } else {
            updateAll('matted', null);
        }
    };

    const handleMatDimChange = (field: keyof MatDimensions, val: number) => {
        const currentMat = matDims || { width: 0, height: 0 };
        updateAll('matted', { ...currentMat, [field]: val });
    };

    const rotateFrame = () => {
        const affectedTemplateIds = new Set();
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                if (f.templateId) affectedTemplateIds.add(f.templateId);

                const newMatted = f.matted ? {
                    width: f.matted.height,
                    height: f.matted.width
                } : null;

                return {
                    ...f,
                    width: f.height,
                    height: f.width,
                    matted: newMatted || f.matted // Keep null if was null
                };
            }
            return f;
        });

        // Sync back to library templates
        const updatedLibrary = currentProject.library.map(t => {
            if (affectedTemplateIds.has(t.id)) {
                const newMatted = t.matted ? {
                    width: t.matted.height,
                    height: t.matted.width
                } : null;

                return {
                    ...t,
                    width: t.height,
                    height: t.width,
                    matted: newMatted || t.matted
                };
            }
            return t;
        });

        updateProject(currentProject.id, {
            frames: updatedFrames,
            library: updatedLibrary
        });
    };

    // Disable photo tab only if NO frames have photos
    const hasAnyPhotos = selectedFrames.some(f => f.imageId);
    const isPhotoTabDisabled = !hasAnyPhotos;

    return (
        <>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <h3>Properties ({selectedFrames.length})</h3>
                    <button
                        onClick={toggleLock}
                        className={styles.secondaryBtn}
                        title={isLocked ? "Unlock Frames" : "Lock Frames"}
                        style={{ padding: '4px 8px' }}
                    >
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'frame' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('frame')}
                >
                    Frame
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'photo' ? styles.activeTab : ''} ${isPhotoTabDisabled ? styles.disabledTab : ''}`}
                    onClick={() => !isPhotoTabDisabled && setActiveTab('photo')}
                    title={isPhotoTabDisabled ? "No photos in selected frames" : `Photo Settings${selectedFrames.length > 1 ? ` (${selectedFrames.filter(f => f.imageId).length})` : ''}`}
                >
                    Photo
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'frame' && (
                    <>
                        <div className={styles.propGroup}>
                            <label>Label (Optional)</label>
                            <input
                                type="text"
                                value={getValue('label') || ''}
                                onChange={(e) => updateAll('label', e.target.value)}
                                placeholder={(selectedFrames.length === 1 && !selectedFrames[0].label) ? "e.g. 'Light Switch'" : ""}
                                className={styles.fluidInput}
                            />
                        </div>

                        <div className={styles.propGroup}>
                            <label>Position (X / Y)</label>
                            <div className={styles.row}>
                                <ValidatedNumberInput
                                    className={styles.fluidInput}
                                    step={0.1}
                                    value={Math.round((minX / PPI) * 10) / 10}
                                    onChange={(val) => updateRelative('x', val * PPI)}
                                    allowNegative={true}
                                    disabled={isLocked}
                                />
                                <ValidatedNumberInput
                                    className={styles.fluidInput}
                                    step={0.1}
                                    value={Math.round((minY / PPI) * 10) / 10}
                                    onChange={(val) => updateRelative('y', val * PPI)}
                                    allowNegative={true}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Dimensions (W x H)</label>
                            <div className={styles.row}>
                                <div className={styles.inputStack} style={{ flex: 1 }}>
                                    <ValidatedNumberInput
                                        className={styles.fluidInput}
                                        step={0.1}
                                        value={getValue('width') || ''}
                                        onChange={(val) => updateAll('width', val)}
                                        min={0.1}
                                        allowNegative={false}
                                        placeholder={selectedFrames.length > 1 ? "-" : ""}
                                        disabled={isLocked}
                                    />
                                </div>
                                <div className={styles.inputStack} style={{ flex: 1 }}>
                                    <ValidatedNumberInput
                                        className={styles.fluidInput}
                                        step={0.1}
                                        value={getValue('height') || ''}
                                        onChange={(val) => updateAll('height', val)}
                                        min={0.1}
                                        allowNegative={false}
                                        placeholder={selectedFrames.length > 1 ? "-" : ""}
                                        disabled={isLocked}
                                    />
                                </div>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={rotateFrame}
                                    title="Swap Width and Height"
                                    style={{ flex: 0, padding: '0 8px', minWidth: 'auto' }}
                                    disabled={isLocked}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Alignment</label>
                            <div className={styles.row}>
                                <div className={styles.alignGroup}>
                                    <button className={styles.alignBtn} onClick={() => align('left')} title="Align Left">
                                        <AlignHorizontalJustifyStart size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('center')} title="Align Horizontal Center">
                                        <AlignHorizontalJustifyCenter size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('right')} title="Align Right">
                                        <AlignHorizontalJustifyEnd size={16} />
                                    </button>
                                </div>
                                <div className={styles.alignGroup}>
                                    <button className={styles.alignBtn} onClick={() => align('top')} title="Align Top">
                                        <AlignVerticalJustifyStart size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('middle')} title="Align Vertical Middle">
                                        <AlignVerticalJustifyCenter size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('bottom')} title="Align Bottom">
                                        <AlignVerticalJustifyEnd size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Border (in)</label>
                            <div className={styles.row}>
                                <RangeSlider
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={(getValue('borderWidth') as number) ?? 1.0}
                                    onChange={(val) => updateAll('borderWidth', Math.round(val * 10) / 10)}
                                />
                                <ValidatedNumberInput
                                    value={getValue('borderWidth') ?? 1.0}
                                    onChange={(val) => updateAll('borderWidth', val)}
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    allowNegative={false}
                                    className={styles.numberInput}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Shape</label>
                            <div className={styles.row}>
                                <select
                                    value={getValue('shape') || 'rect'}
                                    onChange={(e) => updateAll('shape', e.target.value)}
                                    className={styles.fluidInput}
                                >
                                    <option value="rect">Rectangular</option>
                                    <option value="round">Round / Oval</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Frame Color</label>
                            <div className={styles.colorRow}>
                                {[
                                    { color: '#111111', title: 'Black' },
                                    { color: '#ffffff', title: 'White' },
                                    { color: '#5d4037', title: 'Wood' },
                                    { color: '#d4af37', title: 'Gold' },
                                    { color: '#9e9e9e', title: 'Silver' },
                                ].map((preset) => (
                                    <button
                                        key={preset.color}
                                        className={`${styles.colorSwatch} ${getValue('frameColor') === preset.color ? styles.activeSwatch : ''} `}
                                        style={{ backgroundColor: preset.color }}
                                        onClick={() => updateAll('frameColor', preset.color)}
                                        title={preset.title}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={getValue('frameColor') || '#111111'}
                                    onChange={(e) => updateAll('frameColor', e.target.value)}
                                    className={styles.colorPicker}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <div className={styles.row} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="matted-toggle"
                                    checked={isMatted}
                                    onChange={handleToggleMatted}
                                />
                                <label htmlFor="matted-toggle">Matted?</label>
                            </div>
                            {isMatted && matDims && (
                                <div className={styles.row} style={{ marginTop: '4px', gap: '12px' }}>
                                    <div className={styles.inputStack}>
                                        <label>Opening W</label>
                                        <ValidatedNumberInput
                                            className={styles.fluidInput}
                                            step={0.1}
                                            value={matDims.width}
                                            onChange={(val) => handleMatDimChange('width', val)}
                                            min={0.1}
                                            allowNegative={false}
                                        />
                                    </div>
                                    <div className={styles.inputStack}>
                                        <label>Opening H</label>
                                        <ValidatedNumberInput
                                            className={styles.fluidInput}
                                            step={0.1}
                                            value={matDims.height}
                                            onChange={(val) => handleMatDimChange('height', val)}
                                            min={0.1}
                                            allowNegative={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'photo' && (
                    <ImageProperties
                        frames={selectedFrames}
                        updateProject={updateProject}
                        currentProject={currentProject}
                    />
                )}

                <button className={styles.deleteBtn} onClick={() => {
                    const updated = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
                    updateProject(currentProject.id, { frames: updated });
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Trash2 size={14} />
                    <span>Remove {selectedFrames.length > 1 ? 'Frames' : 'Frame'} from Canvas</span>
                </button>
            </div >
        </>
    );
};

export default FrameProperties;
