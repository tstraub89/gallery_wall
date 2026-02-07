import React, { useRef } from 'react';
import styles from './FilterBar.module.css';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

interface SortOption {
    value: string;
    label: string;
}

interface FilterOption {
    key: string;
    label: string;
}

interface FilterBarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    sortOptions?: SortOption[];
    currentSort: string;
    onSortChange: (val: string) => void;
    filterOptions?: FilterOption[];
    activeFilters?: Record<string, boolean>;
    onFilterChange: (key: string, val: boolean) => void;
    onClear?: () => void;
    placeholder?: string;
    showSearch?: boolean;
}

import { Eye } from 'lucide-react';

interface ViewOptionItem {
    id: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'item' | 'header' | 'divider';
}

const FilterBar: React.FC<FilterBarProps & { viewOptions?: ViewOptionItem[] }> = ({
    searchTerm,
    onSearchChange,
    sortOptions = [],
    currentSort,
    onSortChange,
    filterOptions = [],
    activeFilters = {},
    onFilterChange,
    onClear,
    placeholder = "Search...",
    showSearch = true,
    viewOptions
}) => {
    const [showFilters, setShowFilters] = React.useState(false);
    const [showSort, setShowSort] = React.useState(false);
    const [showView, setShowView] = React.useState(false);

    const sortRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(sortRef, () => setShowSort(false));
    useOnClickOutside(filterRef, () => setShowFilters(false));
    useOnClickOutside(viewRef, () => setShowView(false));

    const hasActiveFilters = Object.values(activeFilters).some(Boolean);

    return (
        <div className={styles.container}>
            <div className={styles.searchRow}>
                {showSearch && (
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={placeholder}
                        />
                    </div>
                )}

                <div className={styles.controls} style={{ marginLeft: showSearch ? 0 : 'auto' }}>
                    {/* View Options Dropdown */}
                    {viewOptions && viewOptions.length > 0 && (
                        <div className={styles.dropdownWrapper} ref={viewRef}>
                            <button
                                className={`${styles.iconBtn} ${showView ? styles.active : ''}`}
                                onClick={() => { setShowView(!showView); setShowSort(false); setShowFilters(false); }}
                                title="View Options"
                            >
                                <Eye size={18} />
                            </button>

                            {showView && (
                                <div className={styles.dropdown} style={{ minWidth: '160px' }}>
                                    <div className={styles.dropdownHeader}>View Options</div>
                                    {viewOptions.map((opt, idx) => {
                                        if (opt.type === 'header') {
                                            return (
                                                <div key={idx} className={styles.dropdownHeader} style={{ borderBottom: 'none', paddingTop: '12px' }}>
                                                    {opt.label}
                                                </div>
                                            );
                                        }
                                        if (opt.type === 'divider') {
                                            return <div key={idx} style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />;
                                        }
                                        return (
                                            <button
                                                key={opt.id}
                                                className={`${styles.dropdownItem} ${opt.checked ? styles.selected : ''}`}
                                                onClick={() => {
                                                    if (!opt.disabled && opt.onClick) {
                                                        opt.onClick();
                                                        // Keep menu open for toggles? Standard UI usually closes, but for options sometimes stays.
                                                        // Let's close for now to be consistent with Sort/Filter.
                                                        setShowView(false);
                                                    }
                                                }}
                                                disabled={opt.disabled}
                                                style={opt.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                {opt.label}
                                                {opt.checked && <span>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sort Dropdown */}
                    <div className={styles.dropdownWrapper} ref={sortRef}>
                        <button
                            className={`${styles.iconBtn} ${showSort ? styles.active : ''}`}
                            onClick={() => { setShowSort(!showSort); setShowFilters(false); setShowView(false); }}
                            title="Sort Order"
                        >
                            <ArrowUpDown size={18} />
                        </button>

                        {showSort && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>Sort By</div>
                                {sortOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`${styles.dropdownItem} ${currentSort === opt.value ? styles.selected : ''}`}
                                        onClick={() => {
                                            onSortChange(opt.value);
                                            setShowSort(false);
                                        }}
                                    >
                                        {opt.label}
                                        {currentSort === opt.value && <span>✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className={styles.dropdownWrapper} ref={filterRef}>
                        <button
                            className={`${styles.iconBtn} ${hasActiveFilters ? styles.active : ''}`}
                            onClick={() => { setShowFilters(!showFilters); setShowSort(false); setShowView(false); }}
                            title="Filters"
                        >
                            <Filter size={18} />
                        </button>

                        {showFilters && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <span>Filter</span>
                                    {hasActiveFilters && (
                                        <button
                                            className={styles.clearBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClear && onClear();
                                            }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {filterOptions.map(opt => (
                                    <label key={opt.key} className={styles.dropdownItem}>
                                        <span>{opt.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={!!activeFilters[opt.key]}
                                            onChange={(e) => onFilterChange(opt.key, e.target.checked)}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
