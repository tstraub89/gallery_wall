import React, { useState, useRef } from 'react';
import { useProject } from '../../hooks/useProject';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import styles from './ProjectMenu.module.css';
import ConfirmDialog from '../Common/ConfirmDialog';
import ProBadge from '../Common/ProBadge';
const ProjectMenu = () => {
    const {
        projects,
        currentProjectId,
        switchProject,
        addProject,
        deleteProject
    } = useProject();

    const [isExpanded, setIsExpanded] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(containerRef, () => {
        if (isExpanded) setIsExpanded(false);
    });

    const projectList = Object.values(projects).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const currentProjectData = currentProjectId ? projects[currentProjectId] : null;
    const currentName = currentProjectData?.name || 'Select Project';

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addProject(newName.trim());
            setIsCreating(false);
            setNewName('');
            setIsExpanded(false);
        }
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div
                className={styles.trigger}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className={styles.label}>Current Project:</span>
                <span className={styles.current}>
                    {currentName}
                    {currentProjectData?.isDemo && (
                        <span className={styles.playgroundBadge} title="Pro features are unlocked for this example project!">
                            ✨ Playground
                        </span>
                    )}
                </span>
                <span className={styles.arrow}>▼</span>
            </div>

            {isExpanded && (
                <div className={styles.dropdown}>
                    <div className={styles.list}>
                        {projectList.map(p => (
                            <div
                                key={p.id}
                                className={`${styles.item} ${p.id === currentProjectId ? styles.active : ''}`}
                                onClick={() => {
                                    switchProject(p.id);
                                    setIsExpanded(false);
                                }}
                            >
                                <span className={styles.itemName}>{p.name}</span>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setProjectToDelete({ id: p.id, name: p.name });
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.footer}>
                        {isCreating ? (
                            <form onSubmit={handleCreate} className={styles.createForm}>
                                <input
                                    autoFocus
                                    placeholder="Project Name"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                                <button type="submit">Create</button>
                            </form>
                        ) : (
                            <button
                                className={styles.createBtn}
                                onClick={() => setIsCreating(true)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span>+ New Project</span>
                                <ProBadge />
                            </button>
                        )}
                    </div>
                </div>
            )}
            {projectToDelete && (
                <ConfirmDialog
                    title="Delete Project"
                    message={`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    onConfirm={() => {
                        deleteProject(projectToDelete.id);
                        setProjectToDelete(null);
                    }}
                    onCancel={() => setProjectToDelete(null)}
                    isDanger={true}
                />
            )}
        </div>
    );
};

export default ProjectMenu;
