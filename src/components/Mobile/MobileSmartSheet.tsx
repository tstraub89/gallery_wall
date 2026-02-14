import React, { useState, useEffect, useRef } from 'react';
import { useSwipeDismiss } from '../../hooks/useSwipeDismiss';
import { useProject } from '../../hooks/useProject';
import styles from './MobileLibrarySheet.module.css'; // Reuse sheet styles for consistency
import SmartFillTab from '../Library/SmartFillTab/SmartFillTab';
import SmartLayoutSection from '../Library/SmartLayout/SmartLayoutSection';
import { SmartLayoutProvider } from '../Library/SmartLayout/SmartLayoutContext';
import { useSelection } from '../../context/SelectionContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface MobileSmartSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSmartSheet: React.FC<MobileSmartSheetProps> = ({ isOpen, onClose }) => {
    const { currentProject } = useProject();
    const { selectedFrameIds } = useSelection();

    // Last used tab persistence
    // Defaults to 'auto_layout' per user preference
    const [lastTab, setLastTab] = useLocalStorage<'smart_fill' | 'auto_layout'>('mobile_smart_sheet_last_tab', 'auto_layout');
    const [activeTab, setActiveTab] = useState<'smart_fill' | 'auto_layout'>(lastTab);

    // Context Logic: Switch tab based on selection ONLY when opening
    const prevIsOpenRef = useRef(isOpen);

    useEffect(() => {
        // Run only on rising edge of isOpen (false -> true)
        if (isOpen && !prevIsOpenRef.current) {
            if (selectedFrameIds.length > 0) {
                // If frames selected, jump to Smart Fill (Context Aware)
                setActiveTab('smart_fill');
            } else {
                // Otherwise restore last used
                setActiveTab(lastTab);
            }
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, selectedFrameIds, lastTab]);

    // Update persistence when tab changes
    useEffect(() => {
        if (isOpen) {
            setLastTab(activeTab);
        }
    }, [activeTab, isOpen, setLastTab]);


    const scrollRef = useRef<HTMLDivElement>(null);
    const { handlers, swipeStyle, triggerDismiss } = useSwipeDismiss({
        onDismiss: onClose,
        scrollRef,
        isOpen
    });

    if (!isOpen || !currentProject) return null;

    return (
        <SmartLayoutProvider>
            <div className={styles.sheetOverlay} onClick={triggerDismiss}>
                <div
                    className={styles.sheetContent}
                    onClick={e => e.stopPropagation()}
                    style={swipeStyle}
                    {...handlers}
                >
                    <div className={styles.handleBar}>
                        <div className={styles.handle} />
                    </div>

                    <div className={styles.header}>
                        <div className={styles.tabs} style={{ padding: '0 20px', width: '100%', justifyContent: 'center' }}>
                            <button
                                className={`${styles.tab} ${activeTab === 'auto_layout' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('auto_layout')}
                                style={{ flex: 1 }}
                            >
                                Auto-Layout
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'smart_fill' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('smart_fill')}
                                style={{ flex: 1 }}
                            >
                                Smart Fill
                            </button>
                        </div>
                    </div>

                    <div className={styles.scrollArea} ref={scrollRef}>
                        {activeTab === 'auto_layout' && (
                            <div style={{ padding: '0 16px 30px 16px' }}>
                                <SmartLayoutSection
                                    maxSolutions={4}
                                    onComplete={onClose}
                                    isMobile={true}
                                />
                            </div>
                        )}

                        {activeTab === 'smart_fill' && (
                            <div style={{ padding: '16px' }}>
                                <SmartFillTab onClose={onClose} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SmartLayoutProvider>
    );
};

export default MobileSmartSheet;
