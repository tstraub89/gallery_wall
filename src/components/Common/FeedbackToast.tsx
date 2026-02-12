import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { trackEvent, FEEDBACK_EVENTS } from '../../utils/analytics';
import styles from './FeedbackToast.module.css';

interface FeedbackToastProps {
    onClose: () => void;
}

type Stage = 'initial' | 'text' | 'thanks';

const FEEDBACK_STORAGE_KEY = 'gallery_planner_feedback_shown';

const FeedbackToast: React.FC<FeedbackToastProps> = ({ onClose }) => {
    const [stage, setStage] = useState<Stage>('initial');
    const [feedback, setFeedback] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        trackEvent(FEEDBACK_EVENTS.FEEDBACK_SHOWN);
    }, []);

    const handleEnjoyment = (enjoying: boolean) => {
        trackEvent(FEEDBACK_EVENTS.FEEDBACK_CHOICE, { enjoying });
        if (enjoying) {
            setStage('text');
        } else {
            // If they don't enjoy it, we still want to know why!
            setStage('text');
        }
    };

    const handleSubmit = () => {
        if (feedback.trim()) {
            trackEvent(FEEDBACK_EVENTS.FEEDBACK_SUBMITTED, { feedback });
        }
        setStage('thanks');
        localStorage.setItem(FEEDBACK_STORAGE_KEY, 'true');

        // Auto-close after a few seconds
        setTimeout(() => {
            handleClose();
        }, 5000);
    };

    const handleClose = () => {
        setIsVisible(false);
        trackEvent(FEEDBACK_EVENTS.FEEDBACK_DISMISSED);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, 'true');
        setTimeout(onClose, 400); // Wait for animation
    };

    if (!isVisible) return null;

    return (
        <div className={styles.toast}>
            <button className={styles.closeButton} onClick={handleClose}>
                <X size={16} />
            </button>

            {stage === 'initial' && (
                <div className={styles.stage}>
                    <h3 className={styles.title}>Are you enjoying GalleryPlanner?</h3>
                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.primaryButton}
                            onClick={() => handleEnjoyment(true)}
                        >
                            Yes!
                        </button>
                        <button
                            className={styles.secondaryButton}
                            onClick={() => handleEnjoyment(false)}
                        >
                            No...
                        </button>
                    </div>
                </div>
            )}

            {stage === 'text' && (
                <div className={styles.stage}>
                    <h3 className={styles.title}>Would you like to provide any feedback?</h3>
                    <textarea
                        className={styles.textarea}
                        placeholder="What do you think? We'd love to hear from you."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        autoFocus
                    />
                    <div className={styles.footer}>
                        <button
                            className={styles.secondaryButton}
                            onClick={() => setStage('thanks')}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.primaryButton}
                            onClick={handleSubmit}
                            disabled={!feedback.trim()}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}

            {stage === 'thanks' && (
                <div className={styles.thanks}>
                    <Heart size={32} color="#FF2D55" fill="#FF2D55" />
                    <h3 className={styles.title}>Thank you for your feedback!</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#666' }}>It helps us make GalleryPlanner better.</p>
                    <a
                        href="mailto:hello@gallery-planner.com"
                        className={styles.emailLink}
                    >
                        Want to talk more? hello@gallery-planner.com
                    </a>
                </div>
            )}
        </div>
    );
};

export default FeedbackToast;
