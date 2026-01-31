import React from 'react';
import styles from './PropertiesPanel.module.css';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import { Project, WallConfig } from '../../types';
import { ProjectContextType } from '../../context/ProjectContextCore';

interface WallPropertiesProps {
    currentProject: Project;
    updateProject: ProjectContextType['updateProject'];
}

const WallProperties: React.FC<WallPropertiesProps> = ({ currentProject, updateProject }) => {
    const wall = currentProject.wallConfig;
    const handleWallChange = <K extends keyof WallConfig>(field: K, value: WallConfig[K]) => {
        updateProject(currentProject.id, { wallConfig: { ...wall, [field]: value } });
    };

    return (
        <>
            <div className={styles.header}><h3>Wall Settings</h3></div>
            <div className={styles.content}>
                <div className={styles.propGroup}>
                    <label>Wall Name</label>
                    <input type="text" value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} />
                </div>
                <div className={styles.propGroup}>
                    <label>Dimensions (WxH)</label>
                    <div className={styles.row}>
                        <ValidatedNumberInput
                            className={styles.fluidInput}
                            value={wall.width}
                            onChange={(val) => handleWallChange('width', val)}
                            min={1}
                            allowNegative={false}
                            step={1}
                        />
                        <ValidatedNumberInput
                            className={styles.fluidInput}
                            value={wall.height}
                            onChange={(val) => handleWallChange('height', val)}
                            min={1}
                            allowNegative={false}
                            step={1}
                        />
                    </div>
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Type</label>
                    <select value={wall.type} onChange={(e) => handleWallChange('type', e.target.value)}>
                        <option value="flat">Flat Wall</option>
                        <option value="staircase-asc">Staircase (Ascending)</option>
                        <option value="staircase-desc">Staircase (Descending)</option>
                    </select>
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Color</label>
                    <input type="color" value={wall.backgroundColor} onChange={(e) => handleWallChange('backgroundColor', e.target.value)} style={{ width: '100%', height: 32 }} />
                </div>
            </div>
        </>
    );
};

export default WallProperties;
