import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ProUpgradeDialog.module.css';
import { Sparkles, Check, X } from 'lucide-react';
import { useProModal } from '../../context/ProContext';

interface ProUpgradeDialogProps {
    onClose: () => void;
}

const ProUpgradeDialog: React.FC<ProUpgradeDialogProps> = ({ onClose }) => {
    const { upgradeToPro, userProfile } = useProModal();
    const isAlreadyPro = userProfile?.isPro;

    const features = [
        "Smart Layout AI - Auto-arrange your gallery",
        "Save & Load Projects - Backup your walls to files",
        "Hanging Guides - PDF with exact measurements",
        "Export Photo Crops - High-res zip ready for printing",
        "Unlimited Custom Frames & Sizes",
        "Priority Support & Early Access"
    ];

    const handleUpgrade = async () => {
        await upgradeToPro();
        onClose();
    };

    const content = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} style={{ color: '#a855f7' }} />
                        <h2 style={{ margin: 0 }}>Upgrade to Pro</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <p style={{ marginBottom: '20px', color: '#636366', fontSize: '15px', lineHeight: '1.5' }}>
                        Unlock the full potential of GalleryPlanner and create your dream wall with ease.
                    </p>

                    <div className={styles.featureList}>
                        {features.map((f, i) => (
                            <div key={i} className={styles.feature}>
                                <div className={styles.checkCircle}>
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        className={styles.proButton} 
                        onClick={handleUpgrade}
                        disabled={isAlreadyPro}
                    >
                        {isAlreadyPro ? 'Pro Unlocked' : 'Claim Free Beta Access – $0.00'}
                    </button>

                    <div className={styles.betaNote}>
                        Early beta users get free lifetime access to core Pro features!
                    </div>
                </div>

                <footer className={styles.footer}>
                    <button className={styles.secondaryBtn} onClick={onClose}>
                        {isAlreadyPro ? 'Close' : 'Maybe Later'}
                    </button>
                </footer>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default ProUpgradeDialog;
