import React from 'react';
import styles from './MobileAddFrameDialog.module.css'; // Re-using existing styles
import { COMMON_SIZES } from '../../constants/commonFrames';

interface MobileCommonFrameDialogProps {
    onClose: () => void;
    onAdd: (width: number, height: number, label: string) => void;
}

const MobileCommonFrameDialog: React.FC<MobileCommonFrameDialogProps> = ({ onClose, onAdd }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h3>Common Sizes</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </header>

                <div className={styles.form}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px 0' }}>
                        {COMMON_SIZES.map(size => (
                            <button
                                key={size.label}
                                className={styles.submitBtn}
                                style={{
                                    padding: '15px 5px',
                                    fontSize: '14px',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    border: '1px solid #ccc'
                                }}
                                onClick={() => onAdd(size.width, size.height, size.label)}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={onClose} style={{ width: '100%' }}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileCommonFrameDialog;
