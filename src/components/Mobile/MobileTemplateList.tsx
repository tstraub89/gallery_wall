import React from 'react';
import { useProject } from '../../hooks/useProject';
import { Frame, Template } from '../../types';
import templatesData from '../../data/templates.json';
import styles from '../Library/TemplateList.module.css'; // Reusing styles
import { v4 as uuidv4 } from 'uuid';
import { PPI, DEFAULT_FRAME_BORDER_WIDTH, DEFAULT_FRAME_COLOR } from '../../constants';

const templates = templatesData as Template[];

interface MobileTemplateListProps {
    onClose: () => void;
}

const MobileTemplateList: React.FC<MobileTemplateListProps> = ({ onClose }) => {
    const { currentProject, updateProject, applyTemplate } = useProject();

    const handleApplyTemplate = (template: Template) => {
        if (!currentProject) return;

        // Check if current frames are "unaltered" from a template
        const allFramesAreTemplate = currentProject.frames.length > 0 &&
            currentProject.frames.every(f => f.templateId && !f.templateId.startsWith('manual_'));

        // If the project is empty OR exclusively template frames, we REPLACE.
        // This ensures the first template added is always centered correctly by applyTemplate.
        const shouldReplace = currentProject.frames.length === 0 || allFramesAreTemplate;

        if (shouldReplace) {
            // REPLACE: Use the robust logic from ProjectContext
            applyTemplate(currentProject.id, template.id);
        } else {
            // APPEND: Custom implementation to add frames BELOW existing ones

            // 1. Calculate wall center (in pixels)
            const centerX = (currentProject.wallConfig.width * PPI) / 2;
            const centerY = (currentProject.wallConfig.height * PPI) / 2;

            // 2. Determine Y offset (below lowest existing frame)
            let yStartPx = centerY;
            if (currentProject.frames.length > 0) {
                const maxY = Math.max(...currentProject.frames.map(f => f.y + f.height));
                yStartPx = maxY + (5 * PPI); // 5 inches padding below
            }

            // 3. Create new frames converted to PIXELS
            const newFrames = template.frames.map(tf => {
                // Dimensions: Inches -> Pixels
                const widthPx = tf.width * PPI;
                const heightPx = tf.height * PPI;

                // Position: Inches relative to center -> Pixels
                const xOffsetPx = tf.x * PPI;
                const yOffsetPx = tf.y * PPI;

                // Determine layout offset
                const offsetFromCenterY = yStartPx - centerY;

                return {
                    id: uuidv4(),
                    templateId: template.id, // Mark as part of this template (but appended)
                    width: widthPx,
                    height: heightPx,

                    // x: Center + Offset - HalfWidth
                    x: centerX + xOffsetPx - (widthPx / 2),

                    // y: Center + Offset + VerticalShift - HalfHeight
                    y: centerY + yOffsetPx + offsetFromCenterY - (heightPx / 2),

                    label: tf.label,
                    rotation: 0,
                    zIndex: currentProject.frames.length + 1,
                    frameColor: DEFAULT_FRAME_COLOR,
                    borderWidth: DEFAULT_FRAME_BORDER_WIDTH,
                    imageId: null,
                    imageState: null,
                    shape: 'rect',
                    matted: undefined
                } as Frame;
            });

            updateProject(currentProject.id, {
                frames: [...currentProject.frames, ...newFrames]
            });
        }

        onClose();
    };

    // Grouping Logic (Same as Desktop)
    const groupedTemplates = templates.reduce((acc, template) => {
        const category = template.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
    }, {} as Record<string, Template[]>);

    const categories = Object.keys(groupedTemplates).sort((a, b) => {
        const order = ['Essentials', 'Organic', 'Architectural'];
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <div className={styles.container} style={{
            padding: '0 10px 20px 10px',
            // OVERRIDE: Prevent nested scrolling. Let parent MobileLibrarySheet handle it.
            overflowY: 'visible',
            height: 'auto',
            maxHeight: 'none'
        }}>
            {/* Info Tip */}
            <div style={{
                fontSize: '12px',
                color: '#666',
                background: '#f5f5f7',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
            }}>
                Tap a template to add it. Existing custom layouts will be preserved.
            </div>

            {categories.map(category => (
                <div key={category}>
                    <div className={styles.categoryHeader} style={{ fontSize: '14px', marginTop: '16px' }}>{category}</div>
                    <div className={styles.categoryGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {groupedTemplates[category].map(template => {
                            // --- DYNAMIC SCALING LOGIC ---
                            // 1. Calculate bounding box of the template in INCHES
                            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                            template.frames.forEach(f => {
                                const halfW = f.width / 2;
                                const halfH = f.height / 2;
                                if (f.x - halfW < minX) minX = f.x - halfW;
                                if (f.x + halfW > maxX) maxX = f.x + halfW;
                                if (f.y - halfH < minY) minY = f.y - halfH;
                                if (f.y + halfH > maxY) maxY = f.y + halfH;
                            });

                            const width = maxX - minX;
                            const height = maxY - minY;
                            const maxDim = Math.max(width, height);

                            // 2. Calculate Scale
                            // Target area is roughly 150px. 
                            // We add 10 inches of padding (5 on each side) to ensure it's not edge-to-edge.
                            // Cap scale at 3.0 so small templates don't look huge.
                            const scale = Math.min(150 / (maxDim + 8), 3.0);

                            return (
                                <div
                                    key={template.id}
                                    className={styles.card}
                                    onClick={() => handleApplyTemplate(template)}
                                    style={{
                                        aspectRatio: '1/1',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div
                                        className={styles.previewContainer}
                                        style={{
                                            flex: 1,
                                            height: 'auto',
                                            background: '#f0f0f0',
                                            borderBottom: '1px solid #e0e0e0'
                                        }}
                                    >
                                        {template.frames.map((frame, i) => {
                                            return (
                                                <div
                                                    key={i}
                                                    className={styles.framePreview}
                                                    style={{
                                                        width: `${frame.width * scale}px`,
                                                        height: `${frame.height * scale}px`,
                                                        left: `calc(50% + ${frame.x * scale}px)`,
                                                        top: `calc(50% + ${frame.y * scale}px)`,
                                                        marginLeft: `-${(frame.width * scale) / 2}px`,
                                                        marginTop: `-${(frame.height * scale) / 2}px`,
                                                        borderWidth: '1px',
                                                        boxShadow: '1px 1px 3px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className={styles.info} style={{ padding: '10px 4px' }}>
                                        <div className={styles.name} style={{ fontSize: '12px', fontWeight: 600 }}>{template.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MobileTemplateList;
