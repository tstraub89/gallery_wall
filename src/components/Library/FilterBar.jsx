import React, { useRef } from 'react';
import styles from './FilterBar.module.css';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';

const FilterBar = ({
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
    showSearch = true
}) => {
    const [showFilters, setShowFilters] = React.useState(false);
    const [showSort, setShowSort] = React.useState(false);

    const sortRef = useRef();
    const filterRef = useRef();

    useOnClickOutside(sortRef, () => setShowSort(false));
    useOnClickOutside(filterRef, () => setShowFilters(false));

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
                    {/* Sort Dropdown */}
                    <div className={styles.dropdownWrapper} ref={sortRef}>
                        <button
                            className={`${styles.iconBtn} ${showSort ? styles.active : ''}`}
                            onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
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
                            onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
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
