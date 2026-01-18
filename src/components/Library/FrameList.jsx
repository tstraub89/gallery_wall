import React from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './FrameList.module.css';

const FrameList = () => {
    const { currentProject } = useProject();

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project to view frames.</div>;
    }

    const frames = currentProject.library || [];

    if (frames.length === 0) {
        return (
            <div className={styles.empty}>
                No frames in library.<br />Import a file or add manually.
            </div>
        );
    }

    // Grouping? The requirements say "Visual frame list with dimensions displayed".
    // Also "Duplicate frames (for multiple frames of same size)".
    // If I parsed "5x7" twice, do I show it twice? Yes, per requirements "Duplicate frames".

    return (
        <div className={styles.list}>
            {frames.map((frame, index) => {
                const isUsed = currentProject.frames.some(f => f.templateId === frame.id);

                return (
                    <div
                        key={frame.id || index}
                        className={`${styles.frameItem} ${isUsed ? styles.used : ''}`}
                        draggable={!isUsed}
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
