import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './ProjectMenu.module.css';

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

    const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);
    const currentName = projects[currentProjectId]?.name || 'Select Project';

    const handleCreate = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            addProject(newName.trim());
            setIsCreating(false);
            setNewName('');
            setIsExpanded(false);
        }
    };

    return (
        <div className={styles.container}>
            <div
                className={styles.trigger}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className={styles.label}>Current Project:</span>
                <span className={styles.current}>{currentName}</span>
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
                                        if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
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
                            >
                                + New Project
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectMenu;
