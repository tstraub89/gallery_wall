import React from 'react';
import ImportFile from './ImportFile';
import FrameList from './FrameList';
import styles from './FrameLibrary.module.css';

const FrameLibrary = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Frames</h2>
            </div>
            <ImportFile />
            <div className={styles.scrollArea}>
                <FrameList />
            </div>
        </div>
    );
};

export default FrameLibrary;
