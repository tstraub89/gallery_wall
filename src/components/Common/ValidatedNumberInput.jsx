import React, { useState, useCallback, useMemo } from 'react';

/**
 * A number input that:
 * - Uses local state while typing (allows any text for editing convenience)
 * - Commits valid values on blur or Enter
 * - Reverts to original value if invalid on blur
 * - Optionally filters non-numeric input as you type
 * 
 * @param {number} value - The controlled value from parent
 * @param {function} onChange - Called with new number when valid and committed
 * @param {number} min - Minimum allowed value (default: -Infinity)
 * @param {number} max - Maximum allowed value (default: Infinity)
 * @param {number} step - Step for input (unused, kept for API compatibility)
 * @param {boolean} allowNegative - Whether negative values are allowed (default: true)
 * @param {string} className - CSS class name
 * @param {string} placeholder - Placeholder text
 * @param {object} style - Inline styles
 */
const ValidatedNumberInput = ({
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
    const displayValue = isEditing ? editValue : (isNaN(value) ? '' : String(value ?? ''));

    const validate = useCallback((str) => {
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

    const handleChange = (e) => {
        const newValue = e.target.value;
        // Basic filter: allow digits, one decimal, and optionally one leading minus
        if (inputRegex.test(newValue) || newValue === '' || newValue === '-') {
            setEditValue(newValue);
        }
    };

    const handleFocus = (e) => {
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
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
