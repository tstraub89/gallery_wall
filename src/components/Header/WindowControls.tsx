import React, { useState } from 'react';
import { useLayout } from '../../hooks/useLayout';
import styles from './GlobalActions.module.css'; // Re-use styles for consistency
// import HelpModal from '../Common/HelpModal';
const HelpModal = React.lazy(() => import('../Common/HelpModal'));
const ProUpgradeDialog = React.lazy(() => import('../Common/ProUpgradeDialog'));
import { Sparkles, PanelRightOpen, PanelRightClose, Bug } from 'lucide-react';
import { useBugReporter } from '../../hooks/useBugReporter';

const WindowControls = () => {
    const { isRightSidebarOpen, toggleRightSidebar } = useLayout();
    const [showHelp, setShowHelp] = useState(false);
    const [showPro, setShowPro] = useState(false);
    const { reportBug } = useBugReporter();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
                className={styles.proButton}
                onClick={() => setShowPro(true)}
                title="During beta, Pro features are unlocked for free."
                style={{ marginRight: '8px', cursor: 'pointer', opacity: 1 }}
            >
                <Sparkles size={16} />
                <span>Upgrade to Pro</span>
            </button>

            <button className={styles.helpBtn} onClick={reportBug} title="Report an Issue">
                <Bug size={18} />
            </button>

            <button className={styles.helpBtn} onClick={() => setShowHelp(true)} title="Show Help Guide">?</button>

            {showHelp && (
                <React.Suspense fallback={null}>
                    <HelpModal onClose={() => setShowHelp(false)} />
                </React.Suspense>
            )}

            {showPro && (
                <React.Suspense fallback={null}>
                    <ProUpgradeDialog onClose={() => setShowPro(false)} />
                </React.Suspense>
            )}

            <div className={styles.divider} />

            <button
                onClick={toggleRightSidebar}
                className={styles.iconBtn}
                title={isRightSidebarOpen ? "Collapse Properties Panel" : "Expand Properties Panel"}
            >
                {isRightSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
        </div>
    );
};

export default WindowControls;
