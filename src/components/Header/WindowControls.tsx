import React, { useState } from 'react';
import styles from './GlobalActions.module.css';
const ProUpgradeDialog = React.lazy(() => import('../Common/ProUpgradeDialog'));
import { Sparkles } from 'lucide-react';
import { useProModal } from '../../context/ProContext';
import { trackEvent } from '../../utils/analytics';

const WindowControls = () => {
    const [showPro, setShowPro] = useState(false);
    const { isPro } = useProModal();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            <button
                className={styles.proButton}
                onClick={() => {
                    if (!isPro) trackEvent('click_upgrade_header');
                    setShowPro(true);
                }}
                title={isPro ? "Pro Unlocked" : "During beta, Pro features are unlocked for free."}
                style={{ cursor: 'pointer', opacity: 1 }}
            >
                <Sparkles size={16} />
                <span>{isPro ? "Pro Unlocked!" : "Upgrade to Pro"}</span>
            </button>

            {showPro && (
                <React.Suspense fallback={null}>
                    <ProUpgradeDialog onClose={() => setShowPro(false)} />
                </React.Suspense>
            )}
        </div>
    );
};

export default WindowControls;
