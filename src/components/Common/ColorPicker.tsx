import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ColorPicker.module.css';
import ProBadge from './ProBadge';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
    align?: 'left' | 'right' | 'project-left' | 'project-right';
}

const PRESETS = [
    { color: '#111111', title: 'Black' },
    { color: '#ffffff', title: 'White' },
    { color: '#5d4037', title: 'Wood' },
    { color: '#d4af37', title: 'Gold' },
    { color: '#9e9e9e', title: 'Silver' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            updateCoords();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    const renderPopup = () => {
        if (!isOpen) return null;

        // Determine popup positioning based on alignment
        const style: React.CSSProperties = {
            position: 'absolute',
            top: `${coords.top + (align.startsWith('project') ? 16 : 40)}px`,
            zIndex: 10000,
        };

        if (align === 'project-right') {
            style.left = `${coords.left + 44}px`;
            style.transform = 'translateY(-50%)';
        } else if (align === 'project-left') {
            style.left = `${coords.left - 12}px`;
            style.transform = 'translate( -100%, -50% )';
        } else if (align === 'left') {
            style.left = `${coords.left}px`;
        } else {
            style.left = `${coords.left + 32}px`;
            style.transform = 'translateX(-100%)';
        }

        return createPortal(
            <div
                className={styles.popup}
                style={style}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className={styles.popupHeader}>Standard Colors</div>
                <div className={styles.grid}>
                    {PRESETS.map((p) => (
                        <button
                            key={p.color}
                            type="button"
                            className={`${styles.swatch} ${value === p.color ? styles.activeSwatch : ''}`}
                            style={{ backgroundColor: p.color }}
                            onClick={() => {
                                onChange(p.color);
                                setIsOpen(false);
                            }}
                            title={p.title}
                        />
                    ))}
                </div>

                <div className={styles.popupHeader}>
                    Custom Color
                    <ProBadge style={{ scale: '0.7', marginLeft: '4px' }} />
                </div>
                <div className={styles.customRow}>
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={styles.nativePicker}
                    />
                    <input
                        type="text"
                        value={value.startsWith('#') ? value : `#${value}`}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#') && val.length > 0) val = `#${val}`;
                            onChange(val);
                        }}
                        className={styles.hexInput}
                        placeholder="#000000"
                        maxLength={7}
                    />
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={styles.container} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                style={{ backgroundColor: value }}
                title="Select Color"
            />
            {renderPopup()}
        </div>
    );
};

export default ColorPicker;
