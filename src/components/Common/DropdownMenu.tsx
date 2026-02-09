import React, { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './DropdownMenu.module.css';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
    label?: ReactNode;
    onClick?: (e?: React.MouseEvent) => void;
    icon?: ReactNode;
    separator?: boolean;
    danger?: boolean;
    title?: string;
}

interface DropdownMenuProps {
    label: string;
    icon?: ReactNode;
    items?: DropdownItem[];
    children?: ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, items = [], children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
                                title={item.title}
                                onClick={(e) => {
                                    item.onClick?.(e);
                                    setIsOpen(false);
                                }}
                            >
                                {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
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
