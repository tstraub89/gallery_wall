import React from 'react';
import styles from './TemplateList.module.css';
import { Template } from '../../types';
import templatesData from '../../data/templates.json';

// Cast the imported JSON to the Template type
const templates = templatesData as Template[];

interface TemplateListProps {
    onSelect: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ onSelect }) => {
    // Group templates by category
    const groupedTemplates = templates.reduce((acc, template) => {
        const category = template.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(template);
        return acc;
    }, {} as Record<string, Template[]>);

    // Keep categories in a specific order if desired, or just keys
    const categories = Object.keys(groupedTemplates).sort((a, b) => {
        // Essentials first, then specific order
        const order = ['Essentials', 'Organic', 'Architectural'];
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <div className={styles.container}>
            {categories.map(category => (
                <div key={category}>
                    <div className={styles.categoryHeader}>{category}</div>
                    <div className={styles.categoryGrid}>
                        {groupedTemplates[category].map(template => (
                            <div key={template.id} className={styles.card} onClick={() => onSelect(template)} title={template.description}>
                                <div className={styles.previewContainer}>
                                    {/* 
                                        Mini-map of the template. 
                                    */}
                                    {template.frames.map((frame, i) => {
                                        const scale = 1.2;
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
                                                    marginTop: `-${(frame.height * scale) / 2}px`
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.name}>{template.name}</div>
                                    {/* Meta hidden by CSS */}
                                    <div className={styles.meta}>{template.frames.length} frames</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TemplateList;
