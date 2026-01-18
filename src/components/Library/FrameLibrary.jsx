import React, { useState } from 'react';
import ImportFile from './ImportFile';
import FrameList from './FrameList';
import PhotoLibrary from './PhotoLibrary';
import styles from './FrameLibrary.module.css';

const Section = ({ title, isOpen, onToggle, children }) => (
    <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={onToggle}>
            <h3>{title}</h3>
            <span>{isOpen ? '▼' : '▶'}</span>
        </div>
        {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
);

const FrameLibrary = () => {
    const [openSection, setOpenSection] = useState('frames'); // 'frames', 'photos'

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <div
                    className={`${styles.sectionHeader} ${openSection === 'frames' ? styles.active : ''}`}
                    onClick={() => setOpenSection(openSection === 'frames' ? null : 'frames')}
                >
                    <h3>Frames</h3>
                    <span>{openSection === 'frames' ? '▼' : '▶'}</span>
                </div>
                {openSection === 'frames' && (
                    <div className={styles.sectionContent}>
                        <ImportFile />
                        <div className={styles.scrollArea}>
                            <FrameList />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <div
                    className={`${styles.sectionHeader} ${openSection === 'photos' ? styles.active : ''}`}
                    onClick={() => setOpenSection(openSection === 'photos' ? null : 'photos')}
                >
                    <h3>Photos</h3>
                    <span>{openSection === 'photos' ? '▼' : '▶'}</span>
                </div>
                {openSection === 'photos' && (
                    <div className={styles.sectionContent}>
                        <PhotoLibrary />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrameLibrary;
