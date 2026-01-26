import React, { useState, useRef, useEffect } from 'react';
import styles from './DropdownMenu.module.css';
import { ChevronDown } from 'lucide-react';

const DropdownMenu = ({ label, icon, items = [], children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={styles.container} ref={containerRef}>
            <div
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {icon && <span className={styles.icon}>{icon}</span>}
                {label}
                <ChevronDown size={12} className={styles.chevron} />
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {items.map((item, index) => {
                        if (item.separator) {
                            return <div key={index} className={styles.separator} />;
                        }
                        return (
                            <div
                                key={index}
                                className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                                onClick={(e) => {
                                    item.onClick(e);
                                    setIsOpen(false);
                                }}
                            >
                                {item.label}
                            </div>
                        );
                    })}
                    {children}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
