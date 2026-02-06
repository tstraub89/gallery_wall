import React, { useState } from 'react';
import ImportFile from './ImportFile';
import CommonSizePicker from './CommonSizePicker';
import ManualEntryForm from './ManualEntryForm';
import FrameList from './FrameList';
import PhotoLibrary from './PhotoLibrary';
import SmartLayoutSection from './SmartLayout/SmartLayoutSection';
import { SmartLayoutProvider } from './SmartLayout/SmartLayoutContext';
import ProBadge from '../Common/ProBadge';
import pkg from '../../../package.json';
import styles from './FrameLibrary.module.css';

const FrameLibrary: React.FC = () => {
    const [openSection, setOpenSection] = useState<string | null>('frames');
    const [isImportOpen, setImportOpen] = useState(false);
    const [isCommonOpen, setCommonOpen] = useState(false);
    const [isManualOpen, setManualOpen] = useState(false);

    return (
        <SmartLayoutProvider>
            <div className={styles.container}>
                <div className={styles.section}>
                    <div
                        className={`${styles.sectionHeader} ${openSection === 'frames' ? styles.active : ''}`}
                        onClick={() => setOpenSection(openSection === 'frames' ? null : 'frames')}
                    >
                        <h3>🖼️ Frames</h3>
                        <span>{openSection === 'frames' ? '▼' : '▶'}</span>
                    </div>
                    {openSection === 'frames' && (
                        <div className={styles.sectionContent}>
                            <div
                                className={styles.subHeader}
                                onClick={() => setCommonOpen(!isCommonOpen)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '12px' }}
                            >
                                <span>Common Sizes</span>
                                <span>{isCommonOpen ? '▼' : '▶'}</span>
                            </div>
                            {isCommonOpen && <CommonSizePicker />}

                            <div
                                className={styles.subHeader}
                                onClick={() => setImportOpen(!isImportOpen)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '12px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Import File</span>
                                    <ProBadge />
                                </div>
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
                            <FrameList />
                        </div>
                    )}
                </div>

                <div className={styles.section}>
                    <div
                        className={`${styles.sectionHeader} ${openSection === 'smart' ? styles.active : ''}`}
                        onClick={() => setOpenSection(openSection === 'smart' ? null : 'smart')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3>✨ Smart Layout</h3>
                            <ProBadge />
                        </div>
                        <span>{openSection === 'smart' ? '▼' : '▶'}</span>
                    </div>
                    {openSection === 'smart' && (
                        <div className={styles.sectionContent}>
                            <SmartLayoutSection maxSolutions={10} />
                        </div>
                    )}
                </div>

                <div className={styles.section}>
                    <div
                        className={`${styles.sectionHeader} ${openSection === 'photos' ? styles.active : ''}`}
                        onClick={() => setOpenSection(openSection === 'photos' ? null : 'photos')}
                    >
                        <h3>📷 Photos</h3>
                        <span>{openSection === 'photos' ? '▼' : '▶'}</span>
                    </div>
                    {openSection === 'photos' && (
                        <div className={styles.sectionContent}>
                            <PhotoLibrary />
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span>Gallery Planner v{pkg.version} beta</span>
                    <span style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-secondary)' }}>Pro features are free during beta</span>
                    <span style={{ marginTop: '6px', fontSize: '9px', opacity: 0.5 }}>© 2026 Timothy Straub</span>
                </div>
            </div>
        </SmartLayoutProvider>
    );
};

export default FrameLibrary;
