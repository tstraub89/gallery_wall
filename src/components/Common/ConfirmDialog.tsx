import React from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

/**
 * Reusable confirmation dialog for yes/no questions.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    isDanger = false
}) => {
    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button
                        className={isDanger ? styles.dangerBtn : styles.primaryBtn}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
