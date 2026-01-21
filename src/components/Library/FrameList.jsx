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

    const handleFrameClick = (templateId) => {
        const instances = currentProject.frames
            .filter(f => f.templateId === templateId)
            .map(f => f.id);

        if (instances.length > 0) {
            setSelection(instances);
        }
    };

    const handleDeleteTemplate = (e, templateId) => {
        e.stopPropagation();
        setFrameToRemove(templateId);
    };

    const frames = currentProject.library || [];

    if (frames.length === 0) {
        return (
            <div className={styles.empty}>
                No frames in library.<br />Import a file or add manually above.
            </div>
        );
    }

    return (
        <>
            <div className={styles.list}>
                {frames.map((frame, index) => {
                    const isUsed = currentProject.frames.some(f => f.templateId === frame.id);

                    return (
                        <div
                            key={frame.id || index}
                            className={`${styles.frameItem} ${isUsed ? styles.used : ''}`}
                            draggable={true}
                            onClick={() => handleFrameClick(frame.id)}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({
                                    type: 'FRAME_LIBRARY_ITEM',
                                    frame
                                }));
                            }}
                        >
                            <div
                                className={styles.framePreview}
                                style={{
                                    aspectRatio: `${frame.width}/${frame.height}`
                                }}
                            >
                                {frame.matted && (
                                    <div className={styles.mattedInner} />
                                )}
                                {isUsed && <div className={styles.usedLabel}>Placed</div>}

                                {!isUsed && (
                                    <button
                                        className={styles.removeBtn}
                                        onClick={(e) => handleDeleteTemplate(e, frame.id)}
                                        title="Remove from library"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <div className={styles.frameInfo}>
                                <div className={styles.dims}>
                                    {frame.width}" x {frame.height}"
                                </div>
                                {frame.matted && (
                                    <div className={styles.mattedInfo}>
                                        Matted: {frame.matted.width}" x {frame.matted.height}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
