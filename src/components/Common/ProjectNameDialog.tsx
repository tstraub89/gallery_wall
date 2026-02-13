import React, { useState, useEffect, useRef } from 'react';
import styles from './ProjectNameDialog.module.css';
import { X } from 'lucide-react';

interface ProjectNameDialogProps {
    onConfirm: (name: string) => void;
    onCancel: () => void;
    initialValue?: string;
    title?: string;
}

const ProjectNameDialog: React.FC<ProjectNameDialogProps> = ({
    onConfirm,
    onCancel,
    initialValue = '',
    title = 'New Project'
}) => {
    const [name, setName] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Short delay to ensure focus works on mobile keyboards
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
        }
    };

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{title}</h3>
                    <button className={styles.closeBtn} onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={styles.body}>
                    <p className={styles.label}>Enter a name for your project:</p>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Living Room Wall"
                    />
                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.confirmBtn} disabled={!name.trim()}>
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectNameDialog;
