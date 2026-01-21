import React, { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Adjust position if menu goes off screen
    const menuWidth = 180;
    const menuHeight = items.length * 36 + 16;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

    return (
        <>
            <div
                className={styles.backdrop}
                onMouseDown={e => e.stopPropagation()}
                onMouseUp={e => e.stopPropagation()}
                onClick={onClose}
                onContextMenu={e => { e.preventDefault(); onClose(); }}
            />
            <div
                ref={menuRef}
                className={styles.menu}
                style={{ top: adjustedY, left: adjustedX }}
                onMouseDown={e => e.stopPropagation()}
                onMouseUp={e => e.stopPropagation()}
                onContextMenu={e => e.preventDefault()}
            >
                {items.map((item, index) => (
                    item.separator ? (
                        <div key={`sep-${index}`} className={styles.separator} />
                    ) : (
                        <button
                            key={item.label}
                            className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                onClose();
                            }}
                        >
                            <span className={styles.label}>{item.label}</span>
                            {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                        </button>
                    )
                ))}
            </div>
        </>
    );
};

export default ContextMenu;
