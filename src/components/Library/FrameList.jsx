import React from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './FrameList.module.css';

const FrameList = () => {
    const { currentProject, setSelection } = useProject();

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project to view frames.</div>;
    }

    const handleFrameClick = (templateId) => {
        // Find all frames on the canvas that use this template
        const instances = currentProject.frames
            .filter(f => f.templateId === templateId)
            .map(f => f.id);

        if (instances.length > 0) {
            setSelection(instances);
            // Optional: Scroll canvas to first instance? 
            // For now just selecting is a huge help.
        }
    };

    const frames = currentProject.library || [];

    if (frames.length === 0) {
        return (
            <div className={styles.empty}>
                No frames in library.<br />Import a file or add manually.
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {frames.map((frame, index) => {
                const isUsed = currentProject.frames.some(f => f.templateId === frame.id);

                return (
                    <div
                        key={frame.id || index}
                        className={`${styles.frameItem} ${isUsed ? styles.used : ''}`}
                        draggable={!isUsed}
                        onClick={() => handleFrameClick(frame.id)}
                        onDragStart={(e) => {
                            if (isUsed) {
                                e.preventDefault();
                                return;
                            }
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
                            {isUsed && <div className={styles.usedLabel}>Used</div>}
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
    );
};

export default FrameList;
