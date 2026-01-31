import { useState } from 'react';
import { useLayout } from '../../hooks/useLayout';
import styles from './GlobalActions.module.css'; // Re-use styles for consistency
import HelpModal from '../Common/HelpModal';
import { Github, PanelRightOpen, PanelRightClose } from 'lucide-react';

const WindowControls = () => {
    const { isRightSidebarOpen, toggleRightSidebar } = useLayout();
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
                href="https://github.com/tstraub89/gallery_wall"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.helpBtn}
                title="View Source on GitHub"
            >
                <Github size={14} strokeWidth={2.5} />
            </a>

            <button className={styles.helpBtn} onClick={() => setShowHelp(true)} title="Show Help Guide">?</button>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

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
