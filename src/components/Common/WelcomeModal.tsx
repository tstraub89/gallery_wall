import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, Sparkles } from 'lucide-react';
import Logo from '../Header/Logo';
import styles from './WelcomeModal.module.css';

interface WelcomeModalProps {
    onLoadDemo: () => Promise<void>;
    onStartFresh: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onLoadDemo, onStartFresh }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLoadDemo = async () => {
        setIsLoading(true);
        try {
            await onLoadDemo();
        } catch (err) {
            console.error('Failed to load demo:', err);
            // Fall back to fresh start
            onStartFresh();
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.logoContainer}>
                    <Logo hideStatus />
                </div>
                <h1 className={styles.title}>Welcome to GalleryPlanner</h1>
                <p className={styles.subtitle}>
                    Design your perfect gallery wall arrangement before you start hammering nails.
                </p>
                <div className={styles.actions}>
                    <button
                        className={styles.primaryBtn}
                        onClick={handleLoadDemo}
                        disabled={isLoading}
                    >
                        <Sparkles size={20} />
                        {isLoading ? 'Loading...' : 'Try Demo Gallery'}
                    </button>
                    <button
                        className={styles.secondaryBtn}
                        onClick={onStartFresh}
                        disabled={isLoading}
                    >
                        <ImagePlus size={20} />
                        Start Fresh
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WelcomeModal;
