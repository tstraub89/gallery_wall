import React from 'react';
import styles from './RangeSlider.module.css';

interface RangeSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
    value,
    min,
    max,
    step = 1,
    onChange,
    className,
    style,
    ...props
}) => {
    // Calculate the percentage based on value relative to min/max
    const ratio = (value - min) / (max - min);

    // Clamp ratio between 0 and 1 just in case
    const safeRatio = Math.max(0, Math.min(1, ratio));

    // Calculate background style using the robust calc() logic
    // Formula: calc(8px + (100% - 16px) * ratio)
    // - 8px: half the thumb width (offset)
    // - 100% - 16px: available track width to traverse
    // - ratio: normalized 0-1 value
    const backgroundStyle = {
        background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) calc(8px + (100% - 16px) * ${safeRatio}), #e0e0e0 calc(8px + (100% - 16px) * ${safeRatio}), #e0e0e0 100%)`
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className={`${styles.slider} ${className || ''}`}
            style={{
                ...backgroundStyle,
                ...style // Allow overrides if absolutely necessary
            }}
            {...props}
        />
    );
};

export default RangeSlider;
