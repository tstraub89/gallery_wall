import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { parseFrameFile } from '../../utils/frameParser';
import styles from './ImportFile.module.css';

const ImportFile = () => {
    const { addProject, addToLibrary, currentProjectId } = useProject();
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState('');
    const [isHxW, setIsHxW] = useState(false); // Default WxH

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let processedCount = 0;

        for (const file of files) {
            const text = await file.text();
            const { frames } = parseFrameFile(text);

            if (frames.length > 0) {
                if (!currentProjectId) {
                    addProject(file.name.replace('.txt', ''));
                }

                // Add frames to library
                frames.forEach(frame => {
                    let { width, height, matted } = frame;

                    // Swap if HxW
                    if (isHxW) {
                        [width, height] = [height, width];
                        if (matted) {
                            [matted.width, matted.height] = [matted.height, matted.width];
                        }
                    }

                    addToLibrary(currentProjectId, { ...frame, width, height, matted });
                });

                processedCount += frames.length;
            }
        }

        setStatus(`Imported ${processedCount} frames.`);
        setTimeout(() => setStatus(''), 3000);

        // Reset input
        e.target.value = null;
    };

    const triggerUpload = () => fileInputRef.current.click();

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <label className={styles.toggle}>
                    <input
                        type="checkbox"
                        checked={isHxW}
                        onChange={(e) => setIsHxW(e.target.checked)}
                    />
                    <span>Input is Height x Width?</span>
                </label>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt"
                multiple
                style={{ display: 'none' }}
            />
            <button className={styles.uploadBtn} onClick={triggerUpload}>
                <Upload size={16} />
                <span>Import Text File(s)</span>
            </button>
            {status && <span className={styles.status}>{status}</span>}
        </div>
    );
};

export default ImportFile;
