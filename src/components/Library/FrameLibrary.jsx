import React, { useState } from 'react';
import ImportFile from './ImportFile';
import ManualEntryForm from './ManualEntryForm';
import FrameList from './FrameList';
import PhotoLibrary from './PhotoLibrary';
import pkg from '../../../package.json';
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
    const [openSection, setOpenSection] = useState('frames');
    const [isImportOpen, setImportOpen] = useState(false);
    const [isManualOpen, setManualOpen] = useState(false);

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
                        <div
                            className={styles.subHeader}
                            onClick={() => setImportOpen(!isImportOpen)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '12px' }}
                        >
                            <span>Import File</span>
                            <span>{isImportOpen ? '▼' : '▶'}</span>
                        </div>
                        {isImportOpen && <ImportFile />}

                        <div
                            className={styles.subHeader}
                            onClick={() => setManualOpen(!isManualOpen)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '12px' }}
                        >
                            <span>Add Manually</span>
                            <span>{isManualOpen ? '▼' : '▶'}</span>
                        </div>
                        {isManualOpen && <ManualEntryForm />}
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

            <div className={styles.footer}>
                <span>Gallery Planner v{pkg.version}</span>
            </div>
        </div>
    );
};

export default FrameLibrary;
