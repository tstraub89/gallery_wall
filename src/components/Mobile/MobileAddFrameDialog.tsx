import React, { useState } from 'react';
import styles from './MobileAddFrameDialog.module.css';
import { DEFAULT_FRAME_BORDER_WIDTH } from '../../constants';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import ProBadge from '../Common/ProBadge';

interface MobileAddFrameDialogProps {
    onClose: () => void;
    onAdd: (width: number, height: number, shape: 'rect' | 'round', matted: boolean, borderWidth: number) => void;
}

const MobileAddFrameDialog: React.FC<MobileAddFrameDialogProps> = ({ onClose, onAdd }) => {
    const [width, setWidth] = useState(12);
    const [height, setHeight] = useState(16);
    const [shape, setShape] = useState<'rect' | 'round'>('rect');
    const [matted, setMatted] = useState(false);
    const [borderWidth, setBorderWidth] = useState(DEFAULT_FRAME_BORDER_WIDTH);

    const handleSubmit = () => {
        onAdd(width, height, shape, matted, borderWidth);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h3>Add Custom Frame</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </header>

                <div className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Width (in)</label>
                            <ValidatedNumberInput
                                value={width}
                                onChange={setWidth}
                                min={4}
                                max={60}
                                step={1}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Height (in)</label>
                            <ValidatedNumberInput
                                value={height}
                                onChange={setHeight}
                                min={4}
                                max={60}
                                step={1}
                                className={styles.inputField}
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field} style={{ flex: 1 }}>
                            <label>Border (in)</label>
                            <ValidatedNumberInput
                                value={borderWidth}
                                onChange={setBorderWidth}
                                min={0}
                                max={5}
                                step={0.1}
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.field} style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <label style={{ margin: 0 }}>Shape</label>
                                <ProBadge />
                            </div>
                            <select
                                className={styles.shapeSelect}
                                value={shape}
                                onChange={(e) => setShape(e.target.value as 'rect' | 'round')}
                            >
                                <option value="rect">Rectangle</option>
                                <option value="round">Round</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.checkboxRow} onClick={() => setMatted(!matted)}>
                        <input
                            type="checkbox"
                            checked={matted}
                            onChange={(e) => setMatted(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.checkboxLabel}>Add Matting</span>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button className={styles.submitBtn} onClick={handleSubmit}>Add Frame</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAddFrameDialog;
