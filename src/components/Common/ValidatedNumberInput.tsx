import React, { useState, useCallback, useMemo, ChangeEvent, KeyboardEvent, InputHTMLAttributes } from 'react';

interface ValidatedNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string | null; // Allow null/string for intermediate states
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    allowNegative?: boolean;
    className?: string;
    placeholder?: string;
    style?: React.CSSProperties;
    // ...props will capture other HTMLInput attributes
}

/**
 * A number input that:
 * - Uses local state while typing (allows any text for editing convenience)
 * - Commits valid values on blur or Enter
 */
const ValidatedNumberInput: React.FC<ValidatedNumberInputProps> = ({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    allowNegative = true,
    className,
    placeholder,
    style,
    ...props
}) => {
    // Track whether we're actively editing
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    // The displayed value: editValue when editing, otherwise the controlled value
    // Treat NaN as empty string to allow recovery
    const displayValue = isEditing
        ? editValue
        : (typeof value === 'number' && isNaN(value)
            ? ''
            : String(value ?? ''));

    const validate = useCallback((str: string): number | null => {
        const num = parseFloat(str);
        if (isNaN(num)) return null;
        if (!allowNegative && num < 0) return null;
        if (num < min || num > max) return null;
        return num;
    }, [min, max, allowNegative]);

    // Regex for filtering input
    const inputRegex = useMemo(() =>
        allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/,
        [allowNegative]
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // Basic filter: allow digits, one decimal, and optionally one leading minus
        if (inputRegex.test(newValue) || newValue === '' || newValue === '-') {
            setEditValue(newValue);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(true);
        setEditValue(e.target.value);
    };

    const handleBlur = () => {
        const validated = validate(editValue);
        if (validated !== null) {
            // Clamp to min/max
            const clamped = Math.min(max, Math.max(min, validated));
            onChange(clamped);
        }
        // Always exit editing mode (value will revert via displayValue)
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={placeholder}
            style={style}
            {...props}
        />
    );
};

export default ValidatedNumberInput;
