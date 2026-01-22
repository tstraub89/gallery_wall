import React from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './PropertiesPanel.module.css';

// Sub-components
import FrameProperties from './FrameProperties';
import WallProperties from './WallProperties';

const PropertiesPanel = () => {
    const { currentProject, selectedFrameIds, updateProject } = useProject();

    if (!currentProject) {
        return <div className={styles.empty}>Select a project</div>;
    }

    const hasSelection = selectedFrameIds.length > 0;

    return (
        <div className={styles.container}>
            {hasSelection ? (
                <FrameProperties
                    currentProject={currentProject}
                    selectedFrameIds={selectedFrameIds}
                    updateProject={updateProject}
                />
            ) : (
                <WallProperties
                    currentProject={currentProject}
                    updateProject={updateProject}
                />
            )}
        </div>
    );
};

export default PropertiesPanel;
