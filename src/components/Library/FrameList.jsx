import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './FrameList.module.css';
import ConfirmDialog from '../Common/ConfirmDialog';

const FrameList = () => {
    const { currentProject, setSelection, removeFromLibrary } = useProject();
    const [frameToRemove, setFrameToRemove] = useState(null); // templateId

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project to view frames.</div>;
    }

    const templates = currentProject.library || [];
    const instances = currentProject.frames || [];

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



    return (
        <>
            <div className={styles.list}>
                {templates.map((template) => {
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
                                {!isPlaced && (
                                    <button className={styles.removeBtn} onClick={(e) => handleDeleteTemplate(e, template.id)} title="Remove from library">×</button>
                                )}
                            </div>
                            <div className={styles.frameInfo}>
                                <div className={styles.topInfo}>
                                    <div className={styles.dims}>
                                        {template.label ? (
                                            <>
                                                <span style={{ fontWeight: 700, marginRight: '6px' }}>{template.label}</span>
                                                <span style={{ fontWeight: 400, color: '#666', fontSize: '0.9em' }}>
                                                    ({template.width}" x {template.height}")
                                                </span>
                                            </>
                                        ) : (
                                            `${template.width}" x ${template.height}"`
                                        )}
                                    </div>
                                    {isPlaced && <span className={styles.placedPill}>Placed</span>}
                                </div>
                                <div className={styles.subInfo}>
                                    {template.isDuplicate ? '(Duplicated)' : 'Original Library Item'}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {templates.length === 0 && (
                    <div className={styles.empty}>
                        No frames yet.<br />Import a file or add manually above.
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
