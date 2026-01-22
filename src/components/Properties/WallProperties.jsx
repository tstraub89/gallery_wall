import React from 'react';
import styles from './PropertiesPanel.module.css';

const WallProperties = ({ currentProject, updateProject }) => {
    const wall = currentProject.wallConfig;
    const handleWallChange = (field, value) => {
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
                        <input className={styles.fluidInput} type="number" value={wall.width} onChange={(e) => handleWallChange('width', parseFloat(e.target.value))} />
                        <input className={styles.fluidInput} type="number" value={wall.height} onChange={(e) => handleWallChange('height', parseFloat(e.target.value))} />
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
