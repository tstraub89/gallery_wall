import React, { useState, FormEvent } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './ManualEntryForm.module.css';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';

const ManualEntryForm: React.FC = () => {
    const { currentProject, addToLibrary } = useProject();
    const [label, setLabel] = useState('');
    const [width, setWidth] = useState(8);
    const [height, setHeight] = useState(10);
    const [isMatted, setIsMatted] = useState(false);
    const [matWidth, setMatWidth] = useState(5);
    const [matHeight, setMatHeight] = useState(7);
    const [shape, setShape] = useState<'rect' | 'round'>('rect');
    const [frameColor, setFrameColor] = useState('#111111');
    const [borderWidth, setBorderWidth] = useState(1.0);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!currentProject) return;

        const frameDims = {
            width: width,
            height: height,
            label: label,
            shape: shape,
            frameColor: frameColor,
            borderWidth: borderWidth,
            matted: isMatted ? { width: matWidth, height: matHeight } : undefined
        };

        if (isNaN(frameDims.width) || isNaN(frameDims.height) || frameDims.width <= 0 || frameDims.height <= 0) {
            alert("Please enter valid width and height.");
            return;
        }

        addToLibrary(currentProject.id, frameDims);
        // Keep inputs but maybe reset matting flag?
        // setIsMatted(false);
        setLabel(''); // Reset label after add
    };

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <div className={styles.row}>
                <div className={styles.field} style={{ flex: 2 }}>
                    <label>Label (opt)</label>
                    <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Light Switch" />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label>Width</label>
                    <ValidatedNumberInput
                        value={width}
                        onChange={(val) => setWidth(val)}
                        min={0.1}
                        step={0.1}
                        allowNegative={false}
                    />
                </div>
                <div className={styles.field}>
                    <label>Height</label>
                    <ValidatedNumberInput
                        value={height}
                        onChange={(val) => setHeight(val)}
                        min={0.1}
                        step={0.1}
                        allowNegative={false}
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field} style={{ flex: 1 }}>
                    <label>Border</label>
                    <ValidatedNumberInput
                        value={borderWidth}
                        onChange={setBorderWidth}
                        min={0}
                        max={5}
                        step={0.1}
                    />
                </div>
                <div className={styles.field} style={{ flex: 2 }}>
                    <label>Shape</label>
                    <select value={shape} onChange={e => setShape(e.target.value as 'rect' | 'round')} className={styles.select}>
                        <option value="rect">Rectangle</option>
                        <option value="round">Round / Oval</option>
                    </select>
                </div>
                <div className={styles.field} style={{ flex: '0 0 45px' }}>
                    <label>Color</label>
                    <input
                        type="color"
                        value={frameColor}
                        onChange={e => setFrameColor(e.target.value)}
                        className={styles.colorPicker}
                        style={{ width: '45px', padding: '0', height: '31px' }} // Manual override for slightly wide look
                    />
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
                        <ValidatedNumberInput
                            value={matWidth}
                            onChange={(val) => setMatWidth(val)}
                            min={0.1}
                            step={0.1}
                            allowNegative={false}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Opening H</label>
                        <ValidatedNumberInput
                            value={matHeight}
                            onChange={(val) => setMatHeight(val)}
                            min={0.1}
                            step={0.1}
                            allowNegative={false}
                        />
                    </div>
                </div>
            )}

            <button type="submit" className={styles.addBtn}>+ Add Frame</button>
        </form>
    );
};

export default ManualEntryForm;
