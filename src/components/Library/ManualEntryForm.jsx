import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './ManualEntryForm.module.css';

const ManualEntryForm = () => {
    const { currentProject, addToLibrary } = useProject();
    const [width, setWidth] = useState('8');
    const [height, setHeight] = useState('10');
    const [isMatted, setIsMatted] = useState(false);
    const [matWidth, setMatWidth] = useState('5');
    const [matHeight, setMatHeight] = useState('7');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentProject) return;

        const frameDims = {
            width: parseFloat(width),
            height: parseFloat(height),
            matted: isMatted ? { width: parseFloat(matWidth), height: parseFloat(matHeight) } : null
        };

        if (isNaN(frameDims.width) || isNaN(frameDims.height)) {
            alert("Please enter valid width and height.");
            return;
        }

        addToLibrary(currentProject.id, frameDims);
        // Keep inputs but maybe reset matting flag?
        // setIsMatted(false);
    };

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Width</label>
                    <input type="number" step="0.1" value={width} onChange={e => setWidth(e.target.value)} />
                </div>
                <div className={styles.field}>
                    <label>Height</label>
                    <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} />
                </div>
            </div>

            <div className={styles.mattingToggle}>
                <label>
                    <input type="checkbox" checked={isMatted} onChange={e => setIsMatted(e.target.checked)} />
                    Matted?
                </label>
            </div>

            {isMatted && (
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label>Opening W</label>
                        <input type="number" step="0.1" value={matWidth} onChange={e => setMatWidth(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label>Opening H</label>
                        <input type="number" step="0.1" value={matHeight} onChange={e => setMatHeight(e.target.value)} />
                    </div>
                </div>
            )}

            <button type="submit" className={styles.addBtn}>+ Add Frame</button>
        </form>
    );
};

export default ManualEntryForm;
