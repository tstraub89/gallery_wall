import React from 'react';
import styles from './ProjectSwitcher.module.css';
import { useProject } from '../../hooks/useProject';
import { Plus, Trash2, Check, X } from 'lucide-react';
import ConfirmDialog from '../Common/ConfirmDialog';

interface ProjectSwitcherProps {
    onClose: () => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ onClose }) => {
    const { projects, currentProjectId, switchProject, addProject, deleteProject } = useProject();
    const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);

    const sortedProjects = Object.values(projects).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const handleSelect = (id: string) => {
        if (id !== currentProjectId) {
            switchProject(id);
        }
        onClose();
    };

    const handleNew = () => {
        const id = addProject("New Project");
        switchProject(id);
        onClose();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setProjectToDelete(id);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            deleteProject(projectToDelete);
            setProjectToDelete(null);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Switch Project</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.list}>
                    {sortedProjects.map(p => (
                        <div
                            key={p.id}
                            className={`${styles.item} ${p.id === currentProjectId ? styles.active : ''}`}
                            onClick={() => handleSelect(p.id)}
                        >
                            <div className={styles.info}>
                                <div className={styles.name}>{p.name}</div>
                                <div className={styles.date}>{new Date(p.updatedAt || 0).toLocaleDateString()}</div>
                            </div>
                            {p.id === currentProjectId && <Check size={18} className={styles.check} />}

                            {/* Don't allow deleting the only project seamlessly here without more logic, 
                                but ProjectContext handles "last project" deletion by creating a new one. 
                                We should probably just allow it. */}
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDelete(p.id, e)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button className={styles.newBtn} onClick={handleNew}>
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
            </div>

            {projectToDelete && (
                <ConfirmDialog
                    title="Delete Project"
                    message="Are you sure? This cannot be undone."
                    confirmLabel="Delete"
                    isDanger
                    onConfirm={confirmDelete}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </div>
    );
};

export default ProjectSwitcher;
