import React from 'react';
import { createPortal } from 'react-dom';
import styles from './DeleteConfirmDialog.module.css';

interface DeleteConfirmDialogProps {
    selectedCount: number;
    inUseCount: number;
    onDeleteUnused: () => void;
    onDeleteAll: () => void;
    onCancel: () => void;
}

/**
 * Dialog for confirming photo deletion.
 * Shows different options based on whether photos are in use.
 */
const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    selectedCount,
    inUseCount,
    onDeleteUnused,
    onDeleteAll,
    onCancel
}) => {
    const unusedCount = selectedCount - inUseCount;
    const hasInUse = inUseCount > 0;

    return createPortal(
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>Delete Photos</h3>

                {hasInUse ? (
                    <>
                        <p className={styles.message}>
                            <strong>{inUseCount}</strong> of <strong>{selectedCount}</strong> selected
                            photo{selectedCount > 1 ? 's are' : ' is'} currently used in frames.
                        </p>
                        <div className={styles.actions}>
                            {unusedCount > 0 && (
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={onDeleteUnused}
                                >
                                    Delete unused only ({unusedCount})
                                </button>
                            )}
                            <button
                                className={styles.dangerBtn}
                                onClick={onDeleteAll}
                            >
                                Delete all ({selectedCount})
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                        </div>
                        <p className={styles.warning}>
                            ⚠️ "Delete all" will also remove photos from frames
                        </p>
                    </>
                ) : (
                    <>
                        <p className={styles.message}>
                            Delete {selectedCount} photo{selectedCount > 1 ? 's' : ''}?
                        </p>
                        <div className={styles.actions}>
                            <button
                                className={styles.dangerBtn}
                                onClick={onDeleteAll}
                            >
                                Delete
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmDialog;
